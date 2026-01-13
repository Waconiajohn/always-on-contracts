// =====================================================
// ERROR BOUNDARY - Catches and displays errors gracefully
// =====================================================

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logger } from "@/lib/logger";

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

// Store errors for debugging (max 10)
const errorLog: Array<{ id: string; error: Error; timestamp: Date; componentStack?: string }> = [];
const MAX_ERROR_LOG = 10;

function storeError(error: Error, componentStack?: string): string {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  errorLog.unshift({ id: errorId, error, timestamp: new Date(), componentStack });
  if (errorLog.length > MAX_ERROR_LOG) {
    errorLog.pop();
  }
  // Persist to localStorage for debugging
  try {
    localStorage.setItem('resume-builder-errors', JSON.stringify(
      errorLog.map(e => ({ id: e.id, message: e.error.message, timestamp: e.timestamp.toISOString() }))
    ));
  } catch {
    // Ignore storage errors
  }
  return errorId;
}

export class ResumeBuilderErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = storeError(error, errorInfo.componentStack ?? undefined);
    this.setState({ errorId });
    logger.error("Resume Builder Error:", { error: error.message, errorId, componentStack: errorInfo.componentStack });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto p-6">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                An error occurred while processing your resume. Don't worry - your
                data is likely still saved.
              </p>

              {this.state.error && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-mono text-destructive">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button onClick={this.handleReset} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
                {this.state.errorId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(`Error ID: ${this.state.errorId}\nMessage: ${this.state.error?.message}`);
                        // Dynamic import to work with class component
                        const { toast } = await import('sonner');
                        toast.success("Error ID copied to clipboard");
                      } catch {
                        const { toast } = await import('sonner');
                        toast.error("Failed to copy to clipboard");
                      }
                    }}
                  >
                    <Bug className="h-3 w-3 mr-1" />
                    Copy Error ID
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
