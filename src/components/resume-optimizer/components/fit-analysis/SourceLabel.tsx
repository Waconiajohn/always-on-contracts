import { EvidenceSource, RecencyStatus } from '../../types';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SourceLabelProps {
  source?: EvidenceSource;
  recencyStatus?: RecencyStatus;
  compact?: boolean;
}

const RECENCY_CONFIG: Record<RecencyStatus, { icon: string; label: string; className: string }> = {
  recent: { icon: '🟢', label: 'Recent', className: 'text-emerald-600' },
  dated: { icon: '🟡', label: '5-10 yrs ago', className: 'text-amber-600' },
  stale: { icon: '🔴', label: '10+ yrs ago', className: 'text-red-600' }
};

export function SourceLabel({ source, recencyStatus, compact = false }: SourceLabelProps) {
  if (!source) return null;
  
  const recencyInfo = recencyStatus ? RECENCY_CONFIG[recencyStatus] : null;
  
  if (compact) {
    return (
      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        <span>{source.company}</span>
        {recencyInfo && (
          <span className={cn("ml-1", recencyInfo.className)}>
            {recencyInfo.icon}
          </span>
        )}
      </span>
    );
  }
  
  return (
    <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
      <MapPin className="h-3 w-3 flex-shrink-0" />
      <span className="font-medium">{source.jobTitle}</span>
      <span>at</span>
      <span>{source.company}</span>
      {source.dateRange && (
        <span className="text-muted-foreground/70">({source.dateRange})</span>
      )}
      {recencyInfo && (
        <span className={cn("flex items-center gap-1", recencyInfo.className)}>
          <span>{recencyInfo.icon}</span>
          <span>{recencyInfo.label}</span>
        </span>
      )}
    </div>
  );
}
