'use client';

import { useState } from 'react';

interface HeartButtonProps {
  onSendHeart: () => void;
  className?: string;
}

export default function HeartButton({ onSendHeart, className = '' }: HeartButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    onSendHeart();
    
    // Reset animation after it completes
    setTimeout(() => setIsAnimating(false), 1000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isAnimating}
      className={`bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-all duration-300 ${
        isAnimating ? 'scale-125' : 'hover:scale-110'
      } ${className}`}
    >
      <span className={`text-lg sm:text-xl ${isAnimating ? 'animate-pulse' : ''}`}>
        💖
      </span>
    </button>
  );
}
