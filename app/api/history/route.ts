import { NextResponse } from 'next/server';
import { getAllTranscriptionReports } from '../queries/getTranscriptionReport';

export const dynamic = 'force-dynamic'; // Ensures this route is never cached

/**
 * API endpoint to fetch the list of all transcription jobs for the history panel.
 */
export async function GET() {
  try {
    const reports = await getAllTranscriptionReports();
    return NextResponse.json(reports);
  } catch (error) {
    console.error('[API/HISTORY] Failed to fetch reports:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}