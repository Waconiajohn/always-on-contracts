/**
 * Contextual help tooltips for Resume Builder
 * Provides inline help without intrusive onboarding flows
 */

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, Info, Lightbulb } from "lucide-react";

interface HelpTooltipProps {
  content: string;
  icon?: 'help' | 'info' | 'tip';
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const HelpTooltip = ({
  content,
  icon = 'help',
  side = 'top',
  className = ""
}: HelpTooltipProps) => {
  const IconComponent = icon === 'help' ? HelpCircle
    : icon === 'info' ? Info
    : Lightbulb;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-muted transition-colors ${className}`}
            onClick={(e) => e.preventDefault()}
          >
            <IconComponent className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-xs text-sm"
        >
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Pre-built tooltips for common resume builder concepts
export const TooltipHelp = {
  ResumeSelection: () => (
    <HelpTooltip
      content="We've pre-selected your best resume items for this job (≥50% match). Review and uncheck any that don't apply to this specific position. The AI will use checked items to personalize your resume."
      icon="help"
    />
  ),

  IdealVersion: () => (
    <HelpTooltip
      content="This is an industry-standard example based on research of 20+ similar job postings. It shows what top performers include in their resumes."
      icon="info"
    />
  ),

  PersonalizedVersion: () => (
    <HelpTooltip
      content="This version uses your Master Resume data to personalize the industry-standard structure with your unique accomplishments."
      icon="info"
    />
  ),

  ResumeStrength: () => (
    <HelpTooltip
      content="Resume Strength shows how complete your Master Resume data is. Higher strength means better personalization. Complete your Master Resume for best results."
      icon="help"
    />
  ),

  ATSMatch: () => (
    <HelpTooltip
      content="ATS Match Score shows how well your content matches keywords from the job description. Aim for 75-85% for optimal results."
      icon="info"
    />
  ),

  DualGeneration: () => (
    <HelpTooltip
      content="We generate both an 'ideal' industry-standard example and a personalized version. Compare them side-by-side to choose the best content."
      icon="tip"
    />
  ),

  ResearchProcess: () => (
    <HelpTooltip
      content="Our AI researches 20+ similar job postings to understand industry standards, key terminology, and what top performers emphasize in their resumes."
      icon="info"
    />
  ),

  EditingContent: () => (
    <HelpTooltip
      content="You can edit any AI-generated content before approving it. Feel free to blend elements from both versions or add your own touch."
      icon="tip"
    />
  ),

  SectionGuidance: () => (
    <HelpTooltip
      content="AI suggestions are based on CPRW (Certified Professional Resume Writer) methodology and tailored to the specific job requirements."
      icon="info"
    />
  ),
};
