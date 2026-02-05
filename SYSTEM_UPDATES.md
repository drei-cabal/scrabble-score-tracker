# System Updates Summary

**Date**: February 5, 2026
**Status**: ✅ Complete

## 1. Reconnect Feature (Single & Multi-Device)

### What Changed
- Added a **"Rejoin Game"** button to the main dashboard.
- Button appears automatically if you have an active session saved in your browser.
- Displays the **Room Code** and **Game Mode** (Single/Multi-device).
- One-click reconnection to your ongoing game.

### How It Works
1.  When you create or join a room, session details are saved to `localStorage`.
2.  If you accidentally close the tab, lose connection, or refresh:
    *   Open the app again.
    *   You'll see a large "Rejoin Game" button at the top.
    *   Click it to immediately return to the room.

## 2. Room Code Update (5 Characters)

### What Changed
- Increased Room Code length from **4** to **5** characters (e.g., `ABCDE` instead of `ABCD`).
- Increased database column size to support this change.

### Why?
- **Uniqueness**: Drastically reduces the chance of duplicate room codes.
- **Future Proofing**: Supports significantly more concurrent game rooms.

### ⚠️ ONE-TIME ACTION REQUIRED (Database Migration)
To apply the database changes, you must run the following SQL in your Supabase SQL Editor:

```sql
-- Migration to update room_code length
ALTER TABLE rooms ALTER COLUMN room_code TYPE VARCHAR(10);
ALTER TABLE players ALTER COLUMN room_code TYPE VARCHAR(10);
ALTER TABLE moves ALTER COLUMN room_code TYPE VARCHAR(10);
```

You can find this file at: `database/migration_update_room_code_length.sql`
