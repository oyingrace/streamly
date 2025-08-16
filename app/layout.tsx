import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FarcasterSDK from "./components/FarcasterSDK";
import { streamlyEmbed, streamlyEmbedFrame } from "./lib/embedConfig";
import { Toaster } from 'react-hot-toast';
import QueryConfig from './components/QueryConfig';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Streamly",
  description: "Live streaming for everyone",
  other: {
    "fc:miniapp": JSON.stringify(streamlyEmbed),
    "fc:frame": JSON.stringify(streamlyEmbedFrame),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryConfig>
          <FarcasterSDK />
          {children}
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#fff',
                borderRadius: '8px',
              },
            }}
          />
        </QueryConfig>
      </body>
    </html>
  );
}
