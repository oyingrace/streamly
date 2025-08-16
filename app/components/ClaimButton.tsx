'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useSendTransaction, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import toast from 'react-hot-toast';
import { HelpCircle } from 'lucide-react';
import { useStreamingEligibility } from '../hooks/useStreamingEligibility';
import { dailyClaimAbi, CONTRACTS, ERROR_MESSAGES } from '../lib/contracts';
import { sdk } from '@farcaster/miniapp-sdk';

interface ClaimButtonProps {
  className?: string;
}

export default function ClaimButton({ className = '' }: ClaimButtonProps) {
  const [userId, setUserId] = useState<string | null>(null);
  
  // Wagmi hooks
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: claimAmount } = useReadContract({
    address: CONTRACTS.dailyClaim,
    abi: dailyClaimAbi,
    functionName: 'claimAmount',
  });
  
  const { 
    data: hash,
    error,
    isPending, 
    sendTransaction 
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ 
    hash, 
  });

  // Streaming eligibility
  const { eligible, loading: eligibilityLoading, error: eligibilityError, refreshEligibility } = useStreamingEligibility(userId);

  // Get user ID from Farcaster SDK
  useEffect(() => {
    const getUserData = async () => {
      try {
        const context = await sdk.context;
        setUserId(context.user.fid.toString());
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    };
    getUserData();
  }, []);

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed) {
      toast.success(`✅ You claimed your daily ${formatTokenAmount(claimAmount)} $STREAM reward!`);
      refreshEligibility(); // Refresh eligibility after successful claim
    }
  }, [isConfirmed, claimAmount, refreshEligibility]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
    }
  }, [error]);

  const formatTokenAmount = (amount: bigint | undefined) => {
    if (!amount) return '0';
    // Assuming 18 decimals
    return (Number(amount) / 1e18).toString();
  };

  const getErrorMessage = (error: any) => {
    const message = error.shortMessage || error.message || error.toString();
    
    // Check for specific contract errors
    for (const [contractError, userMessage] of Object.entries(ERROR_MESSAGES)) {
      if (message.includes(contractError)) {
        return userMessage;
      }
    }
    
    // Check for user rejection
    if (message.includes('User rejected') || message.includes('User denied')) {
      return 'Transaction cancelled';
    }
    
    // Check for network errors
    if (message.includes('network') || message.includes('connection')) {
      return 'Network error. Please try again.';
    }
    
    // Default error message
    return 'An unexpected error occurred. Please try again.';
  };

  const handleClaim = async () => {
    // Check eligibility first
    if (!eligible) {
      toast.error('You need to stream or watch for at least 2 minutes to claim tokens.');
      return;
    }

    // Connect wallet if not connected
    if (!isConnected) {
      try {
        await connect({ connector: connectors[0] });
        return; // Let the user click claim again after connection
      } catch (error) {
        toast.error('Failed to connect wallet. Please try again.');
        return;
      }
    }

    // Show transaction preview
    const tokenAmount = formatTokenAmount(claimAmount);
    const confirmed = window.confirm(`Claim ${tokenAmount} $STREAM tokens?`);
    
    if (!confirmed) {
      return;
    }

    // Send transaction
    try {
      sendTransaction({
        to: CONTRACTS.dailyClaim,
        data: '0x379607f5', // claim() function selector
      });
    } catch (error) {
      console.error('Error sending transaction:', error);
      toast.error('Failed to send transaction. Please try again.');
    }
  };

  // Determine button state and text
  const getButtonState = () => {
    if (eligibilityLoading) return { text: 'Claim', disabled: true };
    if (!eligible) return { text: 'Claim', disabled: true };
    if (!isConnected) return { text: 'Claim', disabled: false };
    if (isPending) return { text: 'Claiming...', disabled: true };
    if (isConfirming) return { text: 'Claiming...', disabled: true };
    if (isConfirmed) return { text: 'Claimed!', disabled: true };
    return { text: 'Claim', disabled: false };
  };

  const { text, disabled } = getButtonState();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClaim}
        disabled={disabled}
        className={`
          bg-white text-black font-semibold py-3 px-6 rounded-lg
          hover:bg-gray-100 disabled:bg-gray-200 disabled:text-gray-500
          transition-colors duration-200 shadow-md
          ${className}
        `}
      >
        {text}
      </button>
      
      {/* Tooltip with question mark icon */}
      <div className="relative group">
        <HelpCircle 
          className="w-5 h-5 text-gray-400 hover:text-gray-300 cursor-help transition-colors" 
        />
        
        {/* Tooltip content */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          Stream a live or join a live stream for 2 mins + to claim
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      </div>
    </div>
  );
}
