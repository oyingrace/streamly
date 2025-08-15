import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

// GET - Get all live streams for landing page
export async function GET() {
  try {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select(`
        room_id,
        host_username,
        current_viewers,
        total_viewers,
        created_at,
        stream_started_at
      `)
      .eq('status', 'live')
      .order('stream_started_at', { ascending: false });

    if (error) {
      console.error('Error fetching live streams:', error);
      return NextResponse.json({ error: 'Failed to fetch live streams' }, { status: 500 });
    }

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Error in GET /api/rooms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new room
export async function POST(request: NextRequest) {
  try {
    const { roomId, hostUserId, hostUsername } = await request.json();

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        room_id: roomId,
        host_user_id: hostUserId,
        host_username: hostUsername,
        status: 'created'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating room:', error);
      return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
    }

    return NextResponse.json({ room: data });
  } catch (error) {
    console.error('Error in POST /api/rooms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
