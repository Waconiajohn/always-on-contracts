import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";

export const BenchmarkSetupCard = () => {
  return (
    <Card className="border-primary/30">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-4 py-8">
          <div className="relative">
            <Sparkles className="h-12 w-12 text-primary animate-pulse" />
            <Loader2 className="h-6 w-6 text-primary/50 animate-spin absolute -bottom-2 -right-2" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Setting Your Benchmark Standard</h2>
            <p className="text-muted-foreground">
              AI is analyzing your role, level, and industry to create your personalized benchmark...
            </p>
          </div>
          <div className="w-full max-w-md space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Analyzing target roles</span>
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Evaluating current vault</span>
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Generating personalized targets</span>
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">This takes 30-60 seconds</p>
        </div>
      </CardContent>
    </Card>
  );
};