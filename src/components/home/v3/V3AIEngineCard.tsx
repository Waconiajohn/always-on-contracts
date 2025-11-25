import { Brain, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export function V3AIEngineCard() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">Powered by Advanced AI</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your experience is powered by multiple AI models that analyze your vault in real-time to provide personalized guidance
          </p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className="bg-primary/5">
              Claude Sonnet 4 - Core Intelligence
            </Badge>
            <Badge variant="outline" className="bg-primary/5">
              Gemini 3.0 Pro - Strategic Analysis
            </Badge>
            <Badge variant="outline" className="bg-primary/5">
              Perplexity - Market Research
            </Badge>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronDown className="h-4 w-4" />
                Hide details
              </>
            ) : (
              <>
                <ChevronRight className="h-4 w-4" />
                How it works
              </>
            )}
          </button>
          
          {isExpanded && (
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">Claude Sonnet 4</span> powers the core intelligence of the platform, analyzing your career vault to extract insights, generate content, and provide strategic recommendations.
              </div>
              <div>
                <span className="font-medium text-foreground">Gemini 3.0 Pro</span> handles complex reasoning tasks, identifies strategic positioning opportunities, and generates executive-level insights from your experience.
              </div>
              <div>
                <span className="font-medium text-foreground">Perplexity</span> provides real-time market research, industry trends, and competitive intelligence to keep your career strategy current.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
