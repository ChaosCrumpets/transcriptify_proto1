'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  try {
    const body = await request.json();
    const { reportId, title, synopsis, key_takeaways, cleaned_transcript, original_transcript } = body;

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('transcription_reports')
      .update({
        title,
        synopsis,
        key_takeaways,
        cleaned_transcript,
        original_transcript,
        status: 'COMPLETED',
      })
      .eq('id', reportId);

    if (error) {
      console.error('Error updating report from webhook:', error);
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Report updated successfully' });
  } catch (error: any) {
    console.error('[API/Webhook] Failed to process update:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}