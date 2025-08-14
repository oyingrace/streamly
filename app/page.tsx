'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const createRoom = async () => {
    setIsLoading(true);
    
    // Simulate room creation delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate a random room ID
    const roomId = Math.random().toString(36).substring(2, 15);
    
    // Navigate to the room
    router.push(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <button 
        onClick={createRoom}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating Room...
          </>
        ) : (
          'Create Live'
        )}
      </button>
    </div>
  );
}
