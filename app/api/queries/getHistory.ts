import { SupabaseClient } from '@supabase/supabase-js';

export async function getHistory(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('transcription_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching history:', error);
    throw new Error('Failed to fetch history');
  }

  return data;
}