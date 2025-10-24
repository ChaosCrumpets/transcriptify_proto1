-- Adds the 'title' column to the transcription_reports table.
-- This will store a user-editable or AI-generated title for each job.

ALTER TABLE public.transcription_reports
ADD COLUMN title TEXT DEFAULT 'Untitled Transcription';

-- Backfill existing rows with a default title to avoid null values.
UPDATE public.transcription_reports
SET title = 'Untitled Transcription'
WHERE title IS NULL;
