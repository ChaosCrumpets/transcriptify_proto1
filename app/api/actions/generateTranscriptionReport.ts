'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

/**
 * [UI/UX MOCK] Creates a completed mock report record in the database.
 * This function is for UI testing and immediately generates a report with mock data.
 */
export const generateTranscriptionReport = async (sourceUrl: string): Promise<{id?: string, error?: string}> => {
  if (!sourceUrl || !sourceUrl.startsWith('http')) {
    return { error: 'Please provide a valid URL.' };
  }

  const supabase = createSupabaseServerClient();
  const reportId = uuidv4();

  // 1. Create a completed mock record in the DB.
  const { data, error } = await supabase
    .from('transcription_reports')
    .insert({
      id: reportId,
      source_url: sourceUrl,
      status: 'COMPLETED',
      title: 'Mock Report: A Look at AI Advancements',
      synopsis: 'This is a mock synopsis for the generated report. It summarizes the key findings from the analysis of the provided social media video.',
      key_takeaways: [
        'AI is advancing rapidly.',
        'New models are more powerful.',
        'Ethical considerations are crucial.',
      ],
      cleaned_transcript: 'This is the cleaned transcript of the video, with filler words and pauses removed.',
      original_transcript: 'This is the... uh... original transcript, like, with all the filler words and stuff.',
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Database insertion error:', error);
    return { error: error?.message || 'Failed to create report in database.' };
  }

  // Invalidate the cache for the homepage to ensure the new job appears in the history.
  revalidatePath('/');

  // Return the ID of the newly created report to the frontend.
  return { id: data.id };
};