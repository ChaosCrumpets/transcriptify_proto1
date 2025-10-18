import { NextResponse } from 'next/server';
import { getTranscriptionReport } from '../../queries/getTranscriptionReport';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const report = await getTranscriptionReport(reportId);

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error(`[API] Failed to fetch report:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
