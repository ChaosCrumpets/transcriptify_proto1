'use client';

import { useEffect, useState } from 'react';
import { TranscriptionReport } from '@/lib/supabase';

import { getTranscriptionReport } from '@/app/api/queries/getTranscriptionReport';

export function ReportView({ reportId }: { reportId: string }) {
  console.log("Rendering ReportView");
  const [report, setReport] = useState<TranscriptionReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const poll = async () => {
      if (!reportId) return;
      try {
        const data = await getTranscriptionReport(reportId);
        if (isActive) {
          setReport(data);
          if (data && (data.status === 'PENDING' || data.status === 'PROCESSING')) {
            setTimeout(poll, 5000);
          }
        }
      } catch (err: any) {
        if (isActive) {
          setError(err.message);
        }
      }
    };

    poll();

    return () => {
      isActive = false;
    };
  }, [reportId]);

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  if (!report) {
    return <div className="p-8">Loading report...</div>;
  }

  if (report.status === 'PENDING' || report.status === 'PROCESSING') {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Analyzing...</h2>
        <p className="text-gray-500">Your report is being generated. This may take a moment.</p>
        <div className="mt-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (report.status === 'FAILED') {
    return (
      <div className="p-8 text-center text-red-500">
        <h2 className="text-2xl font-bold mb-4">Analysis Failed</h2>
        <p>{report.error_message || 'An unknown error occurred.'}</p>
      </div>
    );
  }

  return (
    <div className="p-8 overflow-y-auto h-full">
      <h2 className="text-3xl font-bold mb-6">{report.title}</h2>

      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-3">Synopsis</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{report.synopsis}</p>
      </section>

      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-3">Key Takeaways</h3>
        <ul className="list-disc list-inside space-y-2">
          {report.key_takeaways && report.key_takeaways.map((takeaway, index) => (
            <li key={index} className="text-gray-600 dark:text-gray-300">{takeaway}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3">Cleaned Transcript</h3>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg whitespace-pre-wrap text-gray-700 dark:text-gray-200">
          {report.cleaned_transcript}
        </div>
      </section>
    </div>
  );
}