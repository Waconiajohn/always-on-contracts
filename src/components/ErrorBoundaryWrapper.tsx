import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
}

export function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Caught error:', error);
      
      // Check for rate limit errors (429)
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        toast({
          title: "Rate Limit Exceeded",
          description: "Too many requests. Please wait a moment and try again.",
          variant: "destructive",
        });
        return;
      }

      // Check for payment required errors (402)
      if (error.message?.includes('402') || error.message?.includes('payment required')) {
        toast({
          title: "Credits Required",
          description: "Please add credits to your workspace to continue using AI features.",
          variant: "destructive",
        });
        return;
      }

      // Generic error
      toast({
        title: "Something went wrong",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [toast]);

  return <>{children}</>;
}
