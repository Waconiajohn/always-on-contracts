/**
 * Loading skeleton for resume generation
 */

import { Skeleton } from '@/components/ui/skeleton';

export function ResumeLoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Contact Info */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Sections */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
