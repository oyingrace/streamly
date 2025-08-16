'use client';

import { sdk } from '@farcaster/miniapp-sdk';
import { useEffect } from 'react';

export default function FarcasterSDK() {
  useEffect(() => {
    // Hide the splash screen and display the app content
    sdk.actions.ready();
  }, []);

  return null; // This component doesn't render anything
}
