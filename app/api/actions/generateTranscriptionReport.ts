'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { v4 as uuidv4 } from 'uuid';
// import { makeWebhookCall } from '@/lib/makeUtils'; // Assuming you have a utility for webhook calls

export async function generateTranscriptionReport(sourceUrl: string): Promise<{ reportId?: string; error?: string }> {
  const supabase = createSupabaseServerClient(); // Ensure this doesn't violate RSC rules if used elsewhere

  if (!sourceUrl || typeof sourceUrl !== 'string') {
    return { error: 'Invalid source URL provided.' };
  }

  const reportId = uuidv4();
  const title = `Report for ${new URL(sourceUrl).hostname}`; // Basic title generation

  try {
    // Insert the report with PENDING status and null batch_id
    const { data, error } = await supabase
      .from('transcription_reports')
      .insert({
        id: reportId,
        source_url: sourceUrl,
        status: 'PENDING',
        batch_id: null, // Explicitly set batch_id to null
        title: title,
        // user_id: userId, // Add user ID if you have authentication
      })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(`Failed to create report entry: ${error.message}`);
    }

    if (!data || !data.id) {
        throw new Error('Failed to retrieve report ID after insert.');
    }

    console.log(`Report created with ID: ${data.id}. Status: PENDING.`);

    // --------------------------------------------------------------------
    // PLACEHOLDER: Trigger backend processing (e.g., Make.com webhook)
    // --------------------------------------------------------------------
    // In Plan 2, you will uncomment/add the webhook call here:
    // try {
    //   await makeWebhookCall(process.env.MAKE_TRANSCRIPTION_WEBHOOK_URL, {
    //     reportId: data.id,
    //     sourceUrl: sourceUrl,
    //   });
    //   console.log(`Webhook triggered for report ${data.id}`);
    // } catch (webhookError) {
    //   console.error(`Failed to trigger webhook for report ${data.id}:`, webhookError);
    //   // Optionally update report status to FAILED here if webhook is critical
    //   return { reportId: data.id, error: 'Report created, but failed to trigger processing.' };
    // }
    // --------------------------------------------------------------------

    return { reportId: data.id };

  } catch (error: any) {
    console.error('Error in generateTranscriptionReport:', error);
    return { error: error.message || 'An unexpected error occurred while generating the report.' };
  }
}