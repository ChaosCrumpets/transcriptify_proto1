import { HistorySidebar } from '@/app/HistorySidebar';
import { WelcomeView } from '@/app/WelcomeView';
import { ReportView } from '@/app/ReportView';
// import { Toaster } from 'sonner'; // <--- REMOVED THIS LINE
import { Suspense } from 'react';

interface HomePageProps {
  searchParams?: {
    reportId?: string;
  };
}

export default function HomePage({ searchParams }: HomePageProps) {
  const reportId = searchParams?.reportId;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
      {/* <Toaster /> <--- REMOVED THIS LINE */ }
      <HistorySidebar />
      <main className="flex-1 flex flex-col">
        {reportId ? (
          <Suspense fallback={<div className="p-8">Loading report...</div>}>
            <ReportView reportId={reportId} />
          </Suspense>
        ) : (
          <WelcomeView />
        )}
      </main>
    </div>
  );
}
