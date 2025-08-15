'use client';

import { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, SwitchCamera, MessageCircleMore, Mic, MicOff, Video, VideoOff, X, Users } from 'lucide-react';
import PopupCard from '../../components/PopupCard';
import ShowViewers from '../../components/ShowViewers';
import ChatInput from '../../components/ChatInput';
import BulletScreen from '../../components/BulletScreen';

interface RoomPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const { roomId } = use(params);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const viewersListRef = useRef<Array<{userID: string; userName?: string}>>([]);
  const hasInitializedRef = useRef(false);
  const initializationPromiseRef = useRef<Promise<void> | null>(null);
  
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
          
          // Update viewer count and list (including host)
          if (updateType === 'ADD') {
            setViewersList(prev => {
              // Create a Set for faster duplicate checking
              const existingUserIDs = new Set(prev.map((user: any) => user.userID));
              const newUsers = userList.filter((user: any) => !existingUserIDs.has(user.userID));
              
              if (newUsers.length > 0) {
                const newViewers = [...prev, ...newUsers];
                console.log('🔍 [DEBUG] Adding new users:', newUsers.map((u: any) => u.userID));
                console.log('🔍 [DEBUG] Updated viewers list:', newViewers.map((v: any) => v.userID));
                
                // Update the ref
                viewersListRef.current = newViewers;
                
                // Update viewer count based on actual unique users
                setViewerCount(newViewers.length);
                
                return newViewers;
              }
              return prev;
            });
          } else if (updateType === 'DELETE') {
            setViewersList(prev => {
              const userIDsToRemove = new Set(userList.map((user: any) => user.userID));
              const newViewers = prev.filter((viewer: any) => !userIDsToRemove.has(viewer.userID));
              console.log('🔍 [DEBUG] Updated viewers list after removal:', newViewers);
              
              // Update the ref
              viewersListRef.current = newViewers;
              
              // Update viewer count based on actual unique users
              setViewerCount(Math.max(1, newViewers.length));
              
              return newViewers;
            });
          }
        });

        zg.on('roomStreamUpdate', async (roomID: any, updateType: any, streamList: any, extendedData: any) => {
          console.log('Room stream update:', roomID, updateType, streamList);
          if (updateType === 'ADD') {
            // New stream added, start playing the stream
            for (const stream of streamList) {
              try {
                console.log('Starting to play remote stream:', stream.streamID);
                const remoteStream = await zg.startPlayingStream(stream.streamID);
                const remoteView = zg.createRemoteStreamView(remoteStream);
                
                // Create a unique container for each remote stream
                const containerId = `remote-video-${stream.streamID}`;
                let container = document.getElementById(containerId);
                if (!container) {
                  container = document.createElement('div');
                  container.id = containerId;
                  container.className = 'absolute top-0 left-0 w-full h-full z-0';
                  document.getElementById('remote-video')?.appendChild(container);
                }
                
                remoteView.play(containerId, { enableAutoplayDialog: true });
                console.log('Remote stream playing in container:', containerId);
              } catch (error) {
                console.error('Error playing remote stream:', error);
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

        // Login to room
        const userID = `user_${Date.now()}`;
        const userName = 'Host';
        setCurrentUserID(userID); // Store the user ID for later use
        console.log('🔍 [DEBUG] === CREATING USER ID ===');
        console.log('🔍 [DEBUG] Logging in with userID:', userID, 'userName:', userName);
        console.log('🔍 [DEBUG] === END CREATING USER ID ===');
        
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
        
        const result = await zg.loginRoom(
          roomId, 
          token, 
          { userID, userName }, 
          { userUpdate: true }
        );

        console.log('Login result:', result);
        console.log('Initial viewer count set to 1 (including host)');
        setViewerCount(1); // Start with 1 to include the host
        const initialViewers = [{ userID, userName }];
        setViewersList(initialViewers); // Add host to viewers list
        viewersListRef.current = initialViewers; // Update the ref
        console.log('🔍 [DEBUG] === INITIAL USER ADDED ===');
        console.log('🔍 [DEBUG] Initial viewers list:', initialViewers);
        console.log('🔍 [DEBUG] === END INITIAL USER ADDED ===');
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

  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [zegoEngine, setZegoEngine] = useState<any>(null); // Changed to any to avoid SSR error
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [localZegoStream, setLocalZegoStream] = useState<any>(null);
  const [streamID, setStreamID] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [showEndStreamPopup, setShowEndStreamPopup] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [showViewersList, setShowViewersList] = useState(false);
  const [viewersList, setViewersList] = useState<Array<{userID: string; userName?: string}>>([]);
  const [showChatInput, setShowChatInput] = useState(false);
  const [messages, setMessages] = useState<Array<{id: string; text: string; userID: string; userName?: string; timestamp: number}>>([]);
  const [currentUserID, setCurrentUserID] = useState<string>('');
  const [hasInitialized, setHasInitialized] = useState(false);
  const [hasStartedStreaming, setHasStartedStreaming] = useState(false);

  // Set client state when component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Use the singleton initialization function
    initializeZego.current();
  }, [roomId]);

  // Cleanup function for streams
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      if (zegoEngine && localZegoStream) {
        try {
          zegoEngine.destroyStream(localZegoStream);
        } catch (error) {
          console.error('Error cleaning up stream on unmount:', error);
        }
      }
    };
  }, [zegoEngine, localZegoStream]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: isFrontCamera ? 'user' : 'environment'
          },
          audio: true
        });
        
        setLocalStream(stream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    startCamera();
  }, [isFrontCamera]);

  const switchCamera = () => {
    setIsFrontCamera(!isFrontCamera);
  };

  const goBack = () => {
    router.push('/');
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
    console.log('🔍 [DEBUG] Current viewers list:', viewersListRef.current);

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
        
        // Mute the local stream audio to prevent host from hearing themselves
        try {
          await zegoEngine.mutePublishStreamAudio(localStream, true);
          console.log('Local stream audio muted to prevent echo');
        } catch (error) {
          console.error('Error muting local audio:', error);
        }
      }

      console.log('Streaming started successfully');
      setIsStreaming(true);
      setHasStartedStreaming(true); // Mark as started streaming

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

  const endStreamAndLogout = async () => {
    if (!zegoEngine) {
      return;
    }

    try {
      console.log('Ending stream and logging out...');

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

  const toggleMic = async () => {
    if (!localStream) return;
    
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
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
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 sm:p-6">
          {/* Back Button */}
          <button
            onClick={goBack}
            className="bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          {/* Switch Camera Button */}
          <button
            onClick={switchCamera}
            className="bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-colors"
          >
            <SwitchCamera className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      )}
      
      {/* Start Button - Only show when not streaming */}
      {!isStreaming && (
        <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center pb-8 sm:pb-12">
          <button 
            onClick={startStreaming}
            disabled={isInitializing || !zegoEngine || !isLoggedIn}
            className={`font-bold py-3 px-8 sm:py-4 sm:px-12 rounded-full text-lg sm:text-xl transition-colors shadow-lg flex items-center gap-2 ${
              isInitializing || !zegoEngine || !isLoggedIn
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isInitializing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Initializing...
              </>
            ) : !zegoEngine || !isLoggedIn ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Connecting...
              </>
            ) : (
              'Start'
            )}
          </button>
        </div>
      )}

      {/* Streaming Controls - Only show when streaming */}
      {isStreaming && (
        <>
          {/* Top Left - Host User ID */}
          <div className="absolute top-0 left-0 z-10 p-4 sm:p-6">
            <div className="bg-black/30 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
              <div className="text-white text-xs sm:text-sm font-medium">
                {currentUserID}
              </div>
            </div>
          </div>

          {/* Top Right Controls Container */}
          <div className="absolute top-0 right-0 z-10 p-4 sm:p-6 flex items-center gap-3">
            {/* Viewer Count */}
            <button 
              onClick={() => setShowViewersList(true)}
              className="bg-black/30 backdrop-blur-md rounded-lg px-3 py-2 flex items-center gap-2 border border-white/20 hover:bg-black/40 transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span className="text-white text-sm sm:text-base font-medium">
                {viewerCount}
              </span>
            </button>

            {/* End Stream Button */}
            <button 
              onClick={() => setShowEndStreamPopup(true)}
              className="bg-red-600 hover:bg-red-700 text-white p-2 sm:p-3 rounded-full transition-colors"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Chat Icon - Bottom Left */}
          <div className="absolute bottom-0 left-0 z-10 p-4 sm:p-6">
            <button 
              onClick={() => setShowChatInput(true)}
              className="bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-colors"
            >
              <MessageCircleMore className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          </div>

          {/* Control Icons - Bottom Right */}
          <div className="absolute bottom-0 right-0 z-10 flex items-center gap-2 p-4 sm:p-6">
            {/* Switch Camera */}
            <button
              onClick={switchCamera}
              className="bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-colors"
            >
              <SwitchCamera className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>

            {/* Microphone Toggle */}
            <button
              onClick={toggleMic}
              className={`p-2 sm:p-3 rounded-full transition-colors ${
                isMicOn 
                  ? 'bg-black/50 hover:bg-black/70 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isMicOn ? (
                <Mic className="w-6 h-6 sm:w-8 sm:h-8" />
              ) : (
                <MicOff className="w-6 h-6 sm:w-8 sm:h-8" />
              )}
            </button>

            {/* Video Toggle */}
            <button
              onClick={toggleVideo}
              className={`p-2 sm:p-3 rounded-full transition-colors ${
                isVideoOn 
                  ? 'bg-black/50 hover:bg-black/70 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isVideoOn ? (
                <Video className="w-6 h-6 sm:w-8 sm:h-8" />
              ) : (
                <VideoOff className="w-6 h-6 sm:w-8 sm:h-8" />
              )}
            </button>
          </div>
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
        viewers={viewersList}
        title="Viewers"
      />

      {/* Chat Input */}
      <ChatInput
        isOpen={showChatInput}
        onClose={() => setShowChatInput(false)}
        onSendMessage={sendMessage}
        placeholder="live chat..."
      />

      {/* Bullet Screen Messages */}
      <BulletScreen messages={messages} />
    </div>
  );

  // Initialize Zego when component mounts
  useEffect(() => {
    initializeZego.current();
  }, [roomId]);
}
