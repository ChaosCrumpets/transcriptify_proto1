'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a job record in the database and triggers the external Make.com workflow.
 * This function serves as the primary entry point for starting a new transcription job.
 */
export const generateTranscriptionReport = async (sourceUrl: string): Promise<{id?: string, error?: string}> => {
  if (!sourceUrl || !sourceUrl.startsWith('http')) {
    return { error: 'Please provide a valid URL.' };
  }

  const supabase = createSupabaseServerClient();
  const reportId = uuidv4();

  // 1. Create an initial record in the DB to track the job.
  // The 'title' will be updated later by the workflow.
  const { data, error } = await supabase
    .from('transcription_reports')
    .insert({
      id: reportId,
      source_url: sourceUrl,
      status: 'PENDING',
      title: 'Generating Title...' // A placeholder title while processing
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Database insertion error:', error);
    return { error: error?.message || 'Failed to create report in database.' };
  }

  // --- [NON-DESTRUCTIVE WORKFLOW PLACEHOLDER] ---
  // The following block is where you will integrate your backend workflow (e.g., Make.com).
  // The goal is to send the `reportId` and `sourceUrl` to your automation platform.
  const makeComWebhookUrl = process.env.MAKE_COM_WEBHOOK_URL;
  if (makeComWebhookUrl) {
    try {
      // Intentionally not awaiting - fire and forget
      fetch(makeComWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: data.id,
          sourceUrl,
        }),
      });
    } catch (e) {
      console.error('Failed to trigger Make.com webhook:', e);
      // Optional: Update the report status to 'FAILED' here if the trigger fails.
    }
  } else {
    console.warn('MAKE_COM_WEBHOOK_URL is not set. Skipping workflow trigger.');
  }
  // --- [END OF WORKFLOW PLACEHOLDER] ---


  // Invalidate the cache for the homepage to ensure the new job appears in the history.
  revalidatePath('/');

  // Return the ID of the newly created report to the frontend.
  return { id: data.id };
};