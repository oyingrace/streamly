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
  host_user_id TEXT NOT NULL, -- Zego user ID (e.g., "user_123456789")
  host_username TEXT DEFAULT 'Host',
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
  user_id TEXT NOT NULL, -- Zego user ID
  username TEXT DEFAULT 'Anonymous',
  role participant_role DEFAULT 'viewer',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Stream messages table - stores chat/bullet screen messages
CREATE TABLE stream_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  username TEXT DEFAULT 'Anonymous',
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

-- Create a function to update total viewers count
CREATE OR REPLACE FUNCTION update_total_viewers()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE rooms 
    SET total_viewers = total_viewers + 1 
    WHERE id = NEW.room_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update total viewers when someone joins
CREATE TRIGGER update_total_viewers_trigger
  AFTER INSERT ON room_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_total_viewers();
