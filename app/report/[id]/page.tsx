'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Define a type for our report data for type safety
type Report = {
  id: string;
  created_at: string;
  source_url: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  synopsis: string | null;
  key_takeaways: string[] | null;
  cleaned_transcript: string | null;
  error_message: string | null;
};

export default function ReportPage({ params }: { params: { id: string } }) {
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    // Function to fetch the report data from our new API endpoint
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/report/${params.id}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch report data.');
        }
        const data = await response.json();
        if (isMounted) {
          setReport(data as Report);
          if (data.status === 'COMPLETED' || data.status === 'FAILED') {
            clearInterval(intervalId);
          }
        }
      } catch (error) {
        console.error("Failed to fetch report:", error);
        const errorMessage = error instanceof Error ? error.message : 'Could not load report data.';
        if (isMounted) {
          setReport(prev => prev || { status: 'FAILED', error_message: errorMessage } as unknown as Report);
          clearInterval(intervalId);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchReport();

    // Set up polling to check for updates if the report is processing
    intervalId = setInterval(fetchReport, 5000); // Poll every 5 seconds

    // Clean up the interval when the component unmounts
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [params.id]);


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <div className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-4">Loading Report...</div>
      </div>
    );
  }

  if (!report || report.status === 'FAILED') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-center p-4">
          <h2 className="text-3xl font-bold text-red-600 mb-4">Analysis Failed</h2>
          <p className="text-gray-600 dark:text-gray-400 bg-red-100 dark:bg-red-900/20 p-4 rounded-lg mb-8 max-w-md">
            {report?.error_message || 'An unknown error occurred while fetching the report.'}
          </p>
          <Link href="/" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              Try Another URL
          </Link>
      </div>
    );
  }
  
  if (report.status === 'PENDING' || report.status === 'PROCESSING') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-center p-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Analyzing Your Video...</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">This page will update automatically when the report is ready.</p>
      </div>
    );
  }

  return (
    <main className="bg-gray-100 dark:bg-gray-900 min-h-screen p-4 sm:p-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8">
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analysis Report</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 break-all">
                        Source: <a href={report.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{report.source_url}</a>
                    </p>
                </div>
                
                <div className="space-y-10">
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Synopsis</h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{report.synopsis}</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Key Takeaways</h2>
                        <ul className="list-disc list-inside space-y-3 pl-2">
                            {report.key_takeaways?.map((point, i) => (
                                <li key={i} className="text-gray-700 dark:text-gray-300">{point}</li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Transcript</h2>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                            {report.cleaned_transcript}
                        </div>
                    </section>
                </div>
            </div>
             <div className="p-6 sm:p-8 bg-gray-50 dark:bg-gray-800/50 text-center">
                <Link href="/" className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                    Analyze Another Video
                </Link>
            </div>
        </div>
    </main>
  );
}
