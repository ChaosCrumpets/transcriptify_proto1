'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox'; // <--- NEW IMPORT
import { Label } from '@/components/ui/label'; // <--- NEW IMPORT
import { toast } from 'sonner';
import { generateTranscriptionReport } from '@/app/api/actions/generateTranscriptionReport';
import { startSingleScrapeAndTranscribe_placeholder } from '@/app/api/actions/scrapeActions';
import { startBatchTranscription_placeholder } from '@/app/api/actions/batchActions';
import { startFileUploadTranscription_placeholder } from '@/app/api/actions/fileActions';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type Mode = 'transcribe' | 'scrape' | 'batch' | 'upload';

interface ProcessingOptions {
  intelTranscription: boolean;
  advancedAnalysis: boolean;
}

export function WelcomeView() {
  const [mode, setMode] = useState<Mode>('transcribe');
  const [singleUrl, setSingleUrl] = useState('');
  const [batchUrlsString, setBatchUrlsString] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [options, setOptions] = useState<ProcessingOptions>({
    intelTranscription: false,
    advancedAnalysis: false,
  });
  const router = useRouter();

  const handleOptionChange = (key: keyof ProcessingOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setIsModalOpen(false); // Close modal after file selection
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

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
          if (result?.reportId) {
            toast.success(`Transcription started! Report ID: ${result.reportId}`);
            router.push(`/?reportId=${result.reportId}`);
          } else {
            console.error("Server action response missing reportId:", result);
            throw new Error(result?.error || 'Failed to start transcription. Invalid response from server.');
          }
          break;
        case 'scrape':
          if (!singleUrl.trim()) {
            throw new Error('Please enter a URL to scrape.');
          }
          result = await startSingleScrapeAndTranscribe_placeholder(singleUrl);
          if (result?.reportId) {
            toast.success(`Scrape job started! Report ID: ${result.reportId}`);
            router.push(`/?reportId=${result.reportId}`);
          } else {
            console.error("Server action response missing reportId:", result);
            throw new Error(result?.error || 'Failed to start scrape. Invalid response from server.');
          }
          break;
        case 'batch':
          const urls = batchUrlsString.split('\n').map(url => url.trim()).filter(url => url !== '');
          if (urls.length === 0) {
            throw new Error('Please enter at least one URL for batch processing.');
          }
          result = await startBatchTranscription_placeholder(urls);
          if (result?.success) {
            toast.success(result.message || `Batch transcription started for ${urls.length} URLs.`);
            // In a real scenario, we might redirect to a batch status page
            // For now, clearing the input is good feedback
          } else {
             console.error("Server action response missing success for batch:", result);
             throw new Error(result?.error || 'Failed to start batch transcription. Invalid response from server.');
          }
          break;
        case 'upload':
            if (!selectedFile) {
                throw new Error('Please select a file to upload.');
            }
            const fileMetadata = {
                fileName: selectedFile.name,
                fileSize: selectedFile.size,
                fileType: selectedFile.type,
            };
            result = await startFileUploadTranscription_placeholder(fileMetadata);
            if (result?.reportId) {
                toast.success(`File upload and transcription started! Report ID: ${result.reportId}`);
                router.push(`/?reportId=${result.reportId}`);
            } else {
                console.error("Server action response missing reportId for upload:", result);
                throw new Error(result?.error || 'Failed to start file upload transcription. Invalid response from server.');
            }
            break;
        default:
          throw new Error('Invalid mode selected.');
      }
      // Clear inputs upon successful submission
      if (mode === 'transcribe' || mode === 'scrape') {
          setSingleUrl('');
      } else if (mode === 'batch') {
          setBatchUrlsString('');
      } else if (mode === 'upload') {
          setSelectedFile(null);
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
    setSingleUrl('');
    setBatchUrlsString('');
    setSelectedFile(null);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to Transcriptify</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
        Get started by providing a URL, scraping a post, uploading a file, or processing a batch.
      </p>

      {/* ======================================================== */}
      {/* NEWLY ADDED PROCESSING OPTIONS BLOCK                     */}
      {/* ======================================================== */}
      <div className="w-full max-w-xl mb-6 p-4 border rounded-lg text-left">
        <h3 className="text-md font-semibold mb-3">Processing Options</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="intel-transcription"
              checked={options.intelTranscription}
              onCheckedChange={() => handleOptionChange('intelTranscription')}
            />
            <Label htmlFor="intel-transcription" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Intel Transcription <span className="text-xs text-gray-500">(Coming Soon)</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="advanced-analysis"
              checked={options.advancedAnalysis}
              onCheckedChange={() => handleOptionChange('advancedAnalysis')}
            />
            <Label htmlFor="advanced-analysis" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Advanced Analysis <span className="text-xs text-gray-500">(Coming Soon)</span>
            </Label>
          </div>
        </div>
      </div>
      {/* ======================================================== */}
      {/* END OF NEW BLOCK                                         */}
      {/* ======================================================== */}


      <Tabs value={mode} onValueChange={handleModeChange} className="w-full max-w-xl mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transcribe">Transcribe URL</TabsTrigger>
          <TabsTrigger value="scrape">Scrape Post</TabsTrigger>
          <TabsTrigger value="upload">Upload File</TabsTrigger>
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
        <TabsContent value="upload" className="mt-4">
          {selectedFile ? (
            <div className="flex flex-col items-center space-y-2">
              <p className="text-gray-700 dark:text-gray-200">Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
              <div className="flex space-x-2">
                <Button onClick={handleRemoveFile} variant="outline">Change File</Button>
                {/* Submit button is below, common for all modes */}
              </div>
            </div>
          ) : (
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">Select Files</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Upload File</DialogTitle>
                  <DialogDescription>
                    Choose a source for your audio or video file (.mp3, .mp4).
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <input
                    id="local-file-upload"
                    type="file"
                    accept=".mp3,.mp4"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button onClick={() => document.getElementById('local-file-upload')?.click()}>
                    Local Files
                  </Button>
                  <Button onClick={() => toast.info("Google Drive integration coming soon!")} variant="secondary">
                    Google Drive (Coming Soon)
                  </Button>
                  <Button onClick={() => toast.info("Dropbox integration coming soon!")} variant="secondary">
                    Dropbox (Coming Soon)
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>
        <TabsContent value="batch" className="mt-4">
          <Textarea
            placeholder="Paste multiple URLs (YouTube, TikTok, etc.), one per line..."
            value={batchUrlsString}
            onChange={(e) => setBatchUrlsString(e.target.value)}
            disabled={isLoading}
            className="min-h-[150px] text-left"
            rows={5}
          />
        </TabsContent>
      </Tabs>

      <Button onClick={handleSubmit} disabled={isLoading || (mode === 'upload' && !selectedFile)} size="lg">
        {isLoading ? 'Processing...' : 'Generate Report'}
      </Button>
    </div>
  );
}