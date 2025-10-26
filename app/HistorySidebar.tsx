'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TranscriptionReport } from '@/lib/utils';
import { HistoryItem } from './HistoryItem';
import { getHistory } from '@/app/api/queries/getHistory';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export function HistorySidebar() {
  console.log("Rendering HistorySidebar");
  const [reports, setReports] = useState<TranscriptionReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeReportId = searchParams.get('id');
  const supabase = createSupabaseBrowserClient();

  const loadHistory = async () => {
    try {
      const data = await getHistory(supabase);
      setReports(data);
    } catch (err: any) {
      setError(err.message);
    }
  };


  useEffect(() => {
    loadHistory();
    // Poll for updates every 5 seconds
    const interval = setInterval(loadHistory, 5000);
    return () => clearInterval(interval);
  }, [supabase]);