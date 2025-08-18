'use client';

import { useEffect, useState } from 'react';
import { Play, Users } from 'lucide-react';

interface RoomStatusProps {
  isHost: boolean;
  isInitializing: boolean;
  isStreaming: boolean;
  viewerCount: number;
  onStartStream?: () => void;
  isWatching?: boolean;
}

// Mobile device detection
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export default function RoomStatus({
  isHost,
  isInitializing,
  isStreaming,
  viewerCount,
  onStartStream,
  isWatching = false,
}: RoomStatusProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [showRetryMessage, setShowRetryMessage] = useState(false);
  const isMobile = isMobileDevice();

  // Show retry message for mobile viewers after a delay
  useEffect(() => {
    if (isMobile && !isHost && !isStreaming && !isWatching && !isInitializing) {
      const timer = setTimeout(() => {
        setShowRetryMessage(true);
        setRetryCount(prev => prev + 1);
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isMobile, isHost, isStreaming, isWatching, isInitializing]);

  // Auto-retry logic for mobile viewers
  useEffect(() => {
    if (isMobile && !isHost && !isStreaming && !isWatching && retryCount > 0 && retryCount < 5) {
      const retryTimer = setTimeout(() => {
        console.log(`🔄 Mobile viewer retry attempt ${retryCount + 1}/5`);
        // Trigger a page refresh or reconnection attempt
        window.location.reload();
      }, 5000 * retryCount); // Increasing delay between retries

      return () => clearTimeout(retryTimer);
    }
  }, [isMobile, isHost, isStreaming, isWatching, retryCount]);

  if (isHost) {
    return (
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-10">
        {!isStreaming && !isInitializing && (
          <button
            onClick={onStartStream}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full transition-colors flex items-center gap-2 shadow-lg"
          >
            <Play className="w-5 h-5" />
            Start Stream
          </button>
        )}
        
        {isInitializing && (
          <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Setting up stream...
            </div>
          </div>
        )}
        
       {/*  {isStreaming && (
          <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              Live
            </div>
          </div>
        )} */}
      </div>
    );
  }

  // Viewer status
  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-10">
      {isInitializing && (
        <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Connecting to stream...
          </div>
        </div>
      )}
      
      {!isInitializing && !isWatching && (
        <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            {showRetryMessage ? (
              <div className="text-center">
                <div>Connected, looking for stream...</div>
                {isMobile && retryCount > 0 && (
                  <div className="text-xs text-gray-300 mt-1">
                    Retrying in {Math.max(0, 5 - retryCount)}s... ({retryCount}/5)
                  </div>
                )}
              </div>
            ) : (
              <div>Connecting to stream...</div>
            )}
          </div>
        </div>
      )}
      
           {/*   {isWatching && (
         <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             Watching
           </div>
         </div>
       )} */}
    </div>
  );
}
