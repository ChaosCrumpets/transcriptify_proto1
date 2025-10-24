'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { generateTranscriptionReport } from '@/app/api/actions/generateTranscriptionReport';
import { useToast } from '@/hooks/use-toast';
import { HistorySidebar } from '@/app/HistorySidebar';
import { ReportView } from '@/app/ReportView';
import { WelcomeView } from '@/app/WelcomeView';

function HomePageContent() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const activeReportId = searchParams.get('id');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !url.startsWith('http')) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid video URL.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const reportId = await generateTranscriptionReport(url);
      // Update URL to show the new report without a full page reload
      router.push(`/?id=${reportId}`);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Submission Failed",
        description: error.message || "Could not start the analysis. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <HistorySidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="p-4 border-b border-gray-200 dark:border-gray-800">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste video URL here (YouTube, X, etc.)"
              className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              disabled={isLoading}
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-wait transition-all duration-300 ease-in-out"
            >
              {isLoading ? 'Analyzing...' : 'Generate Report'}
            </button>
          </form>
        </header>
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
          {activeReportId ? (
            <ReportView reportId={activeReportId} />
          ) : (
            <WelcomeView />
          )}
        </div>
      </main>
    </div>
  );
}

export default function HomePage() {
  console.log("Rendering HomePage");
  return (
    // Suspense is required by Next.js when using useSearchParams
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
