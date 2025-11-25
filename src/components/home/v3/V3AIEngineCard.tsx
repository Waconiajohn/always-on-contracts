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
          <h3 className="text-lg font-semibold mb-2">AI Intelligence Engine</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your homepage is powered by 3 AI models that analyze your vault in real-time to provide personalized guidance
          </p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className="bg-primary/5">
              Gemini 3.0 Pro - Strategic Analysis
            </Badge>
            <Badge variant="outline" className="bg-primary/5">
              Gemini 2.5 Flash - Daily Recommendations
            </Badge>
            <Badge variant="outline" className="bg-primary/5">
              GPT-5 - Job Matching
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
                <span className="font-medium text-foreground">Gemini 3.0 Pro</span> analyzes your entire career vault to identify strategic positioning opportunities and generates executive-level insights.
              </div>
              <div>
                <span className="font-medium text-foreground">Gemini 2.5 Flash</span> provides real-time recommendations for daily actions, analyzes application timing, and suggests optimal follow-up moments.
              </div>
              <div>
                <span className="font-medium text-foreground">GPT-5</span> matches your vault profile against job requirements, generates tailored resumes, and predicts interview success probability.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
