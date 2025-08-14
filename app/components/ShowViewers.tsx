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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-t-xl shadow-2xl w-full max-w-md mx-4 max-h-[70vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {title} ({viewers.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {viewers.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No viewers yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {viewers.map((viewer, index) => (
                <div 
                  key={`${viewer.userID}-${index}`} 
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {viewer.userName || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
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
