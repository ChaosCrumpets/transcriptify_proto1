'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TranscriptionReport } from '@/lib/supabase';
import { HistoryItem } from './HistoryItem';
import { getHistory } from '@/app/api/queries/getHistory';

export function HistorySidebar() {
  console.log("Rendering HistorySidebar");
  const [reports, setReports] = useState<TranscriptionReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeReportId = searchParams.get('id');

  const loadHistory = async () => {
    try {
      const data = await getHistory();
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
  }, []);

  const handleSelectReport = (id: string) => {
    router.push(`/?id=${id}`);
  };

  return (
    <aside className="w-full sm:w-1/3 md:w-1/4 lg:w-1/5 bg-gray-50 dark:bg-gray-900 p-4 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        History
      </h2>
      {error && <p className="text-red-500">{error}</p>}
      <div className="space-y-2">
        {reports.length > 0 ? (
          reports.map((report) => (
            <HistoryItem
              key={report.id}
              report={report}
              isActive={report.id === activeReportId}
              onSelect={() => handleSelectReport(report.id)}
              onUpdate={loadHistory}
            />
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No reports yet. Generate one to get started.
          </p>
        )}
      </div>
    </aside>
  );
}