'use client';

import { Users, X } from 'lucide-react';
import Image from 'next/image';

interface RoomHeaderProps {
  hostUsername: string;
  hostPfpUrl?: string;
  viewerCount: number;
  isHost: boolean;
  onShowViewersList: () => void;
  onEndStream: () => void;
}

export default function RoomHeader({
  hostUsername,
  hostPfpUrl,
  viewerCount,
  isHost,
  onShowViewersList,
  onEndStream,
}: RoomHeaderProps) {
  return (
    <>
      {/* Top Left - Host Username */}
      <div className="fixed top-6 left-4 z-10">
        <div className="bg-black/30 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
          <div className="flex items-center gap-2">
            {hostPfpUrl ? (
              <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                <Image 
                  src={hostPfpUrl} 
                  alt={`${hostUsername}'s profile`}
                  width={24}
                  height={24}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {hostUsername.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-white text-xs sm:text-sm font-medium">
              {hostUsername}
            </div>
          </div>
        </div>
      </div>

      {/* Top Right Controls Container */}
      <div className="fixed top-6 right-4 z-10 flex items-center gap-3">
        {/* Viewer Count - Only for hosts */}
        {isHost && (
          <button 
            onClick={onShowViewersList}
            className="bg-black/30 backdrop-blur-md rounded-lg px-3 py-2 flex items-center gap-2 border border-white/20 hover:bg-black/40 transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            <span className="text-white text-sm sm:text-base font-medium">
              {viewerCount}
            </span>
          </button>
        )}

        {/* End Stream Button - Only for hosts */}
        {isHost && (
          <button 
            onClick={onEndStream}
            className="bg-red-600 hover:bg-red-700 text-white p-2 sm:p-3 rounded-full transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>
    </>
  );
}
