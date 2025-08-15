# Live Streaming App Database Schema

This folder contains the database schema and SQL queries for the live streaming application.

## 📁 Files

- `01_create_tables.sql` - Main database schema with tables, indexes, and triggers
- `02_data_flow_queries.sql` - SQL queries for each step in the data flow
- `README.md` - This file

## 🗄️ Database Tables

### 1. `rooms` - Main room information
- **room_id**: Unique room identifier (e.g., "abc123")
- **host_user_id**: Zego user ID of the host
- **host_username**: Display name of the host
- **status**: Room status ('created', 'live', 'ended')
- **current_viewers**: Number of active viewers
- **total_viewers**: Total unique viewers who joined
- **stream_duration**: Duration of the stream in seconds

### 2. `room_participants` - Track who's in each room
- **room_id**: Reference to rooms table
- **user_id**: Zego user ID
- **role**: 'host' or 'viewer'
- **is_active**: Whether the user is currently in the room
- **joined_at/left_at**: Timestamps for join/leave events

### 3. `stream_messages` - Chat and bullet screen messages
- **room_id**: Reference to rooms table
- **user_id**: Zego user ID of message sender
- **message**: The actual message content
- **message_type**: 'chat', 'heart', or 'system'

## 🔄 Data Flow

### 1. Create Live Stream
```sql
INSERT INTO rooms (room_id, host_user_id, host_username)
VALUES ('abc123', 'user_123456789', 'John');
```

### 2. Start Streaming
```sql
UPDATE rooms SET status = 'live', stream_started_at = NOW() 
WHERE room_id = 'abc123';
```

### 3. End Stream
```sql
UPDATE rooms SET status = 'ended', stream_ended_at = NOW() 
WHERE room_id = 'abc123';
```

### 4. Get Live Streams (Landing Page)
```sql
SELECT room_id, title, host_username, current_viewers, total_viewers
FROM rooms WHERE status = 'live' ORDER BY stream_started_at DESC;
```

### 5. Join as Viewer
```sql
INSERT INTO room_participants (room_id, user_id, username, role)
SELECT id, 'user_987654321', 'Viewer', 'viewer'
FROM rooms WHERE room_id = 'abc123';
```

## 🚀 Setup Instructions

### For Supabase:

1. **Create a new Supabase project**
2. **Go to SQL Editor**
3. **Run only the schema file:**
   - Run `01_create_tables.sql` to create the database structure
   - **Note**: `02_data_flow_queries.sql` contains parameterized queries for application use - do NOT run this file in Supabase

### For Local Development:

1. **Install PostgreSQL**
2. **Create a new database**
3. **Run the schema file:**
   ```bash
   psql -d your_database -f schema/01_create_tables.sql
   ```

## 🔧 Features

### Automatic Triggers:
- **Updated timestamp**: Automatically updates `updated_at` on any room changes
- **Stream duration**: Calculates duration when stream ends
- **Total viewers**: Increments when new participants join

### Indexes for Performance:
- Room status queries
- User lookups
- Message history
- Participant tracking

### Data Integrity:
- Foreign key constraints
- Check constraints for status values
- Cascade deletes for related data

## 📊 Example Queries

### Get all live streams with viewer counts:
```sql
SELECT room_id, host_username, current_viewers, total_viewers
FROM rooms 
WHERE status = 'live' 
ORDER BY stream_started_at DESC;
```

### Get room participants:
```sql
SELECT username, role, joined_at
FROM room_participants 
WHERE room_id = (SELECT id FROM rooms WHERE room_id = 'abc123')
  AND is_active = true;
```

### Get recent messages:
```sql
SELECT username, message, created_at
FROM stream_messages sm
JOIN rooms r ON sm.room_id = r.id
WHERE r.room_id = 'abc123'
ORDER BY sm.created_at DESC
LIMIT 20;
```

## 🧹 Maintenance

### Clean up old data:
```sql
-- Remove ended streams older than 30 days
DELETE FROM rooms 
WHERE status = 'ended' 
  AND stream_ended_at < NOW() - INTERVAL '30 days';
```

### Get statistics:
```sql
SELECT 
  COUNT(*) as total_streams,
  COUNT(CASE WHEN status = 'live' THEN 1 END) as active_streams,
  AVG(stream_duration) as avg_duration
FROM rooms;
```
