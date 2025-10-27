'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { HistoryItem } from './HistoryItem';

interface HistoryItemData {
  id: string;
  title: string;
  created_at: string;
}

export function HistorySidebar() {
  const [history, setHistory] = useState<HistoryItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentReportId = searchParams.get('reportId');

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/history');
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // Poll for updates every 5 seconds
    const interval = setInterval(loadHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleItemClick = (reportId: string) => {
    router.push(`/?reportId=${reportId}`);
  };

  return (
    <div className="w-64 space-y-2 p-4 border-r border-gray-700 h-full overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">History</h2>
      {isLoading ? (
        <p className="text-gray-400">Loading history...</p>
      ) : history.length > 0 ? (
        history.map((item) => (
          <HistoryItem
            key={item.id}
            item={item}
            isActive={item.id === currentReportId}
            onClick={() => handleItemClick(item.id)}
          />
        ))
      ) : (
        <p className="text-gray-400">No history found.</p>
      )}
    </div>
  );
}