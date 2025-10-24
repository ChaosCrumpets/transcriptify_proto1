'use client';

import { useState } from 'react';
import { TranscriptionReport } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Copy, Edit } from 'lucide-react';
import { renameReport, deleteReport, duplicateReport } from '@/app/api/actions/manageReports';
import { useToast } from '@/hooks/use-toast';

interface HistoryItemProps {
  report: TranscriptionReport;
  isActive: boolean;
  onSelect: () => void;
  onUpdate: () => void;
}

export function HistoryItem({ report, isActive, onSelect, onUpdate }: HistoryItemProps) {
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleAction = async (action: () => Promise<void>, successMessage: string) => {
    try {
      await action();
      toast({ title: 'Success', description: successMessage });
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const handleRename = async () => {
    const newTitle = prompt('Enter new title:', report.title || '');
    if (newTitle && newTitle.trim() !== report.title) {
      await handleAction(() => renameReport({ id: report.id, newTitle }), 'Report renamed.');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this report?')) {
      await handleAction(() => deleteReport({ id: report.id }), 'Report deleted.');
    }
  };

  const handleDuplicate = async () => {
    await handleAction(() => duplicateReport({ id: report.id }), 'Report duplicated.');
  };

  const statusColor = {
    PENDING: 'text-yellow-500',
    PROCESSING: 'text-blue-500 animate-pulse',
    COMPLETED: 'text-green-500',
    FAILED: 'text-red-500',
  }[report.status];

  return (
    <div
      className={`group flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <div className="flex-grow" onClick={onSelect}>
        <p className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">
          {report.title || 'Untitled Transcription'}
        </p>
        <p className={`text-xs ${statusColor}`}>{report.status}</p>
      </div>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent onClick={(e) => e.stopPropagation()} align="end">
          <DropdownMenuItem onClick={handleRename}><Edit className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate}><Copy className="mr-2 h-4 w-4" /> Duplicate</DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-500"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}