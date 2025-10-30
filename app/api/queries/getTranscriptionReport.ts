'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * Fetches a single transcription report by its ID.
 * Used to display the details of the active report.
 * @param id The UUID of the report to fetch.
 */
export const getTranscriptionReport = async (id: string) => {
  if (!id) return null;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('transcription_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    // Don't log expected 'not found' errors unless debugging
    if (error.code !== 'PGRST116') { // PGRST116 = Row Not Found
        console.error(`Error fetching report ${id}:`, error);
    }
    return null;
  }
  return data;
};

/**
 * Fetches all transcription reports, ordered by creation date.
 * Used to populate the history sidebar.
 */
export const getAllTranscriptionReports = async () => {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
        .from('transcription_reports')
        .select('id, title, status, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all reports:', error);
        return [];
    }
    return data;
};