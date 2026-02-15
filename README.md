# Skulking

A private, mobile-first realtime scoreboard for Skull King card game nights.

Built for phones. Designed like Apple made it. No accounts, no sign-ups — just open the link and play.

## How It Works

1. **Lobby** — Players join by entering their name. Admins start the game.
2. **Bidding** — Each player privately submits their bid for the round.
3. **Reveal** — All bids are shown. Play your hands in real life.
4. **Scoring** — Each player enters tricks won and any bonuses.
5. **Leaderboard** — Round scores displayed. Admin advances to next round.
6. **Final Standings** — After 10 rounds, the winner is crowned.

Everything syncs in realtime via Supabase. Game state auto-resets after 24 hours.

## Tech Stack

- **Frontend** — React + TypeScript + Vite
- **Backend** — Supabase (Postgres + Realtime)
- **Styling** — Vanilla CSS with iOS 26 Liquid Glass design system
- **Hosting** — GitHub Pages

## Development

```bash
npm install
npm run dev
```

## Environment Variables

Create a `.env.local` file:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Database Setup

Run `supabase/schema.sql` in your Supabase project's SQL Editor. This creates all tables, disables RLS, enables realtime, and installs the game logic as RPC functions.

## Deployment

Pushes to `main` auto-deploy to GitHub Pages via the included workflow.

Live at: [roscoeevans.github.io/Skulking](https://roscoeevans.github.io/Skulking/)

## License

MIT
