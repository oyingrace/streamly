import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
        port: '',
        pathname: '/**',
      },
      // Allow Farcaster profile pictures
      {
        protocol: 'https',
        hostname: 'farcaster.network',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'farcaster.xyz',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.farcaster.network',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.farcaster.xyz',
        port: '',
        pathname: '/**',
      },
      // Allow common image hosting services
      {
        protocol: 'https',
        hostname: '*.cloudflare.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.ipfs.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.ipfs.dweb.link',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
