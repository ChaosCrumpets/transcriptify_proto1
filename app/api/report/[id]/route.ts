import { NextResponse } from 'next/server';
import { getTranscriptionReport } from '../../queries/getTranscriptionReport';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const report = await getTranscriptionReport(supabase, reportId);

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error(`[API] Failed to fetch report:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from('transcription_reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      console.error('[API] Error deleting report:', error);
      return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
    }

    revalidatePath('/');
    return NextResponse.json({ message: 'Report deleted successfully' });

  } catch (error) {
    console.error(`[API] Failed to delete report:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    const { newTitle } = await request.json();

    if (!reportId || !newTitle) {
      return NextResponse.json({ error: 'Report ID and new title are required' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from('transcription_reports')
      .update({ title: newTitle })
      .eq('id', reportId);

    if (error) {
      console.error('[API] Error renaming report:', error);
      return NextResponse.json({ error: 'Failed to rename report' }, { status: 500 });
    }

    revalidatePath('/');
    return NextResponse.json({ message: 'Report renamed successfully' });

  } catch (error) {
    console.error(`[API] Failed to rename report:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
