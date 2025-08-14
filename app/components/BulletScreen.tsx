'use client';

import { useEffect, useState } from 'react';

interface Message {
  id: string;
  text: string;
  userID: string;
  userName?: string;
  timestamp: number;
}

interface BulletScreenProps {
  messages: Message[];
  className?: string;
}

export default function BulletScreen({ messages, className = '' }: BulletScreenProps) {
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      setDisplayedMessages(prev => [...prev, latestMessage]);

      // Remove message after animation completes (5 seconds)
      setTimeout(() => {
        setDisplayedMessages(prev => prev.filter(msg => msg.id !== latestMessage.id));
      }, 5000);
    }
  }, [messages]);

  return (
    <div className={`fixed inset-0 pointer-events-none z-40 overflow-hidden ${className}`}>
      {displayedMessages.map((message, index) => (
        <BulletMessage
          key={message.id}
          message={message}
          index={index}
        />
      ))}
    </div>
  );
}

interface BulletMessageProps {
  message: Message;
  index: number;
}

function BulletMessage({ message, index }: BulletMessageProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Stagger animation start
    setTimeout(() => setIsVisible(true), index * 100);
  }, [index]);

  // Generate random vertical position
  const topPosition = Math.random() * 60 + 20; // 20% to 80% of screen height

  return (
    <div
      className={`absolute left-0 transform transition-all duration-5000 ease-linear ${
        isVisible ? 'translate-x-full opacity-100' : 'translate-x-0 opacity-0'
      }`}
      style={{
        top: `${topPosition}%`,
        animationDelay: `${index * 100}ms`,
      }}
    >
      <div className="bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-lg border border-white/20 max-w-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
          <span className="text-xs font-medium text-blue-300">
            {message.userName || 'Anonymous'}
          </span>
        </div>
        <div className="text-sm font-medium mt-1 break-words">
          {message.text}
        </div>
      </div>
    </div>
  );
}
