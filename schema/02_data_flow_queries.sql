-- Data Flow SQL Queries
-- This file contains all the SQL queries needed for the live streaming data flow

-- ===========================================
-- 1. When user clicks "Create Live"
-- ===========================================

-- Create room record in database
INSERT INTO rooms (room_id, host_user_id, host_username, status)
VALUES ($1, $2, $3, 'created')
RETURNING *;

-- Example usage:
-- INSERT INTO rooms (room_id, host_user_id, host_username)
-- VALUES ('abc123', 'user_123456789', 'John');

-- ===========================================
-- 2. When user starts streaming
-- ===========================================

-- Update room status to "live" and store stream start time
UPDATE rooms 
SET 
  status = 'live',
  stream_started_at = NOW(),
  updated_at = NOW()
WHERE room_id = $1
RETURNING *;

-- Add host as participant
INSERT INTO room_participants (room_id, user_id, username, role)
SELECT id, host_user_id, host_username, 'host'
FROM rooms 
WHERE room_id = $1;

-- Example usage:
-- UPDATE rooms SET status = 'live', stream_started_at = NOW() WHERE room_id = 'abc123';

-- ===========================================
-- 3. When user ends stream
-- ===========================================

-- Update status to "ended" and store end time
UPDATE rooms 
SET 
  status = 'ended',
  stream_ended_at = NOW(),
  updated_at = NOW()
WHERE room_id = $1
RETURNING *;

-- Mark all participants as inactive
UPDATE room_participants 
SET 
  is_active = false,
  left_at = NOW()
WHERE room_id = (SELECT id FROM rooms WHERE room_id = $1);

-- Example usage:
-- UPDATE rooms SET status = 'ended', stream_ended_at = NOW() WHERE room_id = 'abc123';

-- ===========================================
-- 4. Landing page - Query active live streams
-- ===========================================

-- Get all active live streams for grid display
SELECT 
  r.room_id,
  r.host_username,
  r.current_viewers,
  r.total_viewers,
  r.created_at,
  r.stream_started_at,
  EXTRACT(EPOCH FROM (NOW() - r.stream_started_at))::INTEGER as stream_duration_seconds
FROM rooms r
WHERE r.status = 'live'
ORDER BY r.stream_started_at DESC;

-- Get live streams with participant count
SELECT 
  r.room_id,
  r.host_username,
  r.current_viewers,
  r.total_viewers,
  r.created_at,
  r.stream_started_at,
  COUNT(rp.id) as active_participants
FROM rooms r
LEFT JOIN room_participants rp ON r.id = rp.room_id AND rp.is_active = true
WHERE r.status = 'live'
GROUP BY r.id, r.room_id, r.host_username, r.current_viewers, r.total_viewers, r.created_at, r.stream_started_at
ORDER BY r.stream_started_at DESC;

-- ===========================================
-- 5. When user clicks on stream - Join as audience
-- ===========================================

-- First, get the room details
SELECT * FROM rooms WHERE room_id = $1 AND status = 'live';

-- Add user as participant (viewer)
INSERT INTO room_participants (room_id, user_id, username, role)
SELECT id, $2, $3, 'viewer'
FROM rooms 
WHERE room_id = $1 AND status = 'live'
RETURNING *;

-- Update viewer count
UPDATE rooms 
SET 
  current_viewers = (
    SELECT COUNT(*) 
    FROM room_participants 
    WHERE room_id = rooms.id AND is_active = true
  ),
  updated_at = NOW()
WHERE room_id = $1;

-- Example usage:
-- INSERT INTO room_participants (room_id, user_id, username)
-- SELECT id, 'user_987654321', 'Viewer' FROM rooms WHERE room_id = 'abc123';

-- ===========================================
-- 6. When user leaves stream
-- ===========================================

-- Mark participant as inactive
UPDATE room_participants 
SET 
  is_active = false,
  left_at = NOW()
WHERE room_id = (SELECT id FROM rooms WHERE room_id = $1) 
  AND user_id = $2;

-- Update viewer count
UPDATE rooms 
SET 
  current_viewers = (
    SELECT COUNT(*) 
    FROM room_participants 
    WHERE room_id = rooms.id AND is_active = true
  ),
  updated_at = NOW()
WHERE room_id = $1;

-- ===========================================
-- 7. Additional useful queries
-- ===========================================

-- Get room details with participant list
SELECT 
  r.*,
  json_agg(
    json_build_object(
      'user_id', rp.user_id,
      'username', rp.username,
      'role', rp.role,
      'joined_at', rp.joined_at
    )
  ) as participants
FROM rooms r
LEFT JOIN room_participants rp ON r.id = rp.room_id AND rp.is_active = true
WHERE r.room_id = $1
GROUP BY r.id;

-- Get recent messages for a room
SELECT 
  sm.*,
  r.room_id
FROM stream_messages sm
JOIN rooms r ON sm.room_id = r.id
WHERE r.room_id = $1
ORDER BY sm.created_at DESC
LIMIT 50;

-- Get stream statistics
SELECT 
  COUNT(*) as total_streams,
  COUNT(CASE WHEN status = 'live' THEN 1 END) as active_streams,
  COUNT(CASE WHEN status = 'ended' THEN 1 END) as ended_streams,
  AVG(stream_duration) as avg_duration,
  MAX(total_viewers) as max_viewers
FROM rooms;

-- Clean up old ended streams (older than 30 days)
DELETE FROM rooms 
WHERE status = 'ended' 
  AND stream_ended_at < NOW() - INTERVAL '30 days';
