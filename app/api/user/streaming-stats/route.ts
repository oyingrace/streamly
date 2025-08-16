import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Query to check if user has any session with >= 2 minutes (120 seconds)
    const { data: sessions, error } = await supabase
      .from('room_participants')
      .select(`
        id,
        room_id,
        role,
        joined_at,
        left_at,
        rooms!inner(
          room_id,
          status,
          stream_duration
        )
      `)
      .eq('user_id', userId)
      .not('left_at', 'is', null) // Only completed sessions
      .gte('left_at', 'joined_at + interval \'2 minutes\'') // Sessions >= 2 minutes
      .order('left_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch streaming stats' },
        { status: 500 }
      );
    }

    // Check if user has any session >= 2 minutes
    const hasEligibleSession = sessions && sessions.length > 0;

    // Get the most recent eligible session for additional info
    const latestSession = sessions?.[0];

    return NextResponse.json({
      eligible: hasEligibleSession,
      latestSession: latestSession ? {
        roomId: latestSession.rooms.room_id,
        role: latestSession.role,
        duration: latestSession.left_at && latestSession.joined_at 
          ? Math.floor((new Date(latestSession.left_at).getTime() - new Date(latestSession.joined_at).getTime()) / 1000)
          : null,
        completedAt: latestSession.left_at
      } : null
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
