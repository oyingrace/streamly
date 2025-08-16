-- Live Streaming App Database Schema
-- This file contains all the necessary tables for the live streaming functionality

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types for better type safety and performance
CREATE TYPE room_status AS ENUM ('created', 'live', 'ended');
CREATE TYPE participant_role AS ENUM ('host', 'viewer');
CREATE TYPE message_type AS ENUM ('chat', 'heart', 'system');

-- Rooms table - stores all room information
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT UNIQUE NOT NULL, -- The actual room ID used in the app (e.g., "abc123")
  host_user_id TEXT NOT NULL, -- Farcaster FID (e.g., "12345")
  host_username TEXT DEFAULT 'Host', -- Farcaster username (e.g., "alice.eth")
  host_pfp_url TEXT, -- Farcaster profile picture URL
  status room_status DEFAULT 'created',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stream_started_at TIMESTAMP WITH TIME ZONE,
  stream_ended_at TIMESTAMP WITH TIME ZONE,
  current_viewers INTEGER DEFAULT 0,
  max_viewers INTEGER DEFAULT 1000,
  total_viewers INTEGER DEFAULT 0, -- Total unique viewers who joined
  stream_duration INTEGER DEFAULT 0, -- Duration in seconds
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room participants table - tracks who's currently in each room
CREATE TABLE room_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Farcaster FID (e.g., "12345")
  username TEXT DEFAULT 'Anonymous', -- Farcaster username (e.g., "alice.eth")
  pfp_url TEXT, -- Farcaster profile picture URL
  role participant_role DEFAULT 'viewer',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Stream messages table - stores chat/bullet screen messages
CREATE TABLE stream_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Farcaster FID (e.g., "12345")
  username TEXT DEFAULT 'Anonymous', -- Farcaster username (e.g., "alice.eth")
  message TEXT NOT NULL,
  message_type message_type DEFAULT 'chat',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_created_at ON rooms(created_at);
CREATE INDEX idx_rooms_host_user_id ON rooms(host_user_id);
CREATE INDEX idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX idx_room_participants_user_id ON room_participants(user_id);
CREATE INDEX idx_room_participants_is_active ON room_participants(is_active);
CREATE INDEX idx_stream_messages_room_id ON stream_messages(room_id);
CREATE INDEX idx_stream_messages_created_at ON stream_messages(created_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_rooms_updated_at 
  BEFORE UPDATE ON rooms 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create a function to calculate stream duration
CREATE OR REPLACE FUNCTION calculate_stream_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ended' AND OLD.status = 'live' THEN
    NEW.stream_duration = EXTRACT(EPOCH FROM (NEW.stream_ended_at - NEW.stream_started_at));
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to calculate stream duration when stream ends
CREATE TRIGGER calculate_stream_duration_trigger
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION calculate_stream_duration();

-- Create a function to update total viewers count (unique viewers only)
CREATE OR REPLACE FUNCTION update_total_viewers()
RETURNS TRIGGER AS $$
DECLARE
  unique_viewers_count INTEGER;
BEGIN
  -- Count unique viewers (excluding host) for this room
  SELECT COUNT(DISTINCT user_id) INTO unique_viewers_count
  FROM room_participants 
  WHERE room_id = NEW.room_id 
    AND role = 'viewer' 
    AND is_active = true;
  
  -- Update the total_viewers count
  UPDATE rooms 
  SET total_viewers = unique_viewers_count
  WHERE id = NEW.room_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update total viewers when participants change
CREATE TRIGGER update_total_viewers_trigger
  AFTER INSERT OR UPDATE OR DELETE ON room_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_total_viewers();
