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
  roomId: string;
  className?: string;
}

export default function BulletScreen({ messages, roomId, className = '' }: BulletScreenProps) {
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  const [usernameMap, setUsernameMap] = useState<Record<string, string>>({});

  // Function to fetch usernames from database
  const fetchUsernames = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}?action=get_participants`);
      if (response.ok) {
        const data = await response.json();
        const participants = data.participants || [];
        
        // Create a map of user_id to username
        const userMap: Record<string, string> = {};
        participants.forEach((participant: any) => {
          userMap[participant.user_id] = participant.username;
        });
        
        setUsernameMap(userMap);
      }
    } catch (error) {
      console.error('Error fetching usernames:', error);
    }
  };

  // Fetch usernames when component mounts
  useEffect(() => {
    fetchUsernames();
  }, [roomId]);

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
          usernameMap={usernameMap}
        />
      ))}
    </div>
  );
}

interface InstagramStyleMessageProps {
  message: Message;
  index: number;
}

function InstagramStyleMessage({ message, index, usernameMap }: InstagramStyleMessageProps & { usernameMap: Record<string, string> }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Start animation immediately
    setIsVisible(true);
  }, []);

  // Get username from database map, fallback to Zego data, then to 'Anonymous'
  const displayName = usernameMap[message.userID] || message.userName || 'Anonymous';

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
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-white/90 truncate">
            {displayName}
          </div>
          <div className="text-sm font-medium mt-0.5 break-words leading-tight">
            {message.text}
          </div>
        </div>
      </div>
    </div>
  );
}