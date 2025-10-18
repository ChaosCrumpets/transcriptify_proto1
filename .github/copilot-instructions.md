## Quick orientation — what this app is

Transcriptify is a Next.js (App Router) TypeScript project that accepts a social-media video URL, creates a DB job row, and runs a background AI-style processing pipeline that produces a transcription + analysis report.

## Big picture / architecture

- Frontend: Next.js App Router in `app/`. Main pages:
  - `app/page.tsx` — home page (client component) that calls the server action to create a report.
  - `app/report/[id]/page.tsx` — client component that polls `/api/report/[id]` for status and renders the report when complete.
- Server/API:
  - Server Actions enabled via `next.config.js` (`serverActions: true`). Server action example: `app/api/actions/generateTranscriptionReport.ts` (exports `generateTranscriptionReport` with `use server`).
  - HTTP API: `app/api/report/[id]/route.ts` which proxies to the query helper `app/api/queries/getTranscriptionReport.ts`.
- Data: Supabase-backed table `transcription_reports`. DB client is `lib/supabase.ts` (exports `db` and `TranscriptionReport` type).
- Background work: `generateTranscriptionReport` inserts a PENDING row and starts `processJob(...)` asynchronously (not awaited) to simulate/perform long-running processing and finally updates the row to COMPLETED/FAILED.

## Important patterns and conventions (do exactly like this)

- Server Actions: server functions use a top-line `'use server'` and are imported by client components and invoked directly (enabled by `serverActions: true` in `next.config.js`). Example: Home page imports `generateTranscriptionReport` from `app/api/actions/generateTranscriptionReport` and awaits it from a client event handler.
- DB access: always use the central `db` client from `lib/supabase.ts` (do not create ad-hoc clients). Example queries live under `app/api/queries/`.
- Background processing: the current pattern is to insert a DB row then call an async `processJob(reportId, sourceUrl)` without awaiting it. Keep that pattern for long-running jobs so the API can return immediately.
- Polling: the report page polls the HTTP endpoint `/api/report/[id]` every 5s. Keep response shapes compatible with the `TranscriptionReport` type defined in `lib/supabase.ts`.
- Path alias: `@/*` maps to project root (see `tsconfig.json`). Use `@/lib`, `@/app`, `@/components` imports.

## DB schema (concrete, copy-paste fields)

- Table: `transcription_reports` (migration at `supabase/migrations/20250101_init_transcription_report.sql`)
  - id (uuid), created_at (timestamptz)
  - source_url (text), status (text; default 'PENDING')
  - synopsis (text), key_takeaways (jsonb), cleaned_transcript (text), original_transcript (text), error_message (text)

When updating or reading fields, use these exact column names (the code expects them, e.g. `key_takeaways` is json/array).

## Environment and runtime notes (developer workflows)

- Install & run locally:

```powershell
npm install
npm run dev
```

- package.json provides standard scripts: `dev`, `build`, `start`, `lint`.
- The Supabase client in `lib/supabase.ts` reads environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (placeholders exist in the file). Add these to `.env.local` for local dev. The project intentionally uses the anon key pattern (readonly) for simple examples.
- ESLint is configured but ignored during builds (`next.config.js: eslint.ignoreDuringBuilds = true`).

## Where to look first when changing behavior

- To change the job lifecycle: `app/api/actions/generateTranscriptionReport.ts` (create job) and the in-file `processJob` function (processing + DB updates).
- To change how the report is displayed or polled: `app/report/[id]/page.tsx` (client UI) and `app/api/report/[id]/route.ts` (HTTP API).
- To add DB columns or change types, update `supabase/migrations/20250101_init_transcription_report.sql` and adjust `lib/supabase.ts`'s `TranscriptionReport` type.

## Examples the assistant can use when editing code

- Create a new server action that inserts a DB row:
  - Follow `generateTranscriptionReport` pattern: insert then start background work without awaiting.
- Add a query helper under `app/api/queries/` and call it from `app/api/report/[id]/route.ts`.
- Use `db.from('transcription_reports').select('*').eq('id', id).single()` for single-row reads (consistent with `getTranscriptionReport`).

## Safety and discoverable constraints

- The project expects public read access to `transcription_reports` (migration enables RLS and a public SELECT policy). Avoid changing RLS without updating the migration and dev setup.
- No test suite present in repository — be conservative when modifying core flows; manual smoke testing (run `npm run dev`, create a report) is the primary validation.

## Files to read for context (priority order)

1. `app/api/actions/generateTranscriptionReport.ts`
2. `lib/supabase.ts`
3. `supabase/migrations/20250101_init_transcription_report.sql`
4. `app/report/[id]/page.tsx`
5. `app/api/report/[id]/route.ts`

If anything in this file is unclear or you want the assistant to expand on implementation examples (server action templates, DB helper snippets, or how to wire env vars), tell me which section to expand.
