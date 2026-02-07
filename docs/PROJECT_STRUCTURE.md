# 📁 Project Structure

```
scrabble-game/
│
├── 📂 app/                      # Next.js App Router
│   ├── 📂 api/                  # API Routes
│   │   ├── 📂 moves/            # Move-related endpoints
│   │   │   ├── submit/          # Submit word
│   │   │   ├── skip/            # Skip turn
│   │   │   └── swap/            # Swap tiles
│   │   └── 📂 rooms/            # Room-related endpoints
│   │       ├── create/          # Create room
│   │       ├── join/            # Join room
│   │       └── delete/          # Delete room
│   ├── 📂 game/[roomCode]/      # Dynamic game page
│   │   └── page.tsx
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
│
├── 📂 components/               # React Components
│   ├── 📂 game/                 # Gameplay-specific components
│   ├── 📂 modals/               # Modal and diagnostic components
│   └── 📂 ui/                   # Global UI components
│
├── 📂 docs/                     # Project Documentation
│   ├── GameMechanics.md
│   └── ...
│
├── 📂 lib/                      # Utilities & Config
│   └── supabase.ts              # Supabase client + types
│
├── 📂 database/                 # Database Schema
│   ├── 📂 migrations/           # SQL migration files
│   └── schema.sql               # PostgreSQL base schema
│
├── 📂 public/                   # Static Assets
│   └── icon.png                 # Favicon
│
├── 📂 .dev/                     # Development Files (gitignored)
│   ├── .agent/                  # AI agent config
│   ├── agent_docs/              # Agent documentation
│   ├── directives/              # Development directives
│   ├── execution/               # Execution logs
│   ├── Antigravity Template/    # Template files
│   └── SETUP.md                 # Setup guide
│
├── 📄 .env.local                # Environment variables
├── 📄 .gitignore                # Git ignore rules
├── 📄 README.md                 # Project documentation
├── 📄 package.json              # Dependencies
├── 📄 tailwind.config.js        # Tailwind config
├── 📄 tsconfig.json             # TypeScript config
└── 📄 next.config.js            # Next.js config
```

## 🎯 Key Organization Principles

### Production Code (Tracked in Git)
- `app/` - All application pages and API routes
- `components/` - Reusable React components
- `lib/` - Shared utilities and configurations
- `database/` - Database schema and migrations
- `public/` - Static assets (images, icons)

### Development Files (Ignored in Git)
- `.dev/` - All development/agent-related files
- `.tmp/` - Temporary files
- `node_modules/` - Dependencies
- `.next/` - Next.js build output

### Configuration Files
- `.env.local` - Environment variables (Supabase keys)
- `tailwind.config.js` - Tailwind CSS customization
- `tsconfig.json` - TypeScript settings
- `next.config.js` - Next.js configuration

## 📝 File Naming Conventions

- **Components**: PascalCase (e.g., `LiveLeaderboard.tsx`)
- **API Routes**: lowercase folders with `route.ts` files
- **Pages**: `page.tsx` in folder-based routing
- **Utilities**: camelCase (e.g., `supabase.ts`)
- **Config**: kebab-case (e.g., `next.config.js`)

## 🚀 Quick Navigation

- **Add a new page**: Create folder in `app/` with `page.tsx`
- **Add API endpoint**: Create folder in `app/api/` with `route.ts`
- **Add component**: Create `.tsx` file in appropriate `components/` subfolder
- **Modify database**: Edit `database/schema.sql` or add to `database/migrations/`
- **Change styles**: Edit `app/globals.css` or Tailwind config
- **View docs**: Check `docs/` folder for feature details
