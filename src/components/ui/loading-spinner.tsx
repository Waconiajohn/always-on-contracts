import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function LoadingSpinner({ 
  message = "Loading...", 
  size = "md",
  className 
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-8", className)}>
      <Loader2 
        className={cn(
          "animate-spin text-primary mb-3",
          sizeClasses[size]
        )} 
      />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
