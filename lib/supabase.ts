import { createClient } from '@supabase/supabase-js';

// Read required environment variables. Do NOT provide runtime defaults here —
// fail fast so developers set up `.env.local` explicitly.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required. Add them to .env.local (see .env.local.example).'
  );
}

export const db = createClient(supabaseUrl, supabaseAnonKey);

// Define a TypeScript type for our report for type safety
export type TranscriptionReport = {
  id: string;
  created_at: string;
  source_url: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  synopsis: string | null;
  key_takeaways: string[] | null;
  cleaned_transcript: string | null;
  original_transcript: string | null;
  error_message: string | null;
};
