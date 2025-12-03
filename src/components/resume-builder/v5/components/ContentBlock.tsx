/**
 * ContentBlock - Reusable clickable resume content item with selection indicator
 */

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';
import type { ContentConfidence } from '../types';

interface ContentBlockProps {
  id: string;
  text: string;
  confidence: ContentConfidence;
  isSelected: boolean;
  isEdited?: boolean;
  isJustUpdated?: boolean;
  onClick: () => void;
  className?: string;
}

export function ContentBlock({
  text,
  confidence,
  isSelected,
  isEdited,
  isJustUpdated,
  onClick,
  className
}: ContentBlockProps) {
  const blockRef = useRef<HTMLDivElement>(null);

  // Scroll into view and flash when just updated
  useEffect(() => {
    if (isJustUpdated && blockRef.current) {
      blockRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isJustUpdated]);

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
        return <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />;
      case 'enhanced':
        return <Sparkles className="h-3 w-3 text-yellow-500 flex-shrink-0" />;
      case 'invented':
        return <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={blockRef}
      onClick={onClick}
      className={cn(
        'p-3 rounded-lg transition-all cursor-pointer group relative',
        getConfidenceStyles(),
        isSelected && 'ring-2 ring-primary shadow-md',
        isEdited && 'border-blue-500',
        isJustUpdated && 'animate-success-pulse bg-green-500/20',
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
      
      {/* Selection indicator arrow */}
      {isSelected && (
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 text-primary">
          <ArrowRight className="h-4 w-4 animate-bounce-arrow" />
        </div>
      )}
      
      {/* Success flash overlay */}
      {isJustUpdated && (
        <div className="absolute inset-0 rounded-lg bg-green-500/10 pointer-events-none">
          <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-green-600 font-medium">
            <CheckCircle2 className="h-3 w-3" />
            Updated
          </div>
        </div>
      )}
    </div>
  );
}
