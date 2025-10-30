'use client';

import { useState, useEffect, useTransition, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toaster, toast } from 'sonner';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText, MessageSquare, MoreHorizontal, Copy, Trash2, Edit, Share2, PlusCircle,
  PanelLeftClose, PanelLeftOpen, Loader2, AlertTriangle, Wand2, UploadCloud
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { generateTranscriptionReport } from './api/actions/generateTranscriptionReport';
import { renameReport, deleteReport, duplicateReport } from './api/actions/manageReports';
import { getTranscriptionReport } from './api/queries/getTranscriptionReport'; // For fetching active report

// Type definition for a single transcription job/report
type Report = {
  id: string;
  title: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SCRAPING'; // Added SCRAPING
  created_at: string;
  source_url?: string | null; // Allow null
  synopsis?: string | null;
  key_takeaways?: string[] | null;
  cleaned_transcript?: string | null;
  error_message?: string | null;
};

// --- Main Application Component (Wrapper for Suspense) ---
export default function HomePageWrapper() {
  return (
    // Suspense boundary for Next.js Search Params
    <Suspense fallback={<LoadingScreen />}>
      <TranscriptionPage />
    </Suspense>
  )
}

function LoadingScreen() {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
}

function TranscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeReportId = searchParams.get('id');

  const [history, setHistory] = useState<Report[]>([]);
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // --- Data Fetching Effects ---
  // Fetch history on initial load and then poll for updates
  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/history');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
              setHistory(data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch history:', error);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 5000); // Poll every 5 seconds

    return () => {
        isMounted = false;
        clearInterval(interval);
    };
  }, []);

  // Fetch active report details when the ID in the URL changes or history updates
  useEffect(() => {
    let isMounted = true;
    const fetchActiveReport = async () => {
      if (!activeReportId) {
        if(isMounted) setActiveReport(null);
        return;
      }

      setIsLoadingReport(true);
      try {
        // Optimistically try to get from history if complete
        const fromHistory = history.find(r => r.id === activeReportId);
        if (fromHistory && fromHistory.status !== 'PENDING' && fromHistory.status !== 'PROCESSING' && fromHistory.status !== 'SCRAPING') {
          if (isMounted) setActiveReport(fromHistory);
        } else {
            // Fetch full details directly if not complete or not found
            const reportData = await getTranscriptionReport(activeReportId);
            if (isMounted) setActiveReport(reportData as Report | null);
        }
      } catch (error) {
        console.error('Failed to fetch active report:', error);
        if (isMounted) toast.error('Could not load the selected report.');
      } finally {
        if (isMounted) setIsLoadingReport(false);
      }
    };

    fetchActiveReport();

    return () => { isMounted = false; };
  }, [activeReportId, history]); // Depend on history to potentially update activeReport

  // --- Event Handlers ---
  const handleNewReport = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleSelectReport = useCallback((id: string) => {
    router.push(`/?id=${id}`);
  }, [router]);

  // --- Render Method ---
  return (
    <div className="h-screen w-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex overflow-hidden">
      <Toaster position="top-center" richColors />
      <ResizablePanelGroup direction="horizontal">
        {isSidebarOpen && (
          <>
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="!overflow-y-auto">
              <HistorySidebar
                history={history}
                activeReportId={activeReportId}
                onSelectReport={handleSelectReport}
                onNewReport={handleNewReport}
                onToggleSidebar={() => setIsSidebarOpen(false)}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}
        <ResizablePanel defaultSize={80}>
          <MainContent
            activeReportId={activeReportId}
            activeReport={activeReport}
            isLoading={isLoadingReport}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(true)}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

// --- Child Components ---

function HistorySidebar({ history, activeReportId, onSelectReport, onNewReport, onToggleSidebar }) {
  let [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState<Report | null>(null);

  const handleDelete = async () => {
    if (!showDeleteDialog) return;
    startTransition(async () => {
      try {
        await deleteReport({ id: showDeleteDialog.id });
        toast.success(`Deleted "${showDeleteDialog.title}"`);
        // The router push will clear the view if the active report was deleted
        if (activeReportId === showDeleteDialog.id) {
            onNewReport(); // Go back to the welcome screen
        }
        setShowDeleteDialog(null); // Close dialog *after* action completes
      } catch (error) {
        toast.error('Failed to delete report.');
        setShowDeleteDialog(null); // Ensure dialog closes even on error
      }
    });
  };

  return (
    <div className="h-full bg-white dark:bg-gray-800/50 flex flex-col">
      <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-inherit z-10">
        <h2 className="text-xl font-bold">History</h2>
        <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
          <PanelLeftClose className="h-5 w-5" />
        </Button>
      </div>
      <div className="p-4">
        <Button className="w-full" onClick={onNewReport}>
          <PlusCircle className="mr-2 h-4 w-4" /> New Transcription
        </Button>
      </div>
      <ScrollArea className="flex-grow">
        <div className="p-4 pt-0 space-y-2">
          {history.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No history yet.</p>
          )}
          {history.map(report => (
            <div
              key={report.id}
              onClick={() => onSelectReport(report.id)}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                activeReportId === report.id ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center truncate space-x-3">
                <MessageSquare className="h-4 w-4 flex-shrink-0 text-gray-500" />
                <span className="truncate font-medium">{report.title}</span>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                { (report.status === 'PENDING' || report.status === 'PROCESSING' || report.status === 'SCRAPING') && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
                { report.status === 'FAILED' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                <ItemActions report={report} onDelete={() => setShowDeleteDialog(report)} />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!showDeleteDialog} onOpenChange={(open) => !open && setShowDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{showDeleteDialog?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-red-600 hover:bg-red-700">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ItemActions({ report, onDelete }) {
  let [isPending, startTransition] = useTransition();
  const router = useRouter(); // Needed for navigating after duplication

  const handleAction = (action: Function, successMessage: string, errorMessage: string) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
      } catch (error) {
        toast.error(errorMessage);
        console.error("Action Error:", error);
      }
    });
  };

  const handleRename = () => {
    const newTitle = prompt('Enter new name:', report.title);
    if (newTitle && newTitle.trim() && newTitle !== report.title) {
      handleAction(
        () => renameReport({ id: report.id, newTitle: newTitle.trim() }),
        'Report renamed.',
        'Failed to rename report.'
      );
    } else if (newTitle !== null) { // Handle empty prompt
        toast.warning("Title cannot be empty.");
    }
  };

  const handleDuplicate = () => {
    handleAction(
      async () => {
          // Note: Duplicate action itself doesn't return the new ID easily with revalidatePath.
          // We'll rely on the history refresh to show the duplicate.
          await duplicateReport({ id: report.id });
          // Optionally, navigate away or show a specific message
      },
      'Report duplicated. Refreshing history...',
      'Failed to duplicate report.'
    );
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?id=${report.id}`);
    toast.success('Link copied to clipboard!');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 focus-visible:opacity-100">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleRename} disabled={isPending}><Edit className="mr-2 h-4 w-4"/>Rename</DropdownMenuItem>
        <DropdownMenuItem onClick={handleDuplicate} disabled={isPending}><Copy className="mr-2 h-4 w-4"/>Duplicate</DropdownMenuItem>
        <DropdownMenuItem onClick={handleShare} disabled={isPending}><Share2 className="mr-2 h-4 w-4"/>Share Link</DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-red-500 focus:bg-red-100 focus:text-red-700" disabled={isPending}><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


// Component to display the main content area (Welcome, Loading, Error, Report)
function MainContent({ activeReportId, activeReport, isLoading, isSidebarOpen, onToggleSidebar }) {
  const showLoading = isLoading || (activeReportId && !activeReport && !isLoading); // Show loading if ID exists but report hasn't loaded

  if (showLoading) {
      return <LoadingView onToggleSidebar={onToggleSidebar} isSidebarOpen={isSidebarOpen} />;
  }

  if (activeReport) {
    if (activeReport.status === 'PENDING' || activeReport.status === 'PROCESSING' || activeReport.status === 'SCRAPING') {
      return <ProcessingView report={activeReport} onToggleSidebar={onToggleSidebar} isSidebarOpen={isSidebarOpen} />;
    }
    if (activeReport.status === 'FAILED') {
      return <ErrorView report={activeReport} onToggleSidebar={onToggleSidebar} isSidebarOpen={isSidebarOpen} />;
    }
    return <ReportView report={activeReport} onToggleSidebar={onToggleSidebar} isSidebarOpen={isSidebarOpen} />;
  }
  return <WelcomeView onToggleSidebar={onToggleSidebar} isSidebarOpen={isSidebarOpen}/>;
}

// --- Different Views for Main Content ---

function WelcomeView({ onToggleSidebar, isSidebarOpen }) {
  const [url, setUrl] = useState('');
  let [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Removed Tabs and multiple modes as per the new UI direction in the prompt
  // Focus is now just on the URL input. File upload might be added back later if needed.

  const handleSubmit = () => {
    if (!url.trim() || !url.startsWith('http')) {
      toast.error('Please enter a valid URL to transcribe.');
      return;
    }
    startTransition(async () => {
      try {
        // Using the primary action for URL transcription
        const result = await generateTranscriptionReport(url);
        if (result.id) {
            toast.success('Your transcription job has started!');
            router.push(`/?id=${result.id}`); // Corrected parameter name
            setUrl(''); // Clear input on success
        } else {
            throw new Error(result.error || 'Failed to start job.');
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to start transcription.');
        console.error("Submission Error:", error);
      }
    });
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 relative">
      {!isSidebarOpen && (
        <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-10" onClick={onToggleSidebar}>
          <PanelLeftOpen className="h-5 w-5" />
        </Button>
      )}
      <Wand2 className="h-16 w-16 text-blue-500 mb-6" />
      <h1 className="text-4xl font-bold mb-2 text-gray-800 dark:text-white">Transcriptify</h1>
      <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-md text-center">
        Enter a video URL (YouTube, TikTok, etc.) to get started.
      </p>
      <div className="w-full max-w-lg flex space-x-2">
        <Input
          type="url"
          placeholder="Paste video URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isPending}
          className="flex-grow p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <Button onClick={handleSubmit} disabled={isPending || !url.trim()} size="lg">
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Generate'}
        </Button>
      </div>
    </div>
  );
}


function LoadingView({ onToggleSidebar, isSidebarOpen }) {
    return (
        <div className="h-full flex flex-col items-center justify-center p-4 relative">
            {!isSidebarOpen && (
                <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={onToggleSidebar}>
                <PanelLeftOpen className="h-5 w-5" />
                </Button>
            )}
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
    );
}

function ProcessingView({ report, onToggleSidebar, isSidebarOpen }) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4 relative">
        {!isSidebarOpen && (
          <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={onToggleSidebar}>
            <PanelLeftOpen className="h-5 w-5" />
          </Button>
        )}
        <Loader2 className="h-16 w-16 animate-spin text-blue-600 mb-6" />
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            {report.status === 'SCRAPING' ? 'Scraping Content...' : 'Analyzing Video...'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
            This may take a moment. The page will update automatically when the report is ready. Feel free to navigate away and come back later.
        </p>
         <p className="text-xs text-gray-400 mt-1 break-all max-w-md truncate">
            Source: {report.source_url}
        </p>
      </div>
    );
}

function ErrorView({ report, onToggleSidebar, isSidebarOpen }) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4 relative">
        {!isSidebarOpen && (
          <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={onToggleSidebar}>
            <PanelLeftOpen className="h-5 w-5" />
          </Button>
        )}
        <AlertTriangle className="h-16 w-16 text-red-500 mb-6" />
        <h2 className="text-3xl font-bold text-red-600 mb-4">Analysis Failed</h2>
         <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4 break-all max-w-md truncate">
            Source: {report.source_url}
        </p>
        <p className="text-gray-600 dark:text-gray-400 bg-red-100 dark:bg-red-900/20 p-4 rounded-lg mb-8 max-w-md">
            <strong>Error:</strong> {report.error_message || 'An unknown error occurred.'}
        </p>
        {/* Optionally add a retry button here */}
      </div>
    );
}

function ReportView({ report, onToggleSidebar, isSidebarOpen }) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800/30">
       {/* Header */}
       <div className="p-4 border-b dark:border-gray-700 flex items-center sticky top-0 bg-inherit z-10 min-h-[73px]">
          {!isSidebarOpen && (
            <Button variant="ghost" size="icon" className="mr-2 flex-shrink-0" onClick={onToggleSidebar}>
              <PanelLeftOpen className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-grow truncate">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{report.title}</h1>
            {report.source_url && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-all">
                    Source: <a href={report.source_url} target="_blank" rel="noopener noreferrer" className="hover:underline">{report.source_url}</a>
                </p>
            )}
          </div>
          {/* Add Action Buttons (e.g., Export, Edit) here if needed */}
       </div>
       {/* Content */}
       <ScrollArea className="flex-grow">
          <div className="p-6 md:p-8 space-y-10">
              <section>
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Synopsis</h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{report.synopsis || <span className="text-gray-400 italic">No synopsis available.</span>}</p>
              </section>

              <section>
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Key Takeaways</h2>
                  {report.key_takeaways?.length > 0 ? (
                      <ul className="list-disc list-inside space-y-3 pl-2">
                          {report.key_takeaways.map((point, i) => (
                              <li key={i} className="text-gray-700 dark:text-gray-300">{point}</li>
                          ))}
                      </ul>
                   ) : (
                      <p className="text-gray-400 italic">No key takeaways available.</p>
                   )}
              </section>

              <section>
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Transcript</h2>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
                      {report.cleaned_transcript || <span className="text-gray-400 italic">No transcript available.</span>}
                  </div>
              </section>
          </div>
       </ScrollArea>
    </div>
  );
}