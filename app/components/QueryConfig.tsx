'use client';

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from '../lib/wagmi';

interface QueryConfigProps {
  children: React.ReactNode;
}

export default function QueryConfig({ children }: QueryConfigProps) {
  const queryClient = new QueryClient();

  // Debug logging for Wagmi initialization
  useEffect(() => {
    console.log('🔧 Wagmi Config initialized:', {
      config,
      chains: config.chains.map(c => ({ id: c.id, name: c.name })),
      connectors: config.connectors.map(c => ({ id: c.id, name: c.name })),
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  );
}
