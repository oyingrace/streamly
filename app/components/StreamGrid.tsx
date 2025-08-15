// app/components/StreamGrid.tsx
'use client';

import { Users } from 'lucide-react';

interface LiveStream {
  room_id: string;
  host_username: string;
  current_viewers: number;
  total_viewers: number;
  created_at: string;
  stream_started_at: string;
}

interface StreamGridProps {
  streams: LiveStream[];
  onStreamClick: (roomId: string) => void;
  isLoading?: boolean;
}

export default function StreamGrid({ streams, onStreamClick, isLoading = false }: StreamGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 px-4">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="aspect-square bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-gray-600" />
        </div>
        <p className="text-gray-400 text-lg text-center">No live streams</p>
        <p className="text-gray-500 text-sm text-center mt-1">Be the first to go live!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 px-4">
      {streams.map((stream) => (
        <div
          key={stream.room_id}
          onClick={() => onStreamClick(stream.room_id)}
          className="aspect-square bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-750 transition-colors relative overflow-hidden"
        >
          {/* Stream Content */}
          <div className="flex flex-col items-center justify-center h-full p-3 pb-8">
            {/* Host Avatar */}
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {stream.host_username ? stream.host_username.charAt(0).toUpperCase() : 'H'}
              </span>
            </div>
          </div>

          {/* Live Badge */}
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            LIVE
          </div>

          {/* Viewer Count */}
          <div className="absolute top-2 right-2 flex items-center gap-1 text-white text-sm">
            <Users className="w-3 h-3" />
            <span>{stream.current_viewers}</span>
          </div>

          {/* Host Username at bottom */}
          <div className="absolute bottom-2 left-2 right-2">
            <p className="text-white font-semibold text-xs text-center truncate">
              {stream.host_username}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}