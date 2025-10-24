import { createBrowserClient } from '@supabase/ssr'

// Define a function to create a Supabase client for Client Components
export const createSupabaseBrowserClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Define a TypeScript type for our report for type safety
export type TranscriptionReport = {
  id: string;
  created_at: string;
  title: string | null;
  source_url: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  synopsis: string | null;
  key_takeaways: string[] | null;
  cleaned_transcript: string | null;
  original_transcript: string | null;
  error_message: string | null;
};
