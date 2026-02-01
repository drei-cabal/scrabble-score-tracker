# Quick Setup Guide

## Prerequisites Checklist

- [ ] Node.js installed (v18+)
- [ ] Supabase account created
- [ ] Code editor (VS Code recommended)

## 5-Minute Setup

### 1. Install Node.js (if needed)

**Windows:**
1. Download from https://nodejs.org/
2. Run installer (choose LTS version)
3. Restart terminal
4. Verify: `node --version`

### 2. Install Dependencies

```bash
cd "c:\Users\ANDREI\Documents\Web Development\Scrabble Game"
npm install
```

### 3. Set Up Supabase

**Create Project:**
1. Go to https://supabase.com/
2. Click "New Project"
3. Name: "scrabble-tracker" (or your choice)
4. Choose a strong password
5. Select region closest to you
6. Click "Create new project"
7. Wait ~2 minutes for setup

**Get Credentials:**
1. In Supabase dashboard → Settings → API
2. Copy these values:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **anon public key** (long string starting with "eyJ...")

### 4. Configure Environment

1. Open `.env.local` in your code editor
2. Replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Save the file

### 5. Create Database

**Run Schema:**
1. In Supabase dashboard → SQL Editor
2. Click "New query"
3. Open `database/schema.sql` from your project
4. Copy ALL the SQL code
5. Paste into Supabase SQL Editor
6. Click "Run" (bottom right)
7. You should see "Success. No rows returned"

**Enable Realtime:**
1. In Supabase → Database → Replication
2. Find these tables and toggle them ON:
   - ✅ rooms
   - ✅ players
   - ✅ moves

### 6. Start Development Server

```bash
npm run dev
```

You should see:
```
- Local:        http://localhost:3000
- Ready in 2.3s
```

### 7. Test It!

1. Open http://localhost:3000 in your browser
2. Click "Create" tab
3. Enter your name
4. Click "Create Room"
5. You should see the game dashboard!

**Test Multi-Player:**
1. Copy the room code
2. Open a new incognito/private window
3. Go to http://localhost:3000
4. Click "Join" tab
5. Enter room code and a different name
6. Click "Join Game"
7. Both windows should show both players!

## Troubleshooting

### "node is not recognized"
- Node.js not installed or not in PATH
- Restart terminal after installing Node.js
- Try: `where node` to check if installed

### "Failed to create room"
- Check `.env.local` has correct Supabase credentials
- Verify database schema was run successfully
- Check Supabase dashboard for errors

### "Real-time not working"
- Ensure Realtime is enabled for all 3 tables
- Check browser console for WebSocket errors
- Verify RLS policies were created

### Port 3000 already in use
```bash
# Use a different port
npm run dev -- -p 3001
```

## Next Steps

Once everything works:

1. **Deploy to Production**
   - Push code to GitHub
   - Deploy to Vercel (free)
   - Connect your Supabase project

2. **Invite Friends**
   - Share your deployed URL
   - Create a room
   - Play together!

3. **Customize**
   - Change colors in `tailwind.config.js`
   - Add your own logo
   - Modify game rules

## Support

- 📖 Full documentation: See `README.md`
- 🎓 Detailed walkthrough: See `walkthrough.md`
- 🐛 Issues: Check browser console for errors
- 💬 Supabase docs: https://supabase.com/docs

---

**Estimated Setup Time:** 10-15 minutes  
**Difficulty:** Beginner-friendly  
**Cost:** $0 (free tier for everything)
