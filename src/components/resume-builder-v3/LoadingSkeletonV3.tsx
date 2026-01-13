// =====================================================
// LOADING SKELETON - Consistent loading states for V3
// =====================================================

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";

interface LoadingSkeletonV3Props {
  type: "analysis" | "standards" | "questions" | "generate";
  message?: string;
  onCancel?: () => void;
}

export function LoadingSkeletonV3({ type, message, onCancel }: LoadingSkeletonV3Props) {
  const defaultMessages = {
    analysis: "Analyzing your resume against the job description...",
    standards: "Researching industry standards and benchmarks...",
    questions: "Generating personalized interview questions...",
    generate: "Crafting your optimized resume...",
  };

  const displayMessage = message || defaultMessages[type];

  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-label={displayMessage}>
      {/* Loading header */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Processing</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {displayMessage}
        </p>
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="mt-4 text-muted-foreground hover:text-foreground"
            aria-label="Cancel operation"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        )}
      </div>

      {/* Skeleton content based on type */}
      {type === "analysis" && <AnalysisSkeleton />}
      {type === "standards" && <StandardsSkeleton />}
      {type === "questions" && <QuestionsSkeleton />}
      {type === "generate" && <GenerateSkeleton />}

      {/* Screen reader only live region for progress updates */}
      <span className="sr-only">{displayMessage}</span>
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-4">
      {/* Score card skeleton */}
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths/Gaps skeleton */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StandardsSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function QuestionsSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-24 w-full rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}

function GenerateSkeleton() {
  return (
    <div className="space-y-4">
      {/* Resume preview skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header */}
          <div className="text-center border-b pb-4">
            <Skeleton className="h-7 w-48 mx-auto mb-2" />
            <Skeleton className="h-5 w-32 mx-auto" />
          </div>
          
          {/* Summary */}
          <div>
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full mt-1" />
            <Skeleton className="h-3 w-2/3 mt-1" />
          </div>
          
          {/* Experience */}
          <div>
            <Skeleton className="h-4 w-24 mb-3" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full mt-1" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Skills */}
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-6 w-16 rounded-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
