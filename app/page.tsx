// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import Image from 'next/image';
import StreamGrid from './components/StreamGrid';
import { sdk } from '@farcaster/miniapp-sdk';

interface LiveStream {
  room_id: string;
  host_username: string;
  current_viewers: number;
  total_viewers: number;
  created_at: string;
  stream_started_at: string;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [loadingStreams, setLoadingStreams] = useState(true);
  const [isMiniApp, setIsMiniApp] = useState<boolean | null>(null);
  const [checkingEnvironment, setCheckingEnvironment] = useState(true);
  const router = useRouter();

  // Check if running in Mini App environment
  useEffect(() => {
    const checkEnvironment = async () => {
      try {
        const miniAppStatus = await sdk.isInMiniApp();
        setIsMiniApp(miniAppStatus);
      } catch (error) {
        console.error('Error checking Mini App environment:', error);
        setIsMiniApp(false);
      } finally {
        setCheckingEnvironment(false);
      }
    };

    checkEnvironment();
  }, []);

  // Fetch live streams on component mount (only if in Mini App)
  useEffect(() => {
    if (isMiniApp === true) {
      fetchLiveStreams();
    }
  }, [isMiniApp]);

  const fetchLiveStreams = async () => {
    try {
      const response = await fetch('/api/rooms');
      const data = await response.json();
      
      if (response.ok) {
        setLiveStreams(data.rooms || []);
      } else {
        console.error('Failed to fetch live streams:', data.error);
      }
    } catch (error) {
      console.error('Error fetching live streams:', error);
    } finally {
      setLoadingStreams(false);
    }
  };

  const createRoom = async () => {
    setIsLoading(true);
    
    try {
      // Generate a random room ID
      const roomId = Math.random().toString(36).substring(2, 15);
      
      // Get Farcaster user data
      const context = await sdk.context;
      const hostUserId = context.user.fid.toString();
      const hostUsername = context.user.username || 'Anonymous';
      const hostPfpUrl = context.user.pfpUrl;
      
      // Create room in database
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          hostUserId,
          hostUsername,
          hostPfpUrl,
        }),
      });

      if (response.ok) {
        // Navigate to the room
        router.push(`/room/${roomId}`);
      } else {
        const error = await response.json();
        console.error('Failed to create room:', error);
        alert('Failed to create room. Please try again.');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const joinStream = (roomId: string) => {
    router.push(`/room/${roomId}`);
  };

    // Show loading state while checking environment
  if (checkingEnvironment) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
        <p className="text-gray-300">Checking environment...</p>
      </div>
    );
  }

  // Show message if not in Mini App
  if (!isMiniApp) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-md">
          <Image 
            src="/logo.png" 
            alt="Streamly Icon" 
            width={64} 
            height={64} 
            className="mx-auto mb-6"
          />
          <h1 className="text-2xl font-bold text-white mb-4">Streamly</h1>
          <p className="text-gray-300 text-lg mb-6">
            Please open this app in Farcaster or Base App to use Streamly.
          </p>
          {/* <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400">
              Streamly is designed to work within the Farcaster ecosystem. 
              Open it from your Farcaster or Base App to start streaming and connecting with others.
            </p>
          </div> */}
        </div>
      </div>
    );
  }

  // Show normal app content if in Mini App
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center py-6 px-4">
        <h1 className="text-2xl font-bold text-white">Streamly</h1>
      </div>

      {/* Stream Grid */}
      <div className="flex-1 pb-24">
        <StreamGrid 
          streams={liveStreams}
          onStreamClick={joinStream}
          isLoading={loadingStreams}
        />
      </div>

      {/* Create Live Button - Fixed at bottom */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <button 
          onClick={createRoom}
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold py-4 px-8 rounded-full transition-colors flex items-center gap-3 shadow-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Create Live
            </>
          )}
        </button>
      </div>
    </div>
  );
}