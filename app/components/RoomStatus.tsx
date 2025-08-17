'use client';

import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface RoomStatusProps {
  isHost: boolean;
  isInitializing: boolean;
  isLoggedIn: boolean;
  zegoEngine: any;
  isStreaming: boolean;
  isWatching: boolean;
  onStartStream?: () => void;
}

export default function RoomStatus({
  isHost,
  isInitializing,
  isLoggedIn,
  zegoEngine,
  isStreaming,
  isWatching,
  onStartStream,
}: RoomStatusProps) {
  const [viewerWaitTime, setViewerWaitTime] = useState(0);
  const [showRetryMessage, setShowRetryMessage] = useState(false);

  // Track how long viewer has been waiting for stream
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (!isHost && !isStreaming && !isWatching && isLoggedIn && !isInitializing) {
      interval = setInterval(() => {
        setViewerWaitTime(prev => {
          const newTime = prev + 1;
          // Show retry message after 10 seconds
          if (newTime >= 10 && !showRetryMessage) {
            setShowRetryMessage(true);
          }
          return newTime;
        });
      }, 1000);
    } else {
      setViewerWaitTime(0);
      setShowRetryMessage(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHost, isStreaming, isWatching, isLoggedIn, isInitializing, showRetryMessage]);

  // Retry function to check for streams again
  const retryStreamCheck = async () => {
    if (!zegoEngine) return;
    
    try {
      console.log('🔄 Retrying stream check...');
      setShowRetryMessage(false);
      setViewerWaitTime(0);
      
      // Get current stream list
      const streamList = await zegoEngine.getStreamList();
      console.log('🔄 Retry - Found streams:', streamList);
      
      if (streamList && streamList.length > 0) {
        console.log('✅ Retry successful - streams found!');
        // The roomStreamUpdate event should handle the rest
      } else {
        console.log('⚠️ Retry - still no streams found');
        setShowRetryMessage(true);
      }
    } catch (error) {
      console.error('❌ Error during retry:', error);
      setShowRetryMessage(true);
    }
  };

  // Host start button
  if (!isStreaming && isHost) {
    return (
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <button 
          onClick={onStartStream}
          disabled={isInitializing || !zegoEngine || !isLoggedIn}
          className={`font-bold py-3 px-8 sm:py-4 sm:px-12 rounded-full text-lg sm:text-xl transition-colors shadow-lg flex items-center gap-2 ${
            isInitializing || !zegoEngine || !isLoggedIn
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          {isInitializing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Initializing...
            </>
          ) : !zegoEngine || !isLoggedIn ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Connecting...
            </>
          ) : (
            'Start Stream'
          )}
        </button>
      </div>
    );
  }

  // Viewer status
  if (!isStreaming && !isHost && !isWatching) {
    return (
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black/30 backdrop-blur-md rounded-lg px-6 py-3 border border-white/20">
          <div className="text-white text-center">
            {isInitializing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Joining stream...</span>
              </div>
            ) : !zegoEngine || !isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </div>
            ) : showRetryMessage ? (
              <div className="space-y-2">
                <div className="text-sm text-yellow-300">
                  Stream not detected. The host might not be streaming yet.
                </div>
                <button 
                  onClick={retryStreamCheck}
                  className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
                >
                  Retry Connection
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {viewerWaitTime > 0 
                    ? `Connected! Looking for stream... (${viewerWaitTime}s)`
                    : 'Connected! Stream should appear shortly...'
                  }
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
