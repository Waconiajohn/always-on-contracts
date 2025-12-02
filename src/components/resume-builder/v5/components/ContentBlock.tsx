/**
 * ContentBlock - Reusable clickable resume content item
 */

import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import type { ContentConfidence } from '../types';

interface ContentBlockProps {
  id: string;
  text: string;
  confidence: ContentConfidence;
  isSelected: boolean;
  isEdited?: boolean;
  onClick: () => void;
  className?: string;
}

export function ContentBlock({
  text,
  confidence,
  isSelected,
  isEdited,
  onClick,
  className
}: ContentBlockProps) {
  const getConfidenceStyles = () => {
    switch (confidence) {
      case 'exact':
        return 'bg-green-500/5 border-l-4 border-green-500 hover:bg-green-500/10';
      case 'enhanced':
        return 'bg-yellow-500/5 border-l-4 border-yellow-500 hover:bg-yellow-500/10';
      case 'invented':
        return 'bg-red-500/5 border-l-4 border-red-500 hover:bg-red-500/10';
      default:
        return '';
    }
  };

  const getConfidenceIcon = () => {
    switch (confidence) {
      case 'exact':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'enhanced':
        return <Sparkles className="h-3 w-3 text-yellow-500" />;
      case 'invented':
        return <AlertTriangle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-3 rounded-lg transition-all cursor-pointer group relative',
        getConfidenceStyles(),
        isSelected && 'ring-2 ring-primary',
        isEdited && 'border-blue-500',
        className
      )}
    >
      <div className="flex items-start gap-2">
        {getConfidenceIcon()}
        <p className="text-sm flex-1 leading-relaxed">{text}</p>
      </div>
      {isEdited && (
        <div className="absolute top-2 right-2 text-xs text-blue-500 font-medium">
          Edited
        </div>
      )}
    </div>
  );
}
