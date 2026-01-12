// =====================================================
// HELP TOOLTIP COMPONENT
// =====================================================
// Contextual help for complex features

import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  iconClassName?: string;
}

export function HelpTooltip({ 
  content, 
  side = "top", 
  className,
  iconClassName 
}: HelpTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full p-0.5",
              "text-muted-foreground hover:text-foreground transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              className
            )}
            aria-label="Help"
          >
            <HelpCircle className={cn("h-4 w-4", iconClassName)} />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className="max-w-[280px] text-sm"
          sideOffset={8}
        >
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Pre-defined help content for consistency
export const HELP_CONTENT = {
  // Upload Step
  resumeInput: "Paste your current resume text. We'll analyze it against the job requirements and suggest improvements.",
  jobDescription: "Paste the full job posting. Include requirements, qualifications, and responsibilities for best results.",
  characterLimit: "Keep within the limit for accurate analysis. If too long, focus on the most relevant sections.",
  
  // Fit Analysis
  fitScore: "Measures how well your resume matches the job requirements. Higher is better, but 100% isn't always necessary.",
  strengths: "These are requirements you already demonstrate well. We'll preserve these in your optimized resume.",
  gaps: "Areas where your resume could better address job requirements. We'll help fill these gaps.",
  keywords: "Important terms from the job posting. Including these helps with ATS screening.",
  
  // Standards
  benchmarks: "Industry standards for your target role. Meeting these makes you competitive with other candidates.",
  industryKeywords: "Terms commonly used in your industry. These signal expertise to recruiters.",
  powerPhrases: "Action-oriented language that demonstrates impact. We'll incorporate these into your bullets.",
  
  // Interview
  questionPriority: "High priority questions address critical gaps. Answer these first for maximum impact.",
  exampleAnswer: "A sample response to guide you. Focus on specific numbers, outcomes, and relevant experience.",
  
  // Generate
  atsScore: "Applicant Tracking System score. Higher scores mean better chances of passing automated screening.",
  improvements: "Changes made to optimize your resume. Each improvement addresses a gap or adds value.",
  
  // Version Compare
  compareVersions: "Compare different versions of your resume to see what changed between optimizations.",
} as const;
