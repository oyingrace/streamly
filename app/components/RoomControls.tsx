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
      <div className="fixed bottom-6 right-4 z-10 flex items-center gap-2">
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
    <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
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
