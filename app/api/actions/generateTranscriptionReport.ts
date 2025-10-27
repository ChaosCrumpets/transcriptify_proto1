'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { type SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

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

// Define the shape of the state object that the action will return
interface ActionState {
  reportId: string | null;
  error: string | null;
}

export async function generateTranscriptionReport(
  prevState: ActionState, // The previous state passed by useFormState
  formData: FormData      // The data from the form
): Promise<ActionState> {
  const url = formData.get('url') as string;

  if (!url || !url.startsWith('http')) {
    return { reportId: null, error: "Please enter a valid URL." };
  }

  try {
    const supabase = createSupabaseServerClient();
    const reportId = uuidv4();

    const { data, error } = await supabase
      .from('transcription_reports')
      .insert([
        {
          id: reportId,
          source_url: url,
          status: 'PENDING',
        },
      ])
      .select('id')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(error.message);
    }

    // On success, return the new reportId
    return { reportId: data.id, error: null };

  } catch (error: any) {
    console.error('Transcription report generation failed:', error);
    // On failure, return the error message
    return { reportId: null, error: error.message || "An unknown error occurred." };
  }
}
