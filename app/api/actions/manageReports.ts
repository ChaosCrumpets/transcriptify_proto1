'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

/**
 * Renames a transcription report in the database.
 * @param id The ID of the report to rename.
 * @param newTitle The new title for the report.
 */
export async function renameReport({ id, newTitle }: { id: string; newTitle: string }) {
  const supabase = createSupabaseServerClient();
  if (!id || !newTitle) {
    throw new Error('Report ID and new title are required.');
  }

  const { error } = await supabase
    .from('transcription_reports')
    .update({ title: newTitle })
    .eq('id', id);

  if (error) {
    console.error('Error renaming report:', error);
    throw new Error('Failed to rename report.');  
  }

  revalidatePath('/'); // This tells Next.js to refresh the data on the main page.
}

/**
 * Deletes a transcription report from the database.
 * @param id The ID of the report to delete.
 */
export async function deleteReport({ id }: { id: string }) {
  const supabase = createSupabaseServerClient();
  if (!id) {
    throw new Error('Report ID is required.');
  }

  const { error } = await supabase
    .from('transcription_reports')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting report:', error);
    throw new Error('Failed to delete report.');
  }

  revalidatePath('/');
}

/**
 * Duplicates a transcription report.
 * @param id The ID of the report to duplicate.
 */
export async function duplicateReport({ id }: { id: string }) {
  const supabase = createSupabaseServerClient();
  if (!id) {
    throw new Error('Report ID is required.');
  }

  // 1. Fetch the original report
  const { data: original, error: fetchError } = await supabase
    .from('transcription_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !original) {
    console.error('Error fetching original report for duplication:', fetchError);
    throw new Error('Original report not found.');
  }

  // 2. Create a new report object, excluding the original ID and created_at timestamp
  const { id: _, created_at: __, ...newReportData } = original;
  newReportData.title = `${original.title} (Copy)`; // Append (Copy) to the title
  newReportData.status = 'COMPLETED'; // Duplicates are already complete

  // 3. Insert the new record
  const { error: insertError } = await supabase
    .from('transcription_reports')
    .insert(newReportData);

  if (insertError) {
    console.error('Error duplicating report:', insertError);
    throw new Error('Failed to duplicate report.');
  }

  revalidatePath('/');
}