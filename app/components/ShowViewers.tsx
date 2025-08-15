'use client';

import { useEffect, useState } from 'react';
import { X, Users, Loader2 } from 'lucide-react';

interface Viewer {
  userID: string;
  userName?: string;
}

interface ShowViewersProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  title?: string;
  hostUsername?: string;
}

export default function ShowViewers({
  isOpen,
  onClose,
  roomId,
  title = 'Viewers',
  hostUsername
}: ShowViewersProps) {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [cachedViewers, setCachedViewers] = useState<Viewer[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Function to fetch participants from database
  const fetchParticipants = async (isBackground = false) => {
    if (!roomId) return;
    
    if (!isBackground) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}?action=get_participants`);
      if (response.ok) {
        const data = await response.json();
        const participants = data.participants || [];
        
        // Transform database participants to match our interface
        const viewersList = participants.map((participant: any) => ({
          userID: participant.user_id,
          userName: participant.username
        }));
        
        setViewers(viewersList);
        setCachedViewers(viewersList);
        setLastFetchTime(Date.now());
      } else {
        console.error('Failed to fetch participants');
        if (!isBackground) {
          setViewers([]);
        }
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      if (!isBackground) {
        setViewers([]);
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  // Show cached data immediately when modal opens
  useEffect(() => {
    if (isOpen) {
      // Show cached data immediately if available
      if (cachedViewers.length > 0) {
        setViewers(cachedViewers);
      }
      
      // Fetch fresh data in background
      fetchParticipants(true);
    }
  }, [isOpen, roomId]);

  // Background refresh when modal is closed
  useEffect(() => {
    if (!isOpen && cachedViewers.length > 0) {
      // Fetch fresh data in background when modal closes
      const timer = setTimeout(() => {
        fetchParticipants(true);
      }, 1000); // Wait 1 second after closing

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close when Escape key is pressed
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Close when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-900 rounded-t-xl shadow-2xl w-full max-w-sm mx-2 sm:mx-4 max-h-[70vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-2 sm:px-3 py-2 border-b border-gray-700">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <h3 className="text-sm font-semibold text-white truncate">
              {title} ({viewers.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors p-1 flex-shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Content */}
        <div className="p-2 sm:p-3 max-h-[60vh] overflow-y-auto overflow-x-hidden">
          {loading ? (
            <div className="text-center text-gray-500 py-6">
              <Loader2 className="w-8 h-8 mx-auto mb-2 text-gray-600 animate-spin" />
              <p className="text-sm">Loading participants...</p>
            </div>
          ) : viewers.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-sm">No viewers yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {viewers.map((viewer, index) => {
                // Determine if this is the host
                const isHost = hostUsername && viewer.userName === hostUsername;
                
                // Get display name
                let displayName = viewer.userName || 'Anonymous';
                if (isHost) {
                  displayName = `(Host) ${displayName}`;
                }
                
                // Get first character for profile picture
                const firstChar = displayName.charAt(0).toUpperCase();
                
                return (
                  <div 
                    key={`${viewer.userID}-${index}`} 
                    className="flex items-center gap-2 sm:gap-3 p-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-750 transition-colors min-w-0"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {firstChar}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="text-sm font-medium text-white truncate">
                        {displayName}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}