'use client';

import { X, ExternalLink } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionHash: string;
  tokenAmount: string;
}

export default function SuccessModal({ isOpen, onClose, transactionHash, tokenAmount }: SuccessModalProps) {
  if (!isOpen) return null;

  const shortHash = `${transactionHash.slice(0, 4)}...${transactionHash.slice(-4)}`;
  const baseScanUrl = `https://basescan.org/tx/${transactionHash}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white text-black p-6 rounded-lg max-w-sm mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Success content */}
        <div className="text-center pt-8">
          <div className="text-2xl font-bold text-green-600 mb-4">
            ✅ Claimed!
          </div>
          
          <p className="text-gray-600 mb-6">
            You successfully claimed your daily {tokenAmount} $STRM reward!
          </p>

          {/* Transaction hash link */}
          <a
            href={baseScanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
          >
            <ExternalLink size={16} />
            {shortHash}
          </a>
        </div>
      </div>
    </div>
  );
}
