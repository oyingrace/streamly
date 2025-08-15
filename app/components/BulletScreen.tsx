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

      // Remove message after animation completes (4 seconds)
      setTimeout(() => {
        setDisplayedMessages(prev => prev.filter(msg => msg.id !== latestMessage.id));
      }, 4000);
    }
  }, [messages]);

  return (
    <div className={`fixed inset-0 pointer-events-none z-40 overflow-hidden ${className}`}>
      {displayedMessages.map((message, index) => (
        <InstagramStyleMessage
          key={message.id}
          message={message}
          index={index}
        />
      ))}
    </div>
  );
}

interface InstagramStyleMessageProps {
  message: Message;
  index: number;
}

function InstagramStyleMessage({ message, index }: InstagramStyleMessageProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Start animation immediately
    setIsVisible(true);
  }, []);

  // Calculate position - messages appear closer to the middle and move up less
  const topPosition = 45 + (index * 12); // Start from 45% from top, each message only 12px apart

  return (
    <div
      className={`absolute left-4 right-4 transform transition-all duration-2000 ease-linear ${
        isVisible 
          ? '-translate-y-6 opacity-100' 
          : 'translate-y-1 opacity-0'
      }`}
      style={{
        top: `${topPosition}%`,
        animationDelay: `${index * 30}ms`,
      }}
    >
      <div className="bg-transparent text-white px-2 py-1 rounded-2xl shadow-lg border border-white/10 max-w-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-xs font-bold text-white">
            {message.userName ? message.userName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white/90 truncate">
              {message.userName || 'Anonymous'}
            </div>
            <div className="text-sm font-medium mt-0.5 break-words leading-tight">
              {message.text}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}