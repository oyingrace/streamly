'use client';

import { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import PopupCard from '../../components/PopupCard';
import ShowViewers from '../../components/ShowViewers';
import ChatInput from '../../components/ChatInput';
import BulletScreen from '../../components/BulletScreen';
import RoomControls from '../../components/RoomControls';
import RoomHeader from '../../components/RoomHeader';
import RoomSidebar from '../../components/RoomSidebar';
import RoomStatus from '../../components/RoomStatus';
import RoomTopControls from '../../components/RoomTopControls';
import { useZegoEngine } from '../../hooks/useZegoEngine';

interface RoomPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const { roomId } = use(params);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [localZegoStream, setLocalZegoStream] = useState<any>(null);
  const [streamID, setStreamID] = useState<string>('');
  const [showEndStreamPopup, setShowEndStreamPopup] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showViewersList, setShowViewersList] = useState(false);
  const [showChatInput, setShowChatInput] = useState(false);
  const [currentUserID, setCurrentUserID] = useState<string>('');
  const [hasStartedStreaming, setHasStartedStreaming] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [roomData, setRoomData] = useState<any>(null);


  // Set client state when component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if user is host and fetch room data
  useEffect(() => {
    const checkRoomAndJoin = async () => {
      try {
        // Fetch room details
        const response = await fetch(`/api/rooms/${roomId}`);
        if (response.ok) {
          const { room } = await response.json();
          setRoomData(room);
          
          // Check if room exists and is live
          if (room.status === 'live') {
            // Join as viewer
            await joinAsViewer();
          } else if (room.status === 'created') {
            // This is the host, set as host
            setIsHost(true);
          }
        } else {
          // Room doesn't exist, this is a new room creation
          setIsHost(true);
        }
      } catch (error) {
        console.error('Error checking room:', error);
        // Assume this is a new room if there's an error
        setIsHost(true);
      }
    };

    if (isClient) {
      checkRoomAndJoin();
    }
  }, [roomId, isClient]);

  const joinAsViewer = async () => {
    try {
      const viewerUserId = `viewer_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const viewerUsername = `Viewer_${Math.random().toString(36).substring(2, 6)}`;
      
      // Step 1: Call database API to join as participant
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'join_viewer',
          userId: viewerUserId,
          username: viewerUsername,
        }),
      });

      if (response.ok) {
        setCurrentUserID(viewerUserId);
        console.log('✅ Step 1: Joined as viewer in database');
        
        // Step 2: Initialize Zego and join room (this will happen in the existing useEffect)
        // The existing initializeZego function will handle the Zego login
        // Step 3: Start playing stream (handled by roomStreamUpdate event)
        // Step 4: Create video view (handled by roomStreamUpdate event)
      } else {
        console.error('Failed to join as viewer in database');
      }
    } catch (error) {
      console.error('Error joining as viewer:', error);
    }
  };

  // Use the Zego engine hook
  const {
    zegoEngine,
    isLoggedIn,
    isInitializing,
    hasInitialized,
    viewerCount,
    viewersList,
    messages,
    setMessages,
    initializeZego,
    isWatching,
  } = useZegoEngine({ 
    roomId, 
    isHost, 
    roomData, 
    currentUserID,
    onViewersListUpdate: (viewers) => {
      console.log('Viewers list updated from database:', viewers);
    }
  });

  // Initialize Zego when ready
  useEffect(() => {
    // Wait for room data to be loaded before initializing Zego
    if (isClient && (roomData !== null || isHost)) {
      console.log('🚀 Starting Zego initialization...');
      initializeZego();
    }
  }, [roomId, isClient, roomData, isHost, initializeZego]);

  // Cleanup function for streams
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (localZegoStream && zegoEngine) {
        try {
          zegoEngine.destroyStream(localZegoStream);
        } catch (cleanupError) {
          console.error('Error cleaning up stream:', cleanupError);
      }
    }
  };
  }, [localStream, localZegoStream, zegoEngine]);

  const sendMessage = async (messageText: string) => {
    if (!zegoEngine || !messageText.trim()) {
      return;
    }

    console.log('🔍 [DEBUG] === SENDING MESSAGE ===');
    console.log('🔍 [DEBUG] Message text:', messageText);
    console.log('🔍 [DEBUG] Room ID:', roomId);
    console.log('🔍 [DEBUG] Current user ID:', currentUserID);
    console.log('🔍 [DEBUG] Is logged in:', isLoggedIn);

    try {
      console.log('🔍 [DEBUG] Sending barrage message:', messageText);
      
      // Try different method signatures
      let result;
      try {
        // Method 1: sendBarrageMessage(roomID, message) - Correct parameter order
        console.log('🔍 [DEBUG] Trying sendBarrageMessage with:', { roomId, messageText });
        result = await zegoEngine.sendBarrageMessage(roomId, messageText);
        console.log('🔍 [DEBUG] sendBarrageMessage result:', result);
      } catch (error1) {
        console.log('🔍 [DEBUG] Method 1 failed, trying method 2:', error1);
        try {
          // Method 2: sendBroadcastMessage as fallback (if it exists)
          console.log('🔍 [DEBUG] Trying sendBroadcastMessage with:', { roomId, messageText });
          result = await zegoEngine.sendBroadcastMessage(roomId, messageText);
          console.log('🔍 [DEBUG] sendBroadcastMessage result:', result);
        } catch (error2) {
          console.log('🔍 [DEBUG] Method 2 failed:', error2);
          throw error2; // Re-throw the error since both methods failed
        }
      }
      
      console.log('🔍 [DEBUG] Message send result:', result);
      
      // Add message to local display immediately
      const newMessage = {
        id: `msg_${Date.now()}_${Math.random()}`,
        text: messageText,
        userID: currentUserID, // Use the stored user ID instead of creating a new one
        userName: 'You',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, newMessage]);
      
      console.log('🔍 [DEBUG] Message sent successfully');
    } catch (error: any) {
      console.error('🔍 [DEBUG] === MESSAGE SEND ERROR ===');
      console.error('🔍 [DEBUG] Error sending message:', error);
      console.error('🔍 [DEBUG] Error details:', {
        message: error.message,
        stack: error.stack,
        roomId,
        currentUserID,
        isLoggedIn
      });
      console.error('🔍 [DEBUG] === END MESSAGE SEND ERROR ===');
    }
  };

  const sendHeartMessage = async () => {
    if (!zegoEngine) {
      return;
    }

    try {
      console.log('🔍 [DEBUG] Sending heart message');
      
      // Send heart emoji as a barrage message
      const heartMessage = '💖';
      const result = await zegoEngine.sendBarrageMessage(roomId, heartMessage);
      console.log('🔍 [DEBUG] Heart message sent:', result);
      
      // Add heart message to local display
      const newMessage = {
        id: `heart_${Date.now()}_${Math.random()}`,
        text: heartMessage,
        userID: currentUserID,
        userName: 'You',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, newMessage]);
      
    } catch (error: any) {
      console.error('🔍 [DEBUG] Error sending heart message:', error);
    }
  };

  const endStreamAndLogout = async () => {
    if (!zegoEngine) {
      return;
    }

    try {
      console.log('Ending stream and logging out...');

      // Update database to mark stream as ended (if host)
      if (isHost && hasStartedStreaming) {
        try {
          const response = await fetch(`/api/rooms/${roomId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'end_stream',
              userId: currentUserID,
              username: roomData?.host_username || 'Host',
            }),
          });

          if (response.ok) {
            console.log('Database updated: stream ended');
          } else {
            console.error('Failed to update database for stream end');
          }
        } catch (error) {
          console.error('Error updating database for stream end:', error);
        }
      }

      // Leave as viewer (if not host)
      if (!isHost) {
        try {
          await fetch(`/api/rooms/${roomId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'leave_viewer',
              userId: currentUserID,
              username: 'Viewer',
            }),
          });
        } catch (error) {
          console.error('Error leaving as viewer:', error);
        }
      }
      


      // Stop publishing stream if streaming
      if (streamID && localZegoStream) {
        await zegoEngine.stopPublishingStream(streamID);
        await zegoEngine.destroyStream(localZegoStream);
        console.log('Stream stopped successfully');
      }

      // Logout from room
      await zegoEngine.logoutRoom(roomId);
      console.log('Logged out from room successfully');

      // Navigate back to home page
      router.push('/');

    } catch (error) {
      console.error('Error ending stream and logging out:', error);
      // Still navigate back even if there's an error
      router.push('/');
    }
  };

  const startStreaming = async () => {
    if (!zegoEngine || !isLoggedIn) {
      console.error('Zego engine not initialized or not logged in');
      return;
    }

    // Prevent multiple stream starts
    if (hasStartedStreaming) {
      console.log('Stream already started, skipping...');
      return;
    }

    console.log('🔍 [DEBUG] === STARTING STREAM ===');
    console.log('🔍 [DEBUG] Current user ID:', currentUserID);

    try {
      console.log('Starting Zego stream creation...');
      
      // Create local Zego stream
      const localStream = await zegoEngine.createZegoStream();
      setLocalZegoStream(localStream);
      console.log('Zego stream created:', localStream);

      // Generate unique stream ID
      const uniqueStreamID = `stream_${roomId}_${Date.now()}`;
      setStreamID(uniqueStreamID);
      console.log('Stream ID generated:', uniqueStreamID);

      // Start publishing stream first
      console.log('Starting to publish stream...');
      await zegoEngine.startPublishingStream(uniqueStreamID, localStream);
      console.log('Stream publishing started');

      // Play preview of the stream (video only, no audio to prevent echo)
      if (videoRef.current) {
        console.log('Playing Zego stream preview...');
        localStream.playVideo(videoRef.current);
        
        // Mute the local preview audio to prevent host from hearing themselves
        // BUT keep the published stream audio enabled so viewers can hear
        try {
          // Only mute the local preview, not the published stream
          if (videoRef.current) {
            videoRef.current.muted = true;
          }
          console.log('Local preview audio muted to prevent echo');
        } catch (error) {
          console.error('Error muting local preview audio:', error);
        }
      }

      console.log('Streaming started successfully');
      setIsStreaming(true);
      setHasStartedStreaming(true); // Mark as started streaming

      // Update database to mark stream as live
      if (isHost) {
        try {
          const response = await fetch(`/api/rooms/${roomId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'start_stream',
              userId: currentUserID,
              username: roomData?.host_username || 'Host',
            }),
          });

          if (response.ok) {
            console.log('Database updated: stream started');
          } else {
            console.error('Failed to update database for stream start');
          }
        } catch (error) {
          console.error('Error updating database for stream start:', error);
        }
      }

    } catch (error) {
      console.error('Error starting stream:', error);
      // Clean up on error
      if (localZegoStream) {
        try {
          zegoEngine.destroyStream(localZegoStream);
        } catch (cleanupError) {
          console.error('Error cleaning up stream:', cleanupError);
        }
      }
    }
  };

  const toggleMic = async () => {
    if (!localStream || !zegoEngine || !localZegoStream) return;
    
    try {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
        
        // Also mute/unmute the published stream audio
        await zegoEngine.mutePublishStreamAudio(localZegoStream, !audioTrack.enabled);
        console.log('Published stream audio muted:', !audioTrack.enabled);
      }
    } catch (error) {
      console.error('Error toggling microphone:', error);
    }
  };

  const toggleVideo = async () => {
    if (!localStream) return;
    
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOn(videoTrack.enabled);
    }
  };

  const switchCamera = async () => {
    if (!localStream) return;
    
    try {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities();
        if (capabilities.facingMode) {
          const newFacingMode = isFrontCamera ? 'environment' : 'user';
          await videoTrack.applyConstraints({
            facingMode: newFacingMode
          });
          setIsFrontCamera(!isFrontCamera);
        }
      }
    } catch (error) {
      console.error('Error switching camera:', error);
    }
  };

  const goBack = () => {
    router.push('/');
  };

  // Show loading state during SSR or when not yet client-side
  if (!isClient) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Local video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      
      {/* Remote video container for other users' streams */}
      <div id="remote-video" className="hidden"></div>
      
      {/* Connection Status Indicator */}
      {isInitializing && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Connecting to room...
          </div>
        </div>
      )}
      
      {/* Top Controls - Only show when not streaming */}
      {!isStreaming && (
        <RoomTopControls
          onGoBack={goBack}
          onSwitchCamera={switchCamera}
          isHost={isHost}
        />
      )}

      {/* Room Status - Start button for hosts, status for viewers */}
      <RoomStatus
        isHost={isHost}
        isInitializing={isInitializing}
        isLoggedIn={isLoggedIn}
        zegoEngine={zegoEngine}
        isStreaming={isStreaming}
        isWatching={isWatching}
        onStartStream={startStreaming}
      />

      {/* Streaming Controls - Show when streaming (host) or watching (viewer) */}
      {(isStreaming || isWatching) && (
        <>
          <RoomHeader
            hostUsername={roomData?.host_username || 'Host'}
            viewerCount={viewerCount}
            isHost={isHost}
            onShowViewersList={() => setShowViewersList(true)}
            onEndStream={() => setShowEndStreamPopup(true)}
          />

          <RoomSidebar
            onSendHeart={sendHeartMessage}
            onShowChat={() => setShowChatInput(true)}
          />

          {/* Control Icons - Bottom Right */}
          <RoomControls
            isMicOn={isMicOn}
            isVideoOn={isVideoOn}
            onToggleMic={toggleMic}
            onToggleVideo={toggleVideo}
            onSwitchCamera={switchCamera}
            isHost={isHost}
            onExit={endStreamAndLogout}
          />
        </>
      )}

      {/* End Stream Confirmation Popup */}
      <PopupCard
        isOpen={showEndStreamPopup}
        onClose={() => setShowEndStreamPopup(false)}
        title="End Live Stream"
        message="Are you sure you want to end stream?"
        onConfirm={endStreamAndLogout}
        confirmText="Yes"
        cancelText="No"
      />

      {/* Show Viewers List */}
      <ShowViewers
        isOpen={showViewersList}
        onClose={() => setShowViewersList(false)}
        roomId={roomId}
        title="Viewers"
        hostUsername={roomData?.host_username}
      />

      {/* Chat Input */}
      <ChatInput
        isOpen={showChatInput}
        onClose={() => setShowChatInput(false)}
        onSendMessage={sendMessage}
        placeholder="live chat..."
      />

      {/* Bullet Screen Messages */}
      <BulletScreen messages={messages} roomId={roomId} />
    </div>
  );
}
