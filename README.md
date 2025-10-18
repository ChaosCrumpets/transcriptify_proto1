# Transcriptify (local dev)

Quick notes to get this project running locally and perform a smoke test.

Prerequisites
- Node.js (recommended 18+)
- npm

Setup

```powershell
npm install
# Copy example env and fill in your Supabase project values
copy .env.local.example .env.local
# Start the Next dev server
npm run dev
```

Local worker (development-only)

The repo includes a minimal local worker at `scripts/worker.ts` that polls for PENDING jobs
and writes mock results. This is intended for local development only — replace with a
durable queue/worker for production.

Run the worker (install ts-node if you don't have it):

```powershell
npm i -D ts-node typescript @types/node
npx ts-node scripts/worker.ts
```

Smoke test

1. Start Next dev server (`npm run dev`).
2. Start the local worker (`npx ts-node scripts/worker.ts`).
3. Open the app in your browser (http://localhost:3000) and paste a video URL on the home page.
4. The app will create a `PENDING` row in Supabase. The worker will pick it up and eventually the UI will show the `COMPLETED` report.

Notes and safety
- `lib/supabase.ts` now requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` and will throw if they are missing. Do NOT commit real keys.
- The migration attempts to create the `uuid-ossp` extension; some hosted Postgres providers disallow extension creation — if your migration fails, create the extension manually or switch to `pgcrypto`'s `gen_random_uuid()`.
