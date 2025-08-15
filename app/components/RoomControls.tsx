'use client';

import { SwitchCamera, Mic, MicOff, Video, VideoOff, X } from 'lucide-react';

interface RoomControlsProps {
  isMicOn: boolean;
  isVideoOn: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onSwitchCamera: () => void;
  isHost: boolean;
  onExit?: () => void;
}

export default function RoomControls({
  isMicOn,
  isVideoOn,
  onToggleMic,
  onToggleVideo,
  onSwitchCamera,
  isHost,
  onExit,
}: RoomControlsProps) {
  if (isHost) {
    return (
      <div className="absolute bottom-4 sm:bottom-6 right-0 z-10 flex items-center gap-2 p-4 sm:p-6">
        {/* Switch Camera */}
        <button
          onClick={onSwitchCamera}
          className="bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-colors"
        >
          <SwitchCamera className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>

        {/* Microphone Toggle */}
        <button
          onClick={onToggleMic}
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
          onClick={onToggleVideo}
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
    );
  }

  // Viewer controls - only exit button
  return (
    <div className="absolute top-0 right-0 z-10 flex items-center gap-2 p-4 sm:p-6">
      {/* Exit Button for Viewers */}
      <button
        onClick={onExit}
        className="bg-red-600 hover:bg-red-700 text-white p-2 sm:p-3 rounded-full transition-colors"
      >
        <X className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>
    </div>
  );
}
