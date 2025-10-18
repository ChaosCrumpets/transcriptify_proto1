import { db } from '@/lib/supabase';

/**
 * Fetches a single transcription report from the database by its ID.
 * This is used by the report page to poll for updates and display results.
 *
 * @param id The UUID of the report to retrieve.
 * @returns The report data or null if not found.
 */
export const getTranscriptionReport = async (id: string) => {
  if (!id) {
    return null;
  }

  const { data, error } = await db
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
