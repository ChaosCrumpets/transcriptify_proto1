/*
  # Schema Update: Transcription Reports (Robust Version)

  This migration ensures the `transcription_reports` table exists and is correctly configured. It is designed to be idempotent and run safely multiple times, avoiding destructive operations like DROP TABLE.

  ## 1. Changes

  - **Safe Table Creation**: Uses `CREATE TABLE IF NOT EXISTS` to prevent errors if the table already exists.
  - **Column Addition**: Uses `DO $$ ... $$` blocks to add columns only if they are missing.
  - **Default Status**: Ensures the `status` column has a 'PENDING' default.
  - **RLS and Policy**: Enables RLS and creates the public read policy safely.

  ## 2. Table Schema

  - **`transcription_reports`**:
    - `id` (uuid): Unique identifier for the report.
    - `created_at` (timestamptz): Timestamp of creation.
    - `source_url` (text): The original video URL.
    - `status` (text): Job status (PENDING, PROCESSING, COMPLETED, FAILED).
    - `synopsis` (text): AI-generated summary.
    - `key_takeaways` (jsonb): Array of key points.
    - `cleaned_transcript` (text): Final, cleaned transcript.
    - `original_transcript` (text): Raw transcript.
    - `error_message` (text): Stores any error message.

  ## 3. Security

  - **Row Level Security (RLS)** is enabled on the `transcription_reports` table.
  - A policy is created to allow public read-only access (`SELECT`).
*/

-- Create the table only if it doesn't exist to avoid errors on re-runs.
CREATE TABLE IF NOT EXISTS "transcription_reports" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Ensure uuid extension exists (some Postgres instances need this)
-- Try `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` or `pgcrypto` depending on your environment.
DO $$
BEGIN
  -- Attempt to create uuid-ossp safely; ignore if not supported by host
  BEGIN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create uuid-ossp extension automatically; ensure an appropriate uuid generator is available.';
  END;
END $$;

-- Use anonymous blocks to add columns if they don't exist.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transcription_reports' AND column_name='source_url') THEN
    ALTER TABLE "transcription_reports" ADD COLUMN "source_url" text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transcription_reports' AND column_name='status') THEN
    ALTER TABLE "transcription_reports" ADD COLUMN "status" text DEFAULT 'PENDING'::text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transcription_reports' AND column_name='synopsis') THEN
    ALTER TABLE "transcription_reports" ADD COLUMN "synopsis" text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transcription_reports' AND column_name='key_takeaways') THEN
    ALTER TABLE "transcription_reports" ADD COLUMN "key_takeaways" jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transcription_reports' AND column_name='cleaned_transcript') THEN
    ALTER TABLE "transcription_reports" ADD COLUMN "cleaned_transcript" text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transcription_reports' AND column_name='original_transcript') THEN
    ALTER TABLE "transcription_reports" ADD COLUMN "original_transcript" text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transcription_reports' AND column_name='error_message') THEN
    ALTER TABLE "transcription_reports" ADD COLUMN "error_message" text;
  END IF;
END $$;

-- Set the default value for status, in case the column was added without it.
ALTER TABLE "transcription_reports" ALTER COLUMN "status" SET DEFAULT 'PENDING'::text;

-- Add comments to explain the purpose of each column
COMMENT ON COLUMN "public"."transcription_reports"."id" IS 'Unique identifier for the report.';
COMMENT ON COLUMN "public"."transcription_reports"."status" IS 'Tracks the current state of the job (e.g., PENDING, PROCESSING, COMPLETED, FAILED).';
COMMENT ON COLUMN "public"."transcription_reports"."key_takeaways" IS 'Stores the bullet points from the analysis as a JSON array.';

-- Enable Row Level Security
ALTER TABLE "transcription_reports" ENABLE ROW LEVEL SECURITY;

-- Drop the policy if it exists, then recreate it to ensure it's up-to-date.
DROP POLICY IF EXISTS "Allow public read access" ON "transcription_reports";
CREATE POLICY "Allow public read access"
  ON "transcription_reports"
  FOR SELECT
  USING (true);
