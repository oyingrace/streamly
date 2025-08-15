'use client';

import { useEffect } from 'react';
import { X, Users } from 'lucide-react';

interface Viewer {
  userID: string;
  userName?: string;
}

interface ShowViewersProps {
  isOpen: boolean;
  onClose: () => void;
  viewers: Viewer[];
  title?: string;
}

export default function ShowViewers({
  isOpen,
  onClose,
  viewers,
  title = 'Viewers'
}: ShowViewersProps) {
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
      <div className="bg-gray-900 rounded-t-xl shadow-2xl w-full max-w-md mx-4 max-h-[70vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-white">
              {title} ({viewers.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors p-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 max-h-[60vh] overflow-y-auto">
          {viewers.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-sm">No viewers yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {viewers.map((viewer, index) => (
                <div 
                  key={`${viewer.userID}-${index}`} 
                  className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-750 transition-colors"
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {viewer.userName ? viewer.userName.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {viewer.userName || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-400 font-mono truncate">
                      {viewer.userID}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}