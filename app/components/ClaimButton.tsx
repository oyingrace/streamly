'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt, useReadContract, useSimulateContract } from 'wagmi';
import toast from 'react-hot-toast';
import { dailyClaimAbi, CONTRACTS, ERROR_MESSAGES } from '../lib/contracts';
import { sdk } from '@farcaster/miniapp-sdk';
import { logger } from '../lib/logger';
import ConfirmDialog from './ConfirmDialog';
import SuccessModal from './SuccessModal';

interface ClaimButtonProps {
  className?: string;
}

export default function ClaimButton({ className = '' }: ClaimButtonProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<(() => void) | null>(null);
  
  // Wagmi hooks
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: claimAmount } = useReadContract({
    address: CONTRACTS.dailyClaim,
    abi: dailyClaimAbi,
    functionName: 'claimAmount',
  });

  // Simulate claim to check eligibility
  const { data: simulation, error: simulationError, isPending: isSimulating } = useSimulateContract({
    address: CONTRACTS.dailyClaim,
    abi: dailyClaimAbi,
    functionName: 'claim',
    query: {
      enabled: isConnected && !!address,
    },
  });

  // Debug logging
  useEffect(() => {
    logger.wallet('Wallet Debug Info', {
      isConnected,
      address,
      connectors: connectors.map(c => ({ id: c.id, name: c.name, ready: c.ready })),
      claimAmount: claimAmount?.toString(),
      simulationError: simulationError?.message,
    });
  }, [isConnected, address, connectors, claimAmount, simulationError]);
  
  const { 
    data: hash,
    error,
    isPending, 
    writeContract 
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ 
    hash, 
  });

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed && hash) {
      setShowSuccessModal(true);
    }
  }, [isConfirmed, hash]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      console.log('❌ Transaction error:', error);
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
    console.log('🔍 Error details:', {
      error,
      shortMessage: error.shortMessage,
      message: error.message,
      toString: error.toString(),
      cause: error.cause,
    });
    
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
    
    // Check for insufficient funds (this might be masking the real error)
    if (message.includes('insufficient funds') || message.includes('gas')) {
      // Check if this is actually a contract revert in disguise
      if (error.cause?.message?.includes('DailyClaim')) {
        return 'You\'ve already claimed today. Come back tomorrow!';
      }
      return 'Insufficient funds for gas fees. Please add more Base ETH.';
    }
    
    // Check for network errors
    if (message.includes('network') || message.includes('connection')) {
      return 'Network error. Please try again.';
    }
    
    // Default error message
    return 'An unexpected error occurred. Please try again.';
  };

  const handleClaim = async () => {
    console.log('🚀 Claim button clicked');
    console.log('📊 Current state:', { isConnected, address, connectorsCount: connectors.length });
    
    // Connect wallet if not connected
    if (!isConnected) {
      console.log('🔌 Attempting to connect wallet...');
      try {
        const result = await connect({ connector: connectors[0] });
        console.log('✅ Wallet connection result:', result);
        toast.success('Wallet connected! Click claim again.');
        return; // Let the user click claim again after connection
      } catch (error) {
        console.error('❌ Wallet connection failed:', error);
        toast.error('Failed to connect wallet. Please try again.');
        return;
      }
    }

    // Check if claim is possible using simulation
    if (simulationError) {
      console.log('❌ Simulation error:', simulationError);
      const errorMessage = getErrorMessage(simulationError);
      toast.error(errorMessage);
      return;
    }

    // Show custom confirmation dialog
    const tokenAmount = formatTokenAmount(claimAmount);
    setPendingTransaction(() => () => {
      // Send transaction
      try {
        writeContract({
          address: CONTRACTS.dailyClaim,
          abi: dailyClaimAbi,
          functionName: 'claim',
        });
      } catch (error) {
        console.error('Error sending transaction:', error);
        toast.error('Failed to send transaction. Please try again.');
      }
    });
    setShowConfirmDialog(true);
  };

  // Determine button state and text
  const getButtonState = () => {
    if (!isConnected) return { text: 'Claim', disabled: false };
    if (isSimulating) return { text: 'Checking...', disabled: true };
    if (simulationError) return { text: 'Claim', disabled: false };
    if (isPending) return { text: 'Claiming...', disabled: true };
    if (isConfirming) return { text: 'Claiming...', disabled: true };
    if (isConfirmed) return { text: 'Claim', disabled: false };
    return { text: 'Claim', disabled: false };
  };

  const { text, disabled } = getButtonState();

  return (
    <>
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
      
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => {
          if (pendingTransaction) {
            pendingTransaction();
          }
        }}
        title="Confirm Claim"
        message={`Claim ${formatTokenAmount(claimAmount)} $STRM tokens?`}
      />
      
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        transactionHash={hash || ''}
        tokenAmount={formatTokenAmount(claimAmount)}
      />
    </>
  );
}
