'use client';

import { ChevronLeft, SwitchCamera } from 'lucide-react';

interface RoomTopControlsProps {
  onGoBack: () => void;
  onSwitchCamera: () => void;
  isHost: boolean;
}

export default function RoomTopControls({
  onGoBack,
  onSwitchCamera,
  isHost,
}: RoomTopControlsProps) {
  return (
    <div className="relative w-full flex justify-between items-center p-4 sm:p-6 mt-4 sm:mt-6">
      {/* Back Button */}
      <button
        onClick={onGoBack}
        className="bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-colors"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
      
      {/* Switch Camera Button - Only for hosts */}
      {isHost && (
        <button
          onClick={onSwitchCamera}
          className="bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-colors"
        >
          <SwitchCamera className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}
    </div>
  );
}
