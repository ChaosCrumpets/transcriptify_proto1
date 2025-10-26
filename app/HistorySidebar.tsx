''''use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TranscriptionReport } from '@/lib/utils';
import { HistoryItem } from './HistoryItem';

export function HistorySidebar() {
  console.log("Rendering HistorySidebar");
  const [reports, setReports] = useState<TranscriptionReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeReportId = searchParams.get('id');

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/history');
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      const data = await response.json();
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

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold p-4">History</h2>
      {error && <p className="text-red-500 p-4">{error}</p>}
      <div className="overflow-y-auto">
        {reports.map((report) => (
          <HistoryItem
            key={report.id}
            report={report}
            isActive={report.id === activeReportId}
            onClick={() => router.push(`/?id=${report.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
'''