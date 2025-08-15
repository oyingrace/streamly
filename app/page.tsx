// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import StreamGrid from './components/StreamGrid';

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
  const router = useRouter();

  // Fetch live streams on component mount
  useEffect(() => {
    fetchLiveStreams();
  }, []);

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
      
      // Generate a random user ID for the host
      const hostUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const hostUsername = `Host_${Math.random().toString(36).substring(2, 6)}`;
      
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