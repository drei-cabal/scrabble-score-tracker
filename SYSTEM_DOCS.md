# Scrabble Score Tracker - System Documentation

## 🎯 Overview
A real-time multiplayer Scrabble score tracking application built with Next.js, Supabase, and TypeScript.

## ✨ Features

### Core Functionality
- **Multi-Device Mode**: Players join from different devices
- **Single-Device Mode**: Pass-and-play on one device
- **Real-time Updates**: Live score tracking via Supabase Realtime
- **Turn Timer**: Optional countdown timer with auto-skip
- **Offline Support**: Queue moves when offline, sync when reconnected
- **Pause/Resume**: Host can pause the game at any time

### Game Management
- **Room System**: 4-character room codes for easy joining
- **Player Roles**: Players and Spectators
- **Turn Sequencing**: Automatic turn rotation based on join order
- **Move History**: Track all words, skips, and swaps
- **Undo Functionality**: Host can undo the last move

### UI/UX
- **Responsive Design**: Optimized for mobile and desktop
- **Dark Theme**: Modern, eye-friendly interface
- **Live Leaderboard**: Real-time score rankings
- **Recent Words**: Display of latest moves
- **Pass Device Overlay**: Smooth transitions in single-device mode
- **Confirmation Modals**: Prevent accidental actions

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **Styling**: Tailwind CSS
- **State Management**: React Hooks

### Database Schema

#### Tables
1. **rooms**
   - `id`: UUID (PK)
   - `room_code`: VARCHAR(4) UNIQUE
   - `status`: 'waiting' | 'playing' | 'finished'
   - `game_mode`: 'multi-device' | 'single-device'
   - `turn_timer_enabled`: BOOLEAN
   - `turn_timer_seconds`: INTEGER (10-300)
   - `turn_started_at`: TIMESTAMPTZ
   - `is_paused`: BOOLEAN
   - `current_turn_index`: INTEGER

2. **players**
   - `id`: UUID (PK)
   - `room_code`: VARCHAR(4) (FK)
   - `name`: VARCHAR(50)
   - `total_score`: INTEGER
   - `seat_order`: INTEGER
   - `role`: 'player' | 'spectator'

3. **moves**
   - `id`: UUID (PK)
   - `room_code`: VARCHAR(4) (FK)
   - `player_id`: UUID (FK)
   - `word_played`: VARCHAR(50)
   - `points_scored`: INTEGER
   - `move_type`: 'word' | 'skip' | 'swap'

### Key Components

#### Pages
- `app/page.tsx` - Landing page with room creation/joining
- `app/game/[roomCode]/page.tsx` - Main game interface

#### Components
- `LobbyView.tsx` - Pre-game waiting room
- `SubmitWordForm.tsx` - Word input and turn submission
- `LiveLeaderboard.tsx` - Real-time score display
- `RecentWords.tsx` - Move history
- `CurrentTurn.tsx` - Active player indicator with timer
- `TurnTimer.tsx` - Countdown timer logic
- `PassDeviceOverlay.tsx` - Single-device transition screen
- `ConfirmationModal.tsx` - Generic confirmation dialog
- `ErrorBoundary.tsx` - Error handling wrapper

#### API Routes
- `/api/rooms/create` - Create new game room
- `/api/rooms/join` - Join existing room
- `/api/rooms/start` - Start game
- `/api/rooms/delete` - Delete room
- `/api/rooms/pause` - Pause/resume game
- `/api/rooms/reset-timer` - Reset turn timer
- `/api/moves/submit` - Submit word
- `/api/moves/skip` - Skip turn
- `/api/moves/swap` - Swap tiles
- `/api/moves/undo` - Undo last move

#### Utilities
- `lib/supabase.ts` - Supabase client and type definitions
- `lib/offlineQueue.ts` - Offline move queue management
- `lib/tileValues.ts` - Scrabble tile point values

## 🔄 Data Flow

### Real-time Updates
1. Client subscribes to Supabase Realtime channels
2. Database changes trigger events
3. All connected clients receive updates
4. UI automatically re-renders with new data

### Offline Handling
1. Detect offline status via `navigator.onLine`
2. Queue moves in localStorage
3. Listen for `online` event
4. Sync queued moves to server
5. Reload game data

### Turn Management
1. Game starts with `current_turn_index = 0`
2. Player with `seat_order = 0` goes first
3. After move submission, increment turn index
4. Wrap around using modulo (player count)
5. Timer resets on each turn change

## 🎮 Game Modes

### Multi-Device
- Each player joins from their own device
- Real-time synchronization across all devices
- Players can only submit on their turn
- Spectators can watch live

### Single-Device
- One device passed between players
- "Pass Device" overlay between turns
- Timer starts when player clicks "Ready"
- Host controls all admin functions

## 🔐 Security

### Row Level Security (RLS)
- Public read access to all tables
- Public insert/update for rooms and players
- Public insert for moves
- Public delete for moves (undo functionality)

### Validation
- Room code uniqueness enforced
- Player name uniqueness per room
- Turn validation (correct player, correct turn)
- Host-only actions (delete, undo, pause)

## 📱 Mobile Optimization

### Responsive Design
- Breakpoints: `md:` (768px+)
- Mobile-first approach
- Touch-friendly button sizes
- Optimized modal/overlay sizing
- Adaptive text sizing

### Performance
- Efficient re-renders via React hooks
- Debounced real-time subscriptions
- Lazy loading where applicable
- Optimized bundle size

## 🚀 Deployment

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup
1. Run `database/schema.sql` in Supabase SQL Editor
2. Run `database/migration_add_pause.sql` for pause feature
3. Enable Realtime for: rooms, players, moves
4. Verify RLS policies are active

### Build & Deploy
```bash
npm install
npm run build
npm start
```

## 🐛 Known Issues & Solutions

### Issue: Pause button error
**Solution**: Run the pause migration SQL in Supabase

### Issue: Moves not updating after undo
**Solution**: Manual event listener added for reliable updates

### Issue: Timer continues during "Pass Device"
**Solution**: Timer resets when "Ready" is clicked

### Issue: Auto-skip attributed to wrong player
**Solution**: Fixed to use current turn player ID

## 🔧 Maintenance

### Adding New Features
1. Update database schema if needed
2. Create/modify API routes
3. Update TypeScript interfaces
4. Implement UI components
5. Test in both game modes
6. Update documentation

### Debugging
- Check browser console for errors
- Monitor Supabase Realtime logs
- Verify RLS policies
- Test offline/online transitions
- Validate turn sequencing

## 📊 Performance Metrics

### Target Metrics
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Real-time latency: < 500ms
- Offline queue sync: < 2s

### Optimization Strategies
- Code splitting
- Image optimization
- Database indexing
- Efficient queries
- Minimal re-renders

## 🎯 Future Enhancements

### Planned Features
- [ ] Game statistics and history
- [ ] Player profiles and avatars
- [ ] Tournament mode
- [ ] Custom tile values
- [ ] Word validation API integration
- [ ] Chat functionality
- [ ] Sound effects
- [ ] Achievements/badges

### Technical Improvements
- [ ] End-to-end testing
- [ ] Performance monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics integration
- [ ] PWA support
- [ ] Dark/Light theme toggle

## 📝 License
MIT

## 👥 Contributors
Built with ❤️ by the development team
