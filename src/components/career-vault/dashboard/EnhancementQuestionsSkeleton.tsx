import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for Enhancement Questions Modal
 * Matches the actual question layout for better perceived performance
 */
export function EnhancementQuestionsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Marketing Alert Skeleton */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="p-4">
          <div className="flex gap-3">
            <Skeleton className="h-4 w-4 flex-shrink-0 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        </div>
      </Card>

      {/* Progress Bar Skeleton */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </Card>

      {/* Batch Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* Question Cards Skeleton */}
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-2">
          <div className="p-6 space-y-4">
            {/* Question Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>

            {/* Why It Matters */}
            <Card className="bg-blue-50/50 border-blue-200">
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </Card>

            {/* Input Area */}
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </Card>
      ))}

      {/* Navigation Skeleton */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Skeleton className="h-10 w-32 rounded-md" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  );
}
