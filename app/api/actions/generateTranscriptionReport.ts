'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { type SupabaseClient } from '@supabase/supabase-js';

// This is a placeholder for the actual multi-step AI processing.
// In a real-world scenario, this function would contain the logic
// for downloading, transcribing, and analyzing the video.
// To simulate the long-running nature of the task, we use timeouts.
async function processJob(supabase: SupabaseClient, reportId: string, sourceUrl: string) {
  try {
    // 1. Mark the job as processing
    await supabase
      .from('transcription_reports')
      .update({ status: 'PROCESSING' })
      .eq('id', reportId);

    // Simulate a delay for processing (e.g., 10-15 seconds)
    await new Promise(resolve => setTimeout(resolve, 12000));

    // This is where you would integrate with external APIs like OpenAI Whisper and Gemini.
    // For this MVP, we'll use mock data.
    const mockAnalysis = {
      synopsis: "This video discusses the future of renewable energy, focusing on advancements in solar panel efficiency and battery storage. The speaker highlights three key areas of innovation that could lead to a significant reduction in carbon emissions over the next decade.",
      keyTakeaways: [
        "Solar panel efficiency has doubled in the last five years due to new perovskite materials.",
        "Grid-scale battery storage is becoming economically viable, solving the intermittency problem of renewables.",
        "Decentralized power grids (microgrids) are increasing energy resilience for communities.",
        "Government policies and subsidies are crucial for accelerating the adoption of green technology."
      ],
      cleanedTranscript: `The future of energy is at a critical turning point. For decades, we've relied on fossil fuels, but the climate crisis demands a rapid transition to cleaner sources. The good news is that we're witnessing an unprecedented wave of innovation in the renewable energy sector.\n\nOne of the most exciting developments is in solar technology. The efficiency of photovoltaic cells has skyrocketed. We're not just talking about incremental improvements anymore. New materials, particularly perovskites, are allowing us to capture more energy from the sun than ever before. This means more power from a smaller footprint, making solar viable for a wider range of applications.\n\nBut generating power is only half the battle. Storing it is the other. The biggest criticism of solar and wind has always been their intermittency—the sun doesn't always shine, and the wind doesn't always blow. That's where battery technology comes in. We're now able to build massive, grid-scale batteries that can store excess energy and release it when needed, ensuring a stable and reliable power supply. This is a game-changer.\n\nFinally, we're seeing a shift in how we think about the grid itself. The old model of large, centralized power plants is giving way to a more distributed network of microgrids. These smaller, localized grids can operate independently, which dramatically increases resilience against outages caused by extreme weather or other disruptions. It's about making our energy system not just cleaner, but smarter and more robust.`,
      originalTranscript: `uh, you know, the future of energy is, like, at a critical turning point. For, like, decades, we've relied on fossil fuels, but the climate crisis, you know, demands a rapid transition to cleaner sources. The good news is that we're, um, witnessing an unprecedented wave of innovation in the renewable energy sector. you know. ...`,
    };

    // 2. Update the final record in the database with the completed results
    await supabase
      .from('transcription_reports')
      .update({
        status: 'COMPLETED',
        synopsis: mockAnalysis.synopsis,
        key_takeaways: mockAnalysis.keyTakeaways,
        cleaned_transcript: mockAnalysis.cleanedTranscript,
        original_transcript: mockAnalysis.originalTranscript,
      })
      .eq('id', reportId);

  } catch (error: any) {
    // 3. If any step fails, update the record with an error status
    await supabase
      .from('transcription_reports')
      .update({
        status: 'FAILED',
        error_message: error.message,
      })
      .eq('id', reportId);
  }
}

/**
 * Creates a job record and kicks off the background processing task.
 */
export const generateTranscriptionReport = async (sourceUrl: string): Promise<string> => {
  const supabase = createSupabaseServerClient();

  if (!sourceUrl || !sourceUrl.startsWith('http')) {
    throw new Error('Please provide a valid URL.');
  }

  // 1. Create an initial record in the DB to track the job.
  const { data, error } = await supabase
    .from('transcription_reports')
    .insert({
      source_url: sourceUrl,
      title: 'Untitled Transcription', // Add default title
      status: 'PENDING',
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Failed to create report record:', error);
    throw new Error(error?.message || 'Failed to create report in database.');
  }

  const reportId = data.id;

  // 2. Trigger the Make.com workflow.
  // This is a placeholder for the actual webhook call.
  // In a real-world scenario, you would use the MAKE_COM_WEBHOOK_URL from your environment variables.
  const webhookUrl = process.env.MAKE_COM_WEBHOOK_URL;
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportId,
        sourceUrl,
      }),
    }).catch(err => {
      console.error(`[Job ${reportId}] Failed to trigger Make.com webhook:`, err);
    });
  } else {
    // If the webhook URL is not configured, fall back to the mock processing.
    // We don't await this, so the function returns immediately.
    processJob(supabase, reportId, sourceUrl).catch(err => {
      console.error(`[Job ${reportId}] Unhandled processing failure:`, err);
    });
  }

  // 3. Immediately return the new report's ID to the frontend.
  return reportId;
};