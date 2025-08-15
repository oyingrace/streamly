'use client';

import { Loader2 } from 'lucide-react';

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
  // Host start button
  if (!isStreaming && isHost) {
    return (
      <div className="absolute bottom-4 sm:bottom-10 left-0 right-0 z-10 flex justify-center pb-8 sm:pb-12">
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
      <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-10 flex justify-center pb-8 sm:pb-12">
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
            ) : (
              <span>Connected! Stream should appear shortly...</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
