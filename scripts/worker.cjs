/*
  Simple local worker (CommonJS) that polls Supabase REST for PENDING jobs
  and writes mock results. Runs with Node.js (18+ which provides global fetch).

  Run: node scripts/worker.cjs
*/
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment');
  process.exit(1);
}

const headers = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
};

async function fetchPending() {
  const url = `${supabaseUrl}/rest/v1/transcription_reports?status=eq.PENDING&select=id`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Failed to fetch pending: ${res.status} ${res.statusText}`);
  return res.json();
}

async function updateReport(id, body) {
  const url = `${supabaseUrl}/rest/v1/transcription_reports?id=eq.${id}`;
  const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Failed to update report ${id}: ${res.status} ${res.statusText}`);
  // PATCH can return 204 No Content, which has no body to parse
  if (res.status === 204) {
    return;
  }
  return res.json();
}

async function processId(id) {
  console.log('[worker] Processing', id);
  await updateReport(id, { status: 'PROCESSING' });
  await new Promise((r) => setTimeout(r, 3000));
  await updateReport(id, {
    status: 'COMPLETED',
    synopsis: 'Worker-cjs: mock synopsis',
    key_takeaways: ['Mock 1', 'Mock 2'],
    cleaned_transcript: 'Mock cleaned transcript',
    original_transcript: 'mock original',
  });
  console.log('[worker] Completed', id);
}

async function main() {
  console.log('[worker] Starting (poll every 5s)');
  while (true) {
    try {
      const pending = await fetchPending();
      for (const row of pending) {
        try {
          await processId(row.id);
        } catch (err) {
          console.error('[worker] err processing', row.id, err);
          await updateReport(row.id, { status: 'FAILED', error_message: String(err) });
        }
      }
    } catch (err) {
      console.error('[worker] polling error', err);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
}

main();
