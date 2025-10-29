'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { generateTranscriptionReport } from '@/app/api/actions/generateTranscriptionReport';
import { startSingleScrapeAndTranscribe_placeholder } from '@/app/api/actions/scrapeActions'; // Placeholder
import { startBatchTranscription_placeholder } from '@/app/api/actions/batchActions'; // Placeholder
import { useRouter } from 'next/navigation'; // Import useRouter

type Mode = 'transcribe' | 'scrape' | 'batch';

export function WelcomeView() {
  const [mode, setMode] = useState<Mode>('transcribe');
  const [singleUrl, setSingleUrl] = useState('');
  const [batchUrlsString, setBatchUrlsString] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // Initialize useRouter

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      let result;
      switch (mode) {
        case 'transcribe':
          if (!singleUrl.trim()) {
            throw new Error('Please enter a URL.');
          }
          result = await generateTranscriptionReport(singleUrl);
          // Assuming generateTranscriptionReport returns { reportId: '...' } on success
          if (result?.reportId) {
             toast.success(`Transcription started! Report ID: ${result.reportId}`);
             // Redirect or update UI as needed, e.g., navigate to the report page
             router.push(`/?reportId=${result.reportId}`); // Navigate to show the new report
          } else {
             // Handle cases where reportId might not be returned as expected
             console.error("Server action response missing reportId:", result);
             throw new Error(result?.error || 'Failed to start transcription. Invalid response from server.');
          }
          break;
        case 'scrape':
          if (!singleUrl.trim()) {
            throw new Error('Please enter a URL to scrape.');
          }
          result = await startSingleScrapeAndTranscribe_placeholder(singleUrl);
          toast.success(result.message || `Placeholder: Scrape job started for ${singleUrl}`);
          setSingleUrl(''); // Clear input after submission
          break;
        case 'batch':
          const urls = batchUrlsString.split('\n').map(url => url.trim()).filter(url => url !== '');
          if (urls.length === 0) {
            throw new Error('Please enter at least one URL for batch processing.');
          }
          result = await startBatchTranscription_placeholder(urls);
          toast.success(result.message || `Placeholder: Batch transcription started for ${urls.length} URLs.`);
          setBatchUrlsString(''); // Clear input after submission
          break;
        default:
          throw new Error('Invalid mode selected.');
      }
       // Clear single URL input only if it was used and successful
       if ((mode === 'transcribe' || mode === 'scrape') && result && !result.error) {
           setSingleUrl('');
       }

    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (value: string) => {
    setMode(value as Mode);
    // Optionally clear inputs when switching modes
    // setSingleUrl('');
    // setBatchUrlsString('');
  };


  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to Transcriptify</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
        Get started by providing a URL for transcription or scraping.
      </p>

      <Tabs value={mode} onValueChange={handleModeChange} className="w-full max-w-xl mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transcribe">Transcribe URL</TabsTrigger>
          <TabsTrigger value="scrape">Scrape Post</TabsTrigger>
          <TabsTrigger value="batch">Batch URLs</TabsTrigger>
        </TabsList>

        <TabsContent value="transcribe" className="mt-4">
          <Input
            type="url"
            placeholder="Enter YouTube, TikTok, etc. URL to transcribe..."
            value={singleUrl}
            onChange={(e) => setSingleUrl(e.target.value)}
            disabled={isLoading}
            className="text-center"
          />
        </TabsContent>
        <TabsContent value="scrape" className="mt-4">
          <Input
            type="url"
            placeholder="Enter Instagram, TikTok, X post URL to scrape..."
            value={singleUrl}
            onChange={(e) => setSingleUrl(e.target.value)}
            disabled={isLoading}
            className="text-center"
          />
           <p className="text-xs text-gray-500 mt-2">Note: Scraping extracts media for transcription.</p>
        </TabsContent>
        <TabsContent value="batch" className="mt-4">
          <Textarea
            placeholder="Paste multiple URLs (YouTube, TikTok, etc.), one per line..."
            value={batchUrlsString}
            onChange={(e) => setBatchUrlsString(e.target.value)}
            disabled={isLoading}
            className="min-h-[150px] text-left" // Adjusted styling for textarea
            rows={5}
          />
        </TabsContent>
      </Tabs>

      <Button onClick={handleSubmit} disabled={isLoading} size="lg">
        {isLoading ? 'Processing...' : 'Generate Report'}
      </Button>
    </div>
  );
}
