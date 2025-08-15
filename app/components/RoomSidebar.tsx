'use client';

import { MessageCircleMore } from 'lucide-react';
import HeartButton from './HeartButton';

interface RoomSidebarProps {
  onSendHeart: () => void;
  onShowChat: () => void;
}

export default function RoomSidebar({
  onSendHeart,
  onShowChat,
}: RoomSidebarProps) {
  return (
    <div className="absolute bottom-0 left-0 z-10 p-4 sm:p-6 flex flex-col gap-3">
      {/* Heart Button */}
      <HeartButton onSendHeart={onSendHeart} />
      
      {/* Chat Button */}
      <button 
        onClick={onShowChat}
        className="bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-colors"
      >
        <MessageCircleMore className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>
    </div>
  );
}
