// app/components/ChatInput.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, X } from 'lucide-react';

interface ChatInputProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => void;
  placeholder?: string;
}

export default function ChatInput({
  isOpen,
  onClose,
  onSendMessage,
  placeholder = "live chat"
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      // Removed onClose() - user must manually close the input
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="bg-gray-900 rounded-t-xl shadow-2xl w-full max-w-sm mx-2 sm:mx-4 mb-0">
        {/* Header */}
        <div className="flex items-center justify-between px-2 sm:px-3 py-2 border-b border-gray-700">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors p-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Input Area */}
        <div className="p-2 sm:p-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="flex-1 px-2 sm:px-3 py-1.5 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              maxLength={100}
            />
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className={`p-1.5 rounded transition-colors flex-shrink-0 ${
                message.trim()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
          
          {/* Character count */}
          <div className="text-xs text-gray-500 mt-1 text-right">
            {message.length}/100
          </div>
        </div>
      </div>
    </div>
  );
}