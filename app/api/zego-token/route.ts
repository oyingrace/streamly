import { NextRequest, NextResponse } from 'next/server';
const { generateToken04 } = require('../../lib/zegoServerAssistant');

export async function POST(request: NextRequest) {
  try {
    const { userID, roomID } = await request.json();
    
    const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID || '0');
    const serverSecret = process.env.ZEGO_SERVER_SECRET;
    
    if (!appID || !serverSecret) {
      return NextResponse.json(
        { error: 'Zego configuration missing' },
        { status: 500 }
      );
    }

    // Token expiration time (1 hour)
    const effectiveTimeInSeconds = 3600;
    
    // Payload with room permissions
    const payloadObject = {
      room_id: roomID,
      privilege: {
        1: 1,   // loginRoom: 1 pass, 0 not pass
        2: 1    // publishStream: 1 pass, 0 not pass
      },
      stream_id_list: null
    };
    
    const payload = JSON.stringify(payloadObject);
    
    console.log('Generating token with:', {
      appID,
      userID,
      roomID,
      effectiveTimeInSeconds,
      payload
    });
    
    // Generate token using official Zego method
    const token = generateToken04(
      appID,
      userID,
      serverSecret,
      effectiveTimeInSeconds,
      payload
    );
    
    console.log('Token generated successfully, length:', token?.length);
    
    return NextResponse.json({ token });
    
  } catch (error: any) {
    console.error('Error generating token:', error);
    
    // Handle Zego-specific errors
    if (error.errorCode !== undefined) {
      return NextResponse.json(
        { 
          error: 'Token generation failed',
          errorCode: error.errorCode,
          errorMessage: error.errorMessage
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
