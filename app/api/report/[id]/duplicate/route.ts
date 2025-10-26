import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    // 1. Fetch the original report
    const { data: original, error: fetchError } = await supabase
      .from('transcription_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError || !original) {
      console.error('[API] Error fetching original report for duplication:', fetchError);
      return NextResponse.json({ error: 'Original report not found' }, { status: 404 });
    }

    // 2. Create a new report object
    const { id: _, created_at: __, ...newReportData } = original;
    newReportData.title = `${original.title} (Copy)`;
    newReportData.status = 'COMPLETED';

    // 3. Insert the new record
    const { error: insertError } = await supabase
      .from('transcription_reports')
      .insert(newReportData);

    if (insertError) {
      console.error('[API] Error duplicating report:', insertError);
      return NextResponse.json({ error: 'Failed to duplicate report' }, { status: 500 });
    }

    revalidatePath('/');
    return NextResponse.json({ message: 'Report duplicated successfully' });

  } catch (error) {
    console.error(`[API] Failed to duplicate report:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
