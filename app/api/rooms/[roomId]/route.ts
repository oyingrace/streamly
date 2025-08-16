import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// GET - Get room details or participants
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'get_participants') {
      // Get room ID from room_id
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_id', roomId)
        .single();

      if (roomError) {
        console.error('Error finding room:', roomError);
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      // Get active participants
      const { data: participants, error: participantsError } = await supabase
        .from('room_participants')
        .select('user_id, username, pfp_url, role')
        .eq('room_id', room.id)
        .eq('is_active', true);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
      }

      return NextResponse.json({ participants });
    }

    if (action === 'get_messages') {
      // Get room ID from room_id
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_id', roomId)
        .single();

      if (roomError) {
        console.error('Error finding room:', roomError);
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      // Get recent messages with usernames
      const { data: messages, error: messagesError } = await supabase
        .from('stream_messages')
        .select('id, message, user_id, username, created_at')
        .eq('room_id', room.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
      }

      return NextResponse.json({ messages: messages.reverse() });
    }

    // Default: Get room details
    const { data: room, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_id', roomId)
      .single();

    if (error) {
      console.error('Error fetching room:', error);
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Error in GET /api/rooms/[roomId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update room status (start/end stream)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { action, userId, username, pfpUrl } = await request.json();

    if (action === 'start_stream') {
      // Start streaming
              const { data, error } = await supabase
          .from('rooms')
          .update({
            status: 'live',
            stream_started_at: new Date().toISOString()
          })
          .eq('room_id', roomId)
          .select()
          .single();

      if (error) {
        console.error('Error starting stream:', error);
        return NextResponse.json({ error: 'Failed to start stream' }, { status: 500 });
      }

      // Add host as participant
      await supabase
        .from('room_participants')
        .insert({
          room_id: data.id,
          user_id: userId,
          username: username,
          pfp_url: pfpUrl,
          role: 'host'
        });

      // Update viewer count to include host
      const { data: participants, error: countError } = await supabase
        .from('room_participants')
        .select('id')
        .eq('room_id', data.id)
        .eq('is_active', true);

      if (!countError && participants) {
        await supabase
          .from('rooms')
          .update({ current_viewers: participants.length })
          .eq('id', data.id);
      }

      return NextResponse.json({ room: data });
    }

    if (action === 'end_stream') {
      // End streaming
              const { data, error } = await supabase
          .from('rooms')
          .update({
            status: 'ended',
            stream_ended_at: new Date().toISOString()
          })
          .eq('room_id', roomId)
          .select()
          .single();

      if (error) {
        console.error('Error ending stream:', error);
        return NextResponse.json({ error: 'Failed to end stream' }, { status: 500 });
      }

      // Mark all participants as inactive
      await supabase
        .from('room_participants')
        .update({
          is_active: false,
          left_at: new Date().toISOString()
        })
        .eq('room_id', data.id);

      // Reset viewer count to 0 when stream ends
      await supabase
        .from('rooms')
        .update({ current_viewers: 0 })
        .eq('id', data.id);

      return NextResponse.json({ room: data });
    }

    if (action === 'join_viewer') {
      // Join as viewer
              const { data: room, error: roomError } = await supabase
          .from('rooms')
          .select('id')
          .eq('room_id', roomId)
          .eq('status', 'live')
          .single();

      if (roomError) {
        console.error('Error finding room:', roomError);
        return NextResponse.json({ error: 'Room not found or not live' }, { status: 404 });
      }

      // Add viewer as participant
      const { error: participantError } = await supabase
        .from('room_participants')
        .insert({
          room_id: room.id,
          user_id: userId,
          username: username,
          pfp_url: pfpUrl,
          role: 'viewer'
        });

      if (participantError) {
        console.error('Error adding participant:', participantError);
        return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
      }

      // Update viewer count
      const { data: participants, error: countError } = await supabase
        .from('room_participants')
        .select('id')
        .eq('room_id', room.id)
        .eq('is_active', true);

      if (!countError && participants) {
        await supabase
          .from('rooms')
          .update({ current_viewers: participants.length })
          .eq('id', room.id);
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'leave_viewer') {
      // Leave as viewer
              const { data: room, error: roomError } = await supabase
          .from('rooms')
          .select('id')
          .eq('room_id', roomId)
          .single();

      if (roomError) {
        console.error('Error finding room:', roomError);
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      // Mark participant as inactive
      await supabase
        .from('room_participants')
        .update({
          is_active: false,
          left_at: new Date().toISOString()
        })
        .eq('room_id', room.id)
        .eq('user_id', userId);

      // Update viewer count
      const { data: participants, error: countError } = await supabase
        .from('room_participants')
        .select('id')
        .eq('room_id', room.id)
        .eq('is_active', true);

      if (!countError && participants) {
        await supabase
          .from('rooms')
          .update({ current_viewers: participants.length })
          .eq('id', room.id);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in PATCH /api/rooms/[roomId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
