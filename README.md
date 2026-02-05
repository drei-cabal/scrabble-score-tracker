# Scrabble Score Tracker

A real-time Scrabble score tracking application built with Next.js, Tailwind CSS, and Supabase. Features live leaderboards, turn management, and crash-resilient session recovery.

## Features

- ✨ **Real-time Synchronization**: All players see updates instantly via Supabase Realtime
- 🎮 **Dual Game Modes**: Multi-device (remote play) and Single-device (pass-and-play)
- ⏱️ **Turn Timer**: Optional countdown with auto-skip functionality
- ⏸️ **Pause/Resume**: Host can pause the game at any time
- 👥 **Player & Spectator Modes**: Supports up to 4 players + unlimited spectators
- 💾 **Crash Recovery**: Sessions persist in localStorage - reload and continue playing
- 📴 **Offline Support**: Queue moves when offline, auto-sync when reconnected
- 🏆 **Live Leaderboard**: Auto-sorting scoreboard with rank indicators
- 📊 **Move History**: Track all words, skips, and tile swaps
- ↩️ **Undo Functionality**: Host can undo the last move
- 📱 **Mobile Optimized**: Responsive design for all screen sizes
- 🎨 **Premium UI**: Modern dark theme with smooth animations

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with custom design tokens
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL + Realtime)
- **State Management**: React hooks + Supabase subscriptions

## Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **npm** or **yarn** package manager
3. **Supabase Account** - [Sign up free](https://supabase.com/)

## Setup Instructions

### 1. Install Node.js

If you don't have Node.js installed:
- Download from [nodejs.org](https://nodejs.org/)
- Install the LTS version
- Verify installation: `node --version` and `npm --version`

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com/) and create a new project
2. Wait for the project to finish setting up
3. Go to **Project Settings** > **API**
4. Copy your:
   - `Project URL` (NEXT_PUBLIC_SUPABASE_URL)
   - `anon public` key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

### 4. Configure Environment Variables

1. Open `.env.local` in the project root
2. Replace the placeholder values with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `database/schema.sql` from this project
3. Copy the entire SQL content
4. Paste it into the Supabase SQL Editor
5. Click **Run** to create all tables, indexes, and policies

### 6. Enable Realtime

1. In Supabase dashboard, go to **Database** > **Replication**
2. Enable Realtime for these tables:
   - ✅ `rooms`
   - ✅ `players`
   - ✅ `moves`

### 7. Run Pause Feature Migration (IMPORTANT)

1. In Supabase dashboard, go to **SQL Editor**
2. Open the file `database/migration_add_pause.sql` from this project
3. Copy the SQL content
4. Paste it into the Supabase SQL Editor
5. Click **Run** to add the pause feature

**SQL to run:**
```sql
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_rooms_is_paused ON rooms(is_paused);
```

### 8. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

### Creating a Game

1. Click **Create** tab on the home page
2. Enter your name
3. Click **Create Room**
4. Share the 4-character room code with other players

### Joining a Game

1. Click **Join** tab on the home page
2. Enter the room code
3. Enter your name
4. Click **Join Game**
   - First 4 players join as **players**
   - Additional players join as **spectators** (read-only)

### Playing

- **Your Turn**: The "Current Turn" card shows whose turn it is
- **Submit Word**: Enter word and points, click Submit
- **Skip Turn**: Skip without scoring
- **Swap Tiles**: Exchange tiles without scoring
- **Leaderboard**: Updates in real-time as scores change
- **Recent Words**: See all moves as they happen

### Session Recovery

If your browser crashes or you accidentally close the tab:
1. Navigate back to the game URL
2. Your session will automatically restore
3. Continue playing from where you left off

## Project Structure

```
scrabble-game/
├── app/
│   ├── api/
│   │   ├── rooms/
│   │   │   ├── create/route.ts    # Create room API
│   │   │   └── join/route.ts      # Join room API
│   │   └── moves/
│   │       ├── submit/route.ts    # Submit word API
│   │       ├── skip/route.ts      # Skip turn API
│   │       └── swap/route.ts      # Swap tiles API
│   ├── game/[roomCode]/
│   │   └── page.tsx               # Game dashboard
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Landing page
│   └── globals.css                # Global styles
├── components/
│   ├── LiveLeaderboard.tsx        # Leaderboard component
│   ├── RecentWords.tsx            # Move history feed
│   ├── CurrentTurn.tsx            # Turn indicator
│   ├── SubmitWordForm.tsx         # Word submission form
│   └── PlayerStats.tsx            # Player statistics
├── lib/
│   └── supabase.ts                # Supabase client & types
├── database/
│   └── schema.sql                 # Database schema
└── package.json
```

## Database Schema

### Tables

**rooms**
- `id` (UUID): Primary key
- `room_code` (VARCHAR): Unique 4-character code
- `status` (VARCHAR): waiting | playing | finished
- `current_turn_index` (INTEGER): Index of current player's turn

**players**
- `id` (UUID): Primary key
- `room_code` (VARCHAR): Foreign key to rooms
- `name` (VARCHAR): Player name
- `total_score` (INTEGER): Current score
- `seat_order` (INTEGER): Turn order (0-3 for players, null for spectators)
- `role` (VARCHAR): player | spectator

**moves**
- `id` (UUID): Primary key
- `room_code` (VARCHAR): Foreign key to rooms
- `player_id` (UUID): Foreign key to players
- `word_played` (VARCHAR): The word (null for skip/swap)
- `points_scored` (INTEGER): Points earned
- `move_type` (VARCHAR): word | skip | swap

## Architecture Principles

### Database as Source of Truth

- All game state lives in the database
- Frontend is a real-time reflection of DB state
- Crash resilience: reload = fetch latest state
- No complex client-side state management

### Real-time Updates

- Supabase Realtime subscriptions on all tables
- Changes propagate to all connected clients instantly
- Automatic leaderboard re-sorting
- Live move history updates

### Turn Management

- `current_turn_index` in rooms table
- Matches player's `seat_order`
- Automatic rotation: `(index + 1) % player_count`
- Server-side validation prevents out-of-turn moves

## Troubleshooting

### "Room not found" error
- Verify the room code is correct (4 characters)
- Check if the room was created successfully in Supabase

### Real-time updates not working
- Ensure Realtime is enabled for all tables in Supabase
- Check browser console for connection errors
- Verify RLS policies are set correctly

### "Failed to create room" error
- Check your Supabase credentials in `.env.local`
- Verify the database schema was created successfully
- Check Supabase logs for errors

### Node.js not found
- Install Node.js from [nodejs.org](https://nodejs.org/)
- Restart your terminal after installation
- Verify with `node --version`

## Future Enhancements

- [ ] Real player statistics tracking
- [ ] Game history and replays
- [ ] Timer for turns
- [ ] Dictionary validation for words
- [ ] Mobile app version
- [ ] Tournament mode
- [ ] Player authentication

## License

MIT License - feel free to use this project for learning or production!

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the Supabase documentation
3. Check the browser console for errors
4. Verify all setup steps were completed

---

Built with ❤️ using Next.js and Supabase
