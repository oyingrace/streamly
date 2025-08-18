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
import { sdk } from '@farcaster/miniapp-sdk';
import { getMobileVideoConstraints, getMobileAudioConstraints, optimizeVideoElement, getDeviceCapabilities } from '../../lib/mobileOptimization';

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
  const [showHostEndedStreamPopup, setShowHostEndedStreamPopup] = useState(false);
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

  // Optimize video element for mobile when component mounts
  useEffect(() => {
    if (videoRef.current && isClient) {
      optimizeVideoElement(videoRef.current);
    }
  }, [isClient]);

  // Check if user is host and fetch room data
  useEffect(() => {
    const checkRoomAndJoin = async () => {
      try {
        // Get current user's Farcaster data
        const context = await sdk.context;
        const currentUserId = context.user.fid.toString();
        
        // Fetch room details
        const response = await fetch(`/api/rooms/${roomId}`);
        if (response.ok) {
          const { room } = await response.json();
          setRoomData(room);
          
          // Check if current user is the host of this room
          const isCurrentUserHost = room.host_user_id === currentUserId;
          
          // Check if room exists and is live
          if (room.status === 'live') {
            if (isCurrentUserHost) {
              // Original host rejoining a live stream
              setIsHost(true);
              setCurrentUserID(currentUserId);
              console.log('✅ Original host rejoining live stream');
            } else {
              // Regular viewer joining
            await joinAsViewer();
            }
          } else if (room.status === 'created') {
            if (isCurrentUserHost) {
              // Original host of a created room
            setIsHost(true);
              setCurrentUserID(currentUserId);
              console.log('✅ Original host of created room');
            } else {
              // Someone else trying to access a created room (shouldn't happen)
              console.log('⚠️ Non-host trying to access created room');
              setIsHost(false);
            }
          }
        } else {
          // Room doesn't exist, this is a new room creation
          setIsHost(true);
          setCurrentUserID(currentUserId);
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
      // Get Farcaster user data
      const context = await sdk.context;
      const viewerUserId = context.user.fid.toString();
      const viewerUsername = context.user.username || 'Anonymous';
      const viewerPfpUrl = context.user.pfpUrl;
      
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
          pfpUrl: viewerPfpUrl,
        }),
      });

      if (response.ok) {
        setCurrentUserID(viewerUserId);
        console.log('✅ Step 1: Joined as participant in database');
        
        // Check if this user is actually the host (for rejoining hosts)
        if (roomData && roomData.host_user_id === viewerUserId) {
          setIsHost(true);
          console.log('✅ Host rejoined and was recognized');
        }
        
        // Step 2: Initialize Zego and join room (this will happen in the existing useEffect)
        // The existing initializeZego function will handle the Zego login
        // Step 3: Start playing stream (handled by roomStreamUpdate event)
        // Step 4: Create video view (handled by roomStreamUpdate event)
      } else {
        console.error('Failed to join as participant in database');
      }
    } catch (error) {
      console.error('Error joining as participant:', error);
    }
  };

  // Handle when host ends the stream (for viewers)
  const handleHostEndedStream = async () => {
    console.log('🔍 DEBUG - Host ended stream, handling viewer logout...');
    
    try {
      // Show message to user
      setShowHostEndedStreamPopup(true);
      
      // Leave as viewer in database
      if (!isHost && currentUserID) {
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

      // Logout from Zego room
      if (zegoEngine) {
        await zegoEngine.logoutRoom(roomId);
        console.log('Logged out from room successfully');
      }

      // Navigate back to home page after a short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Error handling host ended stream:', error);
      // Still navigate back even if there's an error
      router.push('/');
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
    },
    onHostEndedStream: handleHostEndedStream
  });

  // Initialize Zego when ready
  useEffect(() => {
    // Wait for room data to be loaded before initializing Zego
    if (isClient && (roomData !== null || isHost)) {
      console.log('🚀 Starting Zego initialization...');
      initializeZego();
    }
  }, [roomId, isClient, roomData, isHost, initializeZego]);

  // Initialize camera preview when host enters room
  useEffect(() => {
    if (isHost && isClient && !isStreaming && !isInitializing) {
      console.log('🔍 DEBUG - Host detected, initializing camera preview...');
      initializeCameraPreview();
    }
  }, [isHost, isClient, isStreaming, isInitializing]);

  // Recreate camera preview when camera is switched (for preview mode)
  useEffect(() => {
    if (isHost && isClient && !isStreaming && localStream) {
      console.log('🔍 DEBUG - Camera switched, recreating preview...');
      initializeCameraPreview();
    }
  }, [isFrontCamera]);

  // Ensure proper audio settings for viewers
  useEffect(() => {
    if (!isHost && isWatching && videoRef.current) {
      console.log('🔍 DEBUG - Setting up audio for viewer...');
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
      console.log('✅ Viewer audio settings applied: muted = false, volume = 1.0');
    }
  }, [isHost, isWatching]);

  // FIX: Periodic stream check for viewers to ensure they can detect streams
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Only run for viewers who are logged in but not watching yet
    if (!isHost && isLoggedIn && !isWatching && !isStreaming && zegoEngine) {
      console.log('🔍 DEBUG - Starting periodic stream check for viewer...');
      
      interval = setInterval(async () => {
        try {
          console.log('🔍 DEBUG - Periodic stream check...');
          
          // Note: We can't use getStreamList as it doesn't exist in Zego SDK
          // Instead, we rely on the roomStreamUpdate event which should fire immediately
          // if there are existing streams when the viewer joins
          console.log('🔍 DEBUG - Relying on roomStreamUpdate event for stream detection...');
        } catch (error) {
          console.error('❌ Error in periodic stream check:', error);
        }
      }, 3000); // Check every 3 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isHost, isLoggedIn, isWatching, isStreaming, zegoEngine, roomId]);

  // Initialize camera preview for host before streaming starts
  const initializeCameraPreview = async () => {
    if (!isHost || isStreaming || !isClient) return;
    
    try {
      console.log('📹 Initializing camera preview for host...');
      console.log('🔍 DEBUG - initializeCameraPreview: isFrontCamera:', isFrontCamera);
      
      // Clean up existing preview stream if it exists
      if (localStream) {
        localStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        console.log('🧹 Existing preview stream cleaned up');
      }
      
      // Get camera access for preview
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: false, // No audio in preview to avoid echo
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: isFrontCamera ? 'user' : 'environment'
        }
      });
      
      console.log('✅ Camera preview stream obtained');
      
      // Set the preview stream to the video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.muted = true; // Mute preview to prevent echo
        console.log('✅ Camera preview set to video element');
      }
      
      // Store the preview stream for cleanup
      setLocalStream(mediaStream);
      
    } catch (error: any) {
      console.error('❌ Error initializing camera preview:', error);
      if (error.name === 'NotAllowedError') {
        alert('Camera permission is required to show preview. Please allow camera access.');
      }
    }
  };

  // Cleanup function for streams
  useEffect(() => {
    return () => {
      // Clean up preview stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        console.log('🧹 Preview stream cleaned up');
      }
      
      // Clean up Zego stream
      if (localZegoStream && zegoEngine) {
        try {
          zegoEngine.destroyStream(localZegoStream);
          console.log('🧹 Zego stream cleaned up');
        } catch (cleanupError) {
          console.error('Error cleaning up Zego stream:', cleanupError);
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
    if (!zegoEngine) {
      console.log('🔍 DEBUG - startStreaming: No zegoEngine available');
      return;
    }

    console.log('🔍 DEBUG - Is Host:', isHost);

    try {
      console.log('📹 Step 1: Creating Zego stream...');
      
      // Clean up preview stream if it exists
      if (localStream) {
        localStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        setLocalStream(null);
        console.log('🧹 Preview stream cleaned up before starting Zego stream');
      }
      
      // Create local Zego stream - let Zego handle the media stream creation
      console.log('🔍 DEBUG - About to call createZegoStream()...');
      
      // Get mobile-optimized constraints
      const videoConstraints = getMobileVideoConstraints();
      const audioConstraints = getMobileAudioConstraints();
      
      console.log('🔍 DEBUG - Using video constraints:', videoConstraints);
      console.log('🔍 DEBUG - Using audio constraints:', audioConstraints);
      console.log('🔍 DEBUG - Device capabilities:', getDeviceCapabilities());
      
      // Create Zego stream with proper audio/video constraints
      let zegoLocalStream;
      try {
        zegoLocalStream = await zegoEngine.createZegoStream({
          camera: {
            audio: audioConstraints,
            video: videoConstraints
          }
        });
      } catch (createError) {
        console.log('🔍 DEBUG - createZegoStream with config failed, trying fallback...');
        
                  // Fallback to simpler constraints for mobile
          try {
            zegoLocalStream = await zegoEngine.createZegoStream({
              camera: {
                audio: audioConstraints,
                video: {
                  width: { ideal: 640, max: 1280 },
                  height: { ideal: 480, max: 720 },
                  frameRate: { ideal: 24, max: 30 }
                }
              }
            });
        } catch (fallbackError) {
          console.log('🔍 DEBUG - Fallback failed, trying default method...');
          // Final fallback to default method
          zegoLocalStream = await zegoEngine.createZegoStream();
        }
      }
      
      console.log('✅ Step 1: Zego stream created successfully');
      console.log('🔍 DEBUG - zegoLocalStream object:', zegoLocalStream);
      console.log('🔍 DEBUG - zegoLocalStream type:', typeof zegoLocalStream);
      console.log('🔍 DEBUG - zegoLocalStream methods:', Object.getOwnPropertyNames(zegoLocalStream));
      
      setLocalZegoStream(zegoLocalStream);
      
      // Debug: Check if Zego stream has video and audio tracks
      console.log('🔍 DEBUG - Checking stream tracks...');
      const videoTracks = zegoLocalStream.getVideoTracks();
      const audioTracks = zegoLocalStream.getAudioTracks();
      console.log('🔍 DEBUG - Video tracks count:', videoTracks.length);
      console.log('🔍 DEBUG - Audio tracks count:', audioTracks.length);
      
      if (videoTracks.length > 0) {
        const videoTrack = videoTracks[0];
        console.log('🔍 DEBUG - Video track settings:', videoTrack.getSettings());
        console.log('🔍 DEBUG - Video track capabilities:', videoTrack.getCapabilities());
      }
      
      if (audioTracks.length > 0) {
        const audioTrack = audioTracks[0];
        console.log('🔍 DEBUG - Audio track settings:', audioTrack.getSettings());
        console.log('🔍 DEBUG - Audio track capabilities:', audioTrack.getCapabilities());
      }
      
      // Step 2: Set up video preview
      console.log('📹 Step 2: Setting up video preview...');
      if (videoRef.current) {
        try {
          // Extract the actual MediaStream from the Zego stream
          console.log('🔍 DEBUG - About to extract MediaStream from Zego stream...');
          console.log('🔍 DEBUG - Zego stream structure:', zegoLocalStream);
          console.log('🔍 DEBUG - Zego stream properties:', Object.getOwnPropertyNames(zegoLocalStream));
          
          let actualMediaStream: MediaStream;
          const zegoLocalStreamAny = zegoLocalStream as any;
          
          if (zegoLocalStreamAny.zegoStream && zegoLocalStreamAny.zegoStream.stream) {
            actualMediaStream = zegoLocalStreamAny.zegoStream.stream;
            console.log('🔍 DEBUG - Found MediaStream in zegoLocalStream.zegoStream.stream');
          } else if (zegoLocalStreamAny.stream) {
            actualMediaStream = zegoLocalStreamAny.stream;
            console.log('🔍 DEBUG - Found MediaStream in zegoLocalStream.stream');
          } else if (zegoLocalStreamAny.getTracks && typeof zegoLocalStreamAny.getTracks === 'function') {
            // If zegoLocalStream is already a MediaStream
            actualMediaStream = zegoLocalStreamAny;
            console.log('🔍 DEBUG - zegoLocalStream is already a MediaStream');
          } else {
            console.error('❌ Could not find MediaStream in Zego stream object');
            console.log('🔍 DEBUG - Available properties:', Object.getOwnPropertyNames(zegoLocalStream));
            return;
          }
          
          console.log('🔍 DEBUG - Actual local MediaStream:', actualMediaStream);
          console.log('🔍 DEBUG - Local MediaStream tracks:', actualMediaStream.getTracks());
          
          videoRef.current.srcObject = actualMediaStream;
          
          // Optimize video element for mobile
          optimizeVideoElement(videoRef.current);
          
          console.log('✅ Step 2: Video preview set up successfully');
          
          // Check video element after setting srcObject
          setTimeout(() => {
            console.log('🔍 DEBUG - Video element after setting local srcObject:');
            console.log('  - srcObject:', videoRef.current?.srcObject);
            console.log('  - readyState:', videoRef.current?.readyState);
            console.log('  - paused:', videoRef.current?.paused);
            console.log('  - currentTime:', videoRef.current?.currentTime);
            console.log('  - videoWidth:', videoRef.current?.videoWidth);
            console.log('  - videoHeight:', videoRef.current?.videoHeight);
          }, 1000);
          
        } catch (mediaError) {
          console.error('❌ Error setting up video preview:', mediaError);
        }
      } else {
        console.error('❌ No video element found for preview');
      }
      
      // Step 3: Start publishing the stream
      console.log('📹 Step 3: Starting to publish stream...');
      const streamIDValue = `stream_${roomId}_${Date.now()}`;
      setStreamID(streamIDValue);
      
      try {
        await zegoEngine.startPublishingStream(streamIDValue, zegoLocalStream);
        console.log('✅ Step 3: Stream publishing started successfully');
        
        // Step 4: Update UI state
        setIsStreaming(true);
        setHasStartedStreaming(true);
        console.log('✅ Step 4: UI state updated - streaming started');
        
        // Step 5: Update database
        try {
          const context = await sdk.context;
          const hostUserId = context.user.fid.toString();
          const hostUsername = context.user.username || 'Anonymous';
          const hostPfpUrl = context.user.pfpUrl;
          
          const response = await fetch(`/api/rooms/${roomId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'start_stream',
              userId: hostUserId,
              username: hostUsername,
              pfpUrl: hostPfpUrl,
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
      } catch (publishError) {
        console.error('❌ Error starting to publish stream:', publishError);
        throw publishError;
      }

    } catch (error: any) {
      console.error('❌ === ERROR STARTING STREAM ===');
      console.error('❌ Error details:', error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Clean up on error
      if (localZegoStream) {
        try {
          console.log('🧹 Cleaning up localZegoStream on error...');
          zegoEngine.destroyStream(localZegoStream);
          console.log('✅ Cleanup successful');
        } catch (cleanupError) {
          console.error('❌ Error during cleanup:', cleanupError);
        }
      }
    }
  };

  const toggleMic = async () => {
    if (!zegoEngine || !localZegoStream || !streamID) {
      console.log('🔍 DEBUG - toggleMic: Missing zegoEngine, localZegoStream, or streamID');
      return;
    }
    
    try {
      console.log('🔍 DEBUG - toggleMic: Starting...');
      
      // Toggle the mic state
      const newMicState = !isMicOn;
      setIsMicOn(newMicState);
      
      // Use Zego's API to mute/unmute the published stream
      try {
        await zegoEngine.mutePublishStreamAudio(streamID, !newMicState);
        console.log('✅ toggleMic: Published stream audio muted:', !newMicState);
      } catch (muteError) {
        console.error('❌ toggleMic: Error muting/unmuting published stream:', muteError);
      }
    } catch (error) {
      console.error('❌ toggleMic: Error toggling microphone:', error);
    }
  };

  const toggleVideo = async () => {
    if (!localZegoStream) {
      console.log('🔍 DEBUG - toggleVideo: Missing localZegoStream');
      return;
    }
    
    try {
      console.log('🔍 DEBUG - toggleVideo: Starting...');
      // Get the actual MediaStream from the Zego stream
      const actualMediaStream = localZegoStream.zegoStream.stream;
      const videoTrack = actualMediaStream.getVideoTracks()[0];
      
      if (videoTrack) {
        console.log('🔍 DEBUG - toggleVideo: Video track found, toggling...');
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
        console.log('🔍 DEBUG - toggleVideo: Video track enabled:', videoTrack.enabled);
      } else {
        console.log('🔍 DEBUG - toggleVideo: No video track found');
      }
    } catch (error) {
      console.error('❌ toggleVideo: Error toggling video:', error);
    }
  };

  const switchCamera = async () => {
    console.log('🔍 DEBUG - switchCamera: Starting...');
    console.log('🔍 DEBUG - switchCamera: isStreaming:', isStreaming);
    console.log('🔍 DEBUG - switchCamera: localStream exists:', !!localStream);
    console.log('🔍 DEBUG - switchCamera: localZegoStream exists:', !!localZegoStream);
    
    try {
      if (isStreaming && localZegoStream) {
        // During streaming - we need to recreate the Zego stream with new camera
        console.log('🔍 DEBUG - switchCamera: Switching camera during streaming...');
        
        // Toggle the camera state first
        const newFacingMode = isFrontCamera ? 'environment' : 'user';
        setIsFrontCamera(!isFrontCamera);
        
        // Stop the current stream publishing
        if (streamID) {
          console.log('🔍 DEBUG - switchCamera: Stopping current stream publishing...');
          await zegoEngine.stopPublishingStream(streamID);
        }
        
        // Destroy the current Zego stream
        if (localZegoStream) {
          console.log('🔍 DEBUG - switchCamera: Destroying current Zego stream...');
          await zegoEngine.destroyStream(localZegoStream);
        }
        
        // Get mobile-optimized constraints
        const baseConstraints = getMobileVideoConstraints();
        const mobileConstraints = {
          ...baseConstraints,
          facingMode: newFacingMode
        };
        
        // Create new Zego stream with the new camera
        console.log('🔍 DEBUG - switchCamera: Creating new Zego stream with camera:', newFacingMode);
        console.log('🔍 DEBUG - switchCamera: Using constraints:', mobileConstraints);
        
        const newZegoStream = await zegoEngine.createZegoStream({
          camera: {
            audio: getMobileAudioConstraints(),
            video: mobileConstraints
          }
        });
        
        // Update the local Zego stream
        setLocalZegoStream(newZegoStream);
        
        // Start publishing the new stream
        console.log('🔍 DEBUG - switchCamera: Starting to publish new stream...');
        await zegoEngine.startPublishingStream(streamID, newZegoStream);
        
        // Update the video preview
        if (videoRef.current) {
          try {
            const actualMediaStream = newZegoStream.zegoStream.stream;
            videoRef.current.srcObject = actualMediaStream;
            console.log('✅ switchCamera: Video preview updated with new camera');
          } catch (previewError) {
            console.error('❌ switchCamera: Error updating video preview:', previewError);
          }
        }
        
        console.log('✅ switchCamera: Camera switched successfully during streaming');
        
      } else if (!isStreaming && localStream) {
        // During preview - use regular MediaStream
        console.log('🔍 DEBUG - switchCamera: Using preview stream');
        const videoTrack = localStream.getVideoTracks()[0];
        
        if (videoTrack) {
          console.log('🔍 DEBUG - switchCamera: Video track found, checking capabilities...');
          const capabilities = videoTrack.getCapabilities();
          console.log('🔍 DEBUG - switchCamera: Capabilities:', capabilities);
          
          if (capabilities.facingMode) {
            const newFacingMode = isFrontCamera ? 'environment' : 'user';
            console.log('🔍 DEBUG - switchCamera: Switching to facingMode:', newFacingMode);
            
            await videoTrack.applyConstraints({
              facingMode: newFacingMode
            });
            setIsFrontCamera(!isFrontCamera);
            console.log('✅ switchCamera: Camera switched successfully during preview');
          } else {
            console.log('🔍 DEBUG - switchCamera: No facingMode capability found');
            console.log('🔍 DEBUG - switchCamera: Available capabilities:', Object.keys(capabilities));
          }
        } else {
          console.log('🔍 DEBUG - switchCamera: No video track found');
        }
      } else {
        console.log('🔍 DEBUG - switchCamera: No stream available');
      }
    } catch (error) {
      console.error('❌ switchCamera: Error switching camera:', error);
      // Revert the camera state if there was an error
      setIsFrontCamera(isFrontCamera);
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
        muted={isHost} // Only mute for host to prevent echo, viewers need to hear
        className="w-full h-full object-cover"
        style={{
          objectFit: 'cover',
          width: '100%',
          height: '100%'
        }}
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
        isStreaming={isStreaming}
        viewerCount={viewerCount}
        onStartStream={startStreaming}
        isWatching={isWatching}
      />

      {/* Streaming Controls - Show when streaming (host) or watching (viewer) */}
      {(isStreaming || isWatching) && (
        <>
          <RoomHeader
            hostUsername={roomData?.host_username || 'Host'}
            hostPfpUrl={roomData?.host_pfp_url}
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

      {/* Host Ended Stream Popup */}
      <PopupCard
        isOpen={showHostEndedStreamPopup}
        onClose={() => setShowHostEndedStreamPopup(false)}
        title="Stream Ended"
        message="The host has ended the live stream."
        onConfirm={() => router.push('/')}
        confirmText="OK"
      />

      {/* Show Viewers List */}
      <ShowViewers
        isOpen={showViewersList}
        onClose={() => setShowViewersList(false)}
        roomId={roomId}
        title="Viewers"
        hostUsername={roomData?.host_username}
        isStreaming={isStreaming || isWatching}
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
