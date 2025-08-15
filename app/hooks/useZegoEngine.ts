'use client';

import { useEffect, useRef, useState } from 'react';

interface UseZegoEngineProps {
  roomId: string;
  isHost: boolean;
  roomData: any;
  currentUserID: string;
  onViewersListUpdate?: (viewers: Array<{userID: string; userName?: string}>) => void;
}

export function useZegoEngine({ roomId, isHost, roomData, currentUserID, onViewersListUpdate }: UseZegoEngineProps) {
  const [zegoEngine, setZegoEngine] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [viewersList, setViewersList] = useState<Array<{userID: string; userName?: string}>>([]);
  const [messages, setMessages] = useState<Array<{id: string; text: string; userID: string; userName?: string; timestamp: number}>>([]);
  const [isWatching, setIsWatching] = useState(false);
  
  const viewersListRef = useRef<Array<{userID: string; userName?: string}>>([]);
  const hasInitializedRef = useRef(false);
  const initializationPromiseRef = useRef<Promise<void> | null>(null);

  // Function to fetch participants from database
  const fetchParticipantsFromDB = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}?action=get_participants`);
      if (response.ok) {
        const data = await response.json();
        const participants = data.participants || [];
        
        // Transform database participants to match our interface
        const viewers = participants.map((participant: any) => ({
          userID: participant.user_id,
          userName: participant.username
        }));
        
        setViewersList(viewers);
        viewersListRef.current = viewers;
        setViewerCount(viewers.length);
        
        // Notify parent component
        if (onViewersListUpdate) {
          onViewersListUpdate(viewers);
        }
      }
    } catch (error) {
      console.error('Error fetching participants from database:', error);
    }
  };

  // Fetch participants from database when room data is available
  useEffect(() => {
    if (roomData && roomData.id) {
      fetchParticipantsFromDB();
    }
  }, [roomData]);

  // Singleton initialization function
  const initializeZego = useRef(async () => {
    if (hasInitializedRef.current) {
      console.log('🔍 [DEBUG] Already initialized, returning existing promise');
      return initializationPromiseRef.current;
    }

    if (initializationPromiseRef.current) {
      console.log('🔍 [DEBUG] Initialization in progress, returning existing promise');
      return initializationPromiseRef.current;
    }

    console.log('🔍 [DEBUG] Starting new initialization...');
    hasInitializedRef.current = true;

    initializationPromiseRef.current = (async () => {
      // Check if we're in the browser
      if (typeof window === 'undefined') {
        console.log('Not in browser, skipping Zego initialization');
        return;
      }

      try {
        // Initialize ZegoExpressEngine
        const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID || '0');
        const server = process.env.NEXT_PUBLIC_ZEGO_SERVER_URL || '';
        
        if (!appID || !server) {
          console.error('Zego App ID or Server URL not configured');
          return;
        }

        console.log('Initializing Zego engine in browser...');
        
        // Dynamically import Zego SDK to prevent SSR errors
        const { ZegoExpressEngine } = await import('zego-express-engine-webrtc');
        const zg = new ZegoExpressEngine(appID, server);
        
        setZegoEngine(zg);

        // Set up event callbacks
        zg.on('roomStateUpdate', (roomID: any, state: any, errorCode: any, extendedData: any) => {
          console.log('Room state update:', roomID, state, errorCode);
          if (state === 'CONNECTED') {
            setIsLoggedIn(true);
          } else if (state === 'DISCONNECTED') {
            setIsLoggedIn(false);
          }
        });

        zg.on('roomUserUpdate', (roomID: any, updateType: any, userList: any) => {
          console.log('🔍 [DEBUG] === ROOM USER UPDATE ===');
          console.log('🔍 [DEBUG] Room user update:', roomID, updateType, userList);
          console.log('🔍 [DEBUG] User list details:', {
            updateType,
            userCount: userList.length,
            users: userList.map((user: any) => ({
              userID: user.userID,
              userName: user.userName
            }))
          });
          console.log('🔍 [DEBUG] Current user ID:', currentUserID);
          console.log('🔍 [DEBUG] Current viewers list before update:', viewersListRef.current);
          
          // Fetch updated participants from database when users join/leave
          fetchParticipantsFromDB();
        });

        zg.on('roomStreamUpdate', async (roomID: any, updateType: any, streamList: any, extendedData: any) => {
          console.log('Room stream update:', roomID, updateType, streamList);
          
          // Fetch updated participants when stream starts/ends
          fetchParticipantsFromDB();
          
          if (updateType === 'ADD') {
            // Step 3 & 4: New stream added, start playing the stream (for viewers)
            for (const stream of streamList) {
              try {
                console.log('✅ Step 3: Starting to play remote stream:', stream.streamID);
                
                // Step 3: Start playing the stream
                const remoteStream = await zg.startPlayingStream(stream.streamID);
                console.log('✅ Step 3: Remote stream started successfully');
                
                // Step 4: Create video view
                const remoteView = zg.createRemoteStreamView(remoteStream);
                console.log('✅ Step 4: Remote stream view created');
                
                // Create a unique container for each remote stream
                const containerId = `remote-video-${stream.streamID}`;
                let container = document.getElementById(containerId);
                if (!container) {
                  container = document.createElement('div');
                  container.id = containerId;
                  container.className = 'absolute top-0 left-0 w-full h-full z-0';
                  document.getElementById('remote-video')?.appendChild(container);
                }
                
                // Step 4: Display the video with audio enabled
                remoteView.play(containerId, { enableAutoplayDialog: true });
                console.log('✅ Step 4: Remote stream playing in container:', containerId);
                
                // Ensure audio is enabled for viewers
                try {
                  // Enable audio for the remote stream
                  await zg.mutePlayStreamAudio(stream.streamID, false);
                  console.log('✅ Audio enabled for remote stream:', stream.streamID);
                } catch (error) {
                  console.error('❌ Error enabling audio for remote stream:', error);
                }
                
                console.log('🎉 Complete flow: Viewer can now see and hear the stream!');
                
                // Set watching state for viewers
                if (!isHost) {
                  setIsWatching(true);
                }
              } catch (error) {
                console.error('❌ Error in Steps 3-4 (playing remote stream):', error);
              }
            }
          } else if (updateType === 'DELETE') {
            // Stream deleted, stop playing the stream
            for (const stream of streamList) {
              try {
                console.log('Stopping remote stream:', stream.streamID);
                await zg.stopPlayingStream(stream.streamID);
                
                // Remove the container
                const containerId = `remote-video-${stream.streamID}`;
                const container = document.getElementById(containerId);
                if (container) {
                  container.remove();
                }
              } catch (error) {
                console.error('Error stopping remote stream:', error);
              }
            }
          }
        });

        // Handle barrage messages
        zg.on('IMRecvBarrageMessage', (roomID: any, messageList: any) => {
          console.log('Received barrage messages:', messageList);
          messageList.forEach((msg: any) => {
            const newMessage = {
              id: `msg_${Date.now()}_${Math.random()}`,
              text: msg.message,
              userID: msg.fromUser.userID,
              userName: msg.fromUser.userName,
              timestamp: Date.now()
            };
            setMessages(prev => [...prev, newMessage]);
          });
        });

        // Set up publishing callbacks
        zg.on('publisherStateUpdate', (result: any) => {
          console.log('Publisher state update:', result);
        });

        zg.on('publishQualityUpdate', (streamID: any, stats: any) => {
          console.log('Publish quality update:', streamID, stats);
        });

        // Set up playing callbacks
        zg.on('playerStateUpdate', (result: any) => {
          console.log('Player state update:', result);
        });

        zg.on('playQualityUpdate', (streamID: any, stats: any) => {
          console.log('Play quality update:', streamID, stats);
        });

        // Step 2: Initialize Zego and join room
        // Determine if this is a host or viewer
        const isHostUser = isHost || !roomData || roomData.status === 'created';
        
        // Use existing user ID if already set (for viewers), otherwise create new one
        const userID = currentUserID || (isHostUser ? `host_${Date.now()}_${Math.random().toString(36).substring(2, 8)}` : `viewer_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
        const userName = isHostUser ? (roomData?.host_username || 'Host') : 'Viewer';
        
        console.log('🔍 [DEBUG] === ZEGO LOGIN ===');
        console.log('🔍 [DEBUG] User type:', isHostUser ? 'HOST' : 'VIEWER');
        console.log('🔍 [DEBUG] Logging in with userID:', userID, 'userName:', userName);
        console.log('🔍 [DEBUG] === END ZEGO LOGIN ===');
        
        // Generate token
        console.log('Requesting token for:', { userID, roomID: roomId });
        
        const tokenResponse = await fetch('/api/zego-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userID,
            roomID: roomId,
          }),
        });
        
        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('Token generation failed:', errorText);
          throw new Error(`Failed to generate token: ${errorText}`);
        }
        
        const { token } = await tokenResponse.json();
        console.log('Token received, length:', token?.length);
        
        // Step 3: Login to Zego room
        const result = await zg.loginRoom(
          roomId, 
          token, 
          { userID, userName }, 
          { userUpdate: true }
        );

        console.log('✅ Step 2: Zego login result:', result);
        
        // Initialize viewer count and list
        if (isHostUser) {
          console.log('Initial viewer count set to 1 (including host)');
          setViewerCount(1); // Start with 1 to include the host
          const initialViewers = [{ userID, userName }];
          setViewersList(initialViewers); // Add host to viewers list
          viewersListRef.current = initialViewers; // Update the ref
          console.log('🔍 [DEBUG] === INITIAL USER ADDED ===');
          console.log('🔍 [DEBUG] Initial viewers list:', initialViewers);
          console.log('🔍 [DEBUG] === END INITIAL USER ADDED ===');
        } else {
          console.log('✅ Step 2: Viewer logged into Zego room successfully');
          // For viewers, the viewer count will be updated by roomUserUpdate events
        }
        
        setIsInitializing(false);
        setHasInitialized(true); // Mark as initialized
        hasInitializedRef.current = true; // Mark ref as initialized

      } catch (error) {
        console.error('Error initializing Zego:', error);
        setIsInitializing(false);
      }
    })();
    return initializationPromiseRef.current;
  });

  return {
    zegoEngine,
    isLoggedIn,
    isInitializing,
    hasInitialized,
    viewerCount,
    viewersList,
    messages,
    setMessages,
    initializeZego: initializeZego.current,
    isWatching,
  };
}
