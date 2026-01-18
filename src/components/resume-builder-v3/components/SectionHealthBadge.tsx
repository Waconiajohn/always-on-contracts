/**
 * SectionHealthBadge - Visual indicator of section optimization status
 * Shows green/yellow/red badges based on section health
 */

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, AlertTriangle, XCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type SectionStatus = 'optimized' | 'can-improve' | 'needs-attention' | 'ai-enhanced';

interface SectionHealthBadgeProps {
  status: SectionStatus;
  message?: string;
  compact?: boolean;
}

const statusConfig = {
  'optimized': {
    icon: CheckCircle2,
    label: 'Optimized',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    description: 'This section is well-aligned with the job requirements.',
  },
  'can-improve': {
    icon: AlertTriangle,
    label: 'Can Improve',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
    description: 'Some improvements could strengthen this section.',
  },
  'needs-attention': {
    icon: XCircle,
    label: 'Needs Attention',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    description: 'This section needs significant improvements to align with the job.',
  },
  'ai-enhanced': {
    icon: Sparkles,
    label: 'AI Enhanced',
    color: 'text-primary',
    bgColor: 'bg-primary/10 border-primary/20',
    description: 'This section has been enhanced with AI suggestions.',
  },
};

export function SectionHealthBadge({
  status,
  message,
  compact = false,
}: SectionHealthBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn("inline-flex", config.color)}>
              <Icon className="h-4 w-4" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-[200px]">
            <p className="font-medium">{config.label}</p>
            <p className="text-muted-foreground">{message || config.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0 h-5 gap-1 font-normal cursor-help",
              config.bgColor,
              config.color
            )}
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[200px]">
          <p>{message || config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Helper to determine section status based on analysis data
 */
export function getSectionStatus(
  sectionType: 'summary' | 'experience' | 'skills',
  fitScore: number,
  missingKeywordsCount: number,
  hasAIEnhancements: boolean
): SectionStatus {
  if (hasAIEnhancements) return 'ai-enhanced';
  
  switch (sectionType) {
    case 'summary':
      return fitScore >= 75 ? 'optimized' : fitScore >= 50 ? 'can-improve' : 'needs-attention';
    case 'experience':
      return fitScore >= 70 ? 'optimized' : fitScore >= 45 ? 'can-improve' : 'needs-attention';
    case 'skills':
      if (missingKeywordsCount === 0) return 'optimized';
      if (missingKeywordsCount <= 3) return 'can-improve';
      return 'needs-attention';
    default:
      return 'can-improve';
  }
}
