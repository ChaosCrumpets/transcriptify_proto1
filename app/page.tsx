'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateTranscriptionReport } from '@/app/api/actions/generateTranscriptionReport';
import { useToast } from '@/hooks/use-toast';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

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
      // Redirect to the report page where it will poll for updates
      router.push(`/report/${reportId}`);
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
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
          Transcriptify
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Turn any social media video into a detailed, readable report.
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input 
            type="url" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste video URL here (YouTube, X, etc.)"
            className="flex-grow p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
            required
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-wait transition-all duration-300 ease-in-out"
          >
            {isLoading ? 'Analyzing...' : 'Generate Report'}
          </button>
        </form>
      </div>
    </main>
  );
}
