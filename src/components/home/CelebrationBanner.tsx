import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, X } from "lucide-react";

interface CelebrationBannerProps {
  onDismiss: () => void;
}

export const CelebrationBanner = ({ onDismiss }: CelebrationBannerProps) => {
  return (
    <Card className="relative p-8 mb-6 bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20 animate-fade-in overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.1),transparent_50%)]" />
      
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 h-8 w-8"
        onClick={onDismiss}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="relative flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-semibold">Your Master Resume is Complete!</h2>
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </div>
          
          <p className="text-muted-foreground mb-6 max-w-2xl">
            You've built a comprehensive career intelligence system. Now it's time to put it to work 
            and start landing opportunities that match your experience.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={onDismiss}>
              Start Job Search
            </Button>
            <Button size="lg" variant="outline" onClick={onDismiss}>
              Build Custom Resume
            </Button>
            <Button size="lg" variant="outline" onClick={onDismiss}>
              Explore AI Agents
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
