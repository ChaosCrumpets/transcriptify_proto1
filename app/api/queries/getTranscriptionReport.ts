import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Fetches a single transcription report from the database by its ID.
 * This is used by the report page to poll for updates and display results.
 *
 * @param supabase The Supabase client instance.
 * @param id The UUID of the report to retrieve.
 * @returns The report data or null if not found.
 */
export const getTranscriptionReport = async (supabase: SupabaseClient, id: string) => {
  if (!id) {
    return null;
  }

  const { data, error } = await supabase
    .from('transcription_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching report ${id}:`, error);
    return null;
  }

  return data;
};