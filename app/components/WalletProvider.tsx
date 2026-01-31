"use client";

import { FC, ReactNode, useMemo } from "react";
import dynamic from "next/dynamic";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { useNetwork } from "../contexts/NetworkContext";

const WalletModalProviderDynamic = dynamic(
    async () => {
      const { WalletModalProvider } = await import(
        "@solana/wallet-adapter-react-ui"
      );
      await import("@solana/wallet-adapter-react-ui/styles.css");
      const ModalProvider: FC<{ children: ReactNode }> = ({ children }) => (
        <WalletModalProvider>{children}</WalletModalProvider>
      );
      ModalProvider.displayName = "WalletModalProviderDynamic";
      return ModalProvider;
    },
    { ssr: false }
  );