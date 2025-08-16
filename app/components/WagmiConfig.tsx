'use client';

import { WagmiProvider } from 'wagmi';
import { config } from '../lib/wagmi';

interface WagmiConfigProps {
  children: React.ReactNode;
}

export default function WagmiConfig({ children }: WagmiConfigProps) {
  return (
    <WagmiProvider config={config}>
      {children}
    </WagmiProvider>
  );
}
