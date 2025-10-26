'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { generateTranscriptionReport } from '@/app/api/actions/generateTranscriptionReport';
import { useToast } from '@/hooks/use-toast';
import { HistorySidebar } from '@/app/HistorySidebar';
import { ReportView } from '@/app/ReportView';
import { WelcomeView } from '@/app/WelcomeView';

// A new component to handle the form submission status
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-wait transition-all duration-300 ease-in-out"
    >
      {pending ? 'Analyzing...' : 'Generate Report'}
    </button>
  );
}

function HomePageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const activeReportId = searchParams.get('id');
  const formRef = useRef<HTMLFormElement>(null);

  // useFormState to handle form submission state and result
  const [state, formAction] = useFormState(generateTranscriptionReport, {
    error: null,
    reportId: null,
  });

  // Effect to handle the result of the form action
  useEffect(() => {
    if (state.reportId) {
      router.push(`/?id=${state.reportId}`);
      formRef.current?.reset(); // Reset the form on success
    }
    if (state.error) {
      toast({
        title: "Submission Failed",
        description: state.error,
        variant: "destructive",
      });
    }
  }, [state, router, toast]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <HistorySidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="p-4 border-b border-gray-200 dark:border-gray-800">
          <form ref={formRef} action={formAction} className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              name="url" // Name attribute is required for form actions
              placeholder="Paste video URL here (YouTube, X, etc.)"
              className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              required
            />
            <SubmitButton />
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
