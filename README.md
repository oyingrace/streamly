# Streamly - Live Streaming Platform

A modern live streaming application built with Next.js, featuring real-time video streaming, chat, and viewer interaction.

## Features

- 🎥 **Live Video Streaming** - Real-time video/audio streaming using Zego Express Engine
- 💬 **Live Chat** - Real-time messaging between viewers and hosts
- 🎯 **Bullet Screen** - Messages that scroll across the screen
- ❤️ **Heart Reactions** - Interactive engagement features
- 👥 **Viewer Tracking** - Real-time viewer count and participant list
- 📊 **Database Integration** - Persistent storage with Supabase
- 📱 **Responsive Design** - Mobile-friendly interface

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Real-time**: Zego Express Engine WebRTC SDK
- **Database**: Supabase (PostgreSQL)
- **UI**: Lucide React icons, custom components

## Getting Started

### Prerequisites

1. **Supabase Account** - Create a project at [supabase.com](https://supabase.com)
2. **Zego Account** - Sign up at [zego.im](https://zego.im) for streaming services

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd streamly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `NEXT_PUBLIC_ZEGO_APP_ID` - Your Zego App ID
   - `NEXT_PUBLIC_ZEGO_SERVER_URL` - Your Zego Server URL
   - `ZEGO_SERVER_SECRET` - Your Zego Server Secret

4. **Set up the database**
   - Go to your Supabase project SQL Editor
   - Run the schema file: `schema/01_create_tables.sql`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Create a Live Stream**
   - Click "Create Live" on the home page
   - A new room will be created and you'll be taken to the streaming interface

2. **Start Streaming**
   - Click the "Start Stream" button to begin broadcasting
   - Your stream will appear on the home page for others to join

3. **Join as Viewer**
   - Click on any live stream from the home page
   - You can chat, send hearts, and interact with the stream

## Database Schema

The application uses PostgreSQL with the following main tables:
- `rooms` - Stores room information and stream status
- `room_participants` - Tracks who's in each room
- `stream_messages` - Stores chat and bullet screen messages

See `schema/README.md` for detailed database documentation.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Zego Express Engine](https://docs.zego.im/article/14663)
- [Supabase Documentation](https://supabase.com/docs)
