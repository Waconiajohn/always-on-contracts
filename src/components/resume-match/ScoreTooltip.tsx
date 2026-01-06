import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function ScoreTooltip() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="p-0.5 rounded-full hover:bg-muted transition-colors">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs text-xs">
          <div className="space-y-2">
            <p className="font-medium">How your score is calculated:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li><span className="font-medium text-foreground">60%</span> JD Keyword Match</li>
              <li><span className="font-medium text-foreground">20%</span> Industry Benchmark</li>
              <li><span className="font-medium text-foreground">12%</span> ATS Compliance</li>
              <li><span className="font-medium text-foreground">8%</span> Human Voice</li>
            </ul>
            <p className="text-muted-foreground pt-1 border-t border-border">
              Scores above 75% typically pass ATS screening. Aim for 85%+ for best results.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function KeywordTooltip({ type }: { type: 'hard' | 'soft' | 'education' }) {
  const descriptions = {
    hard: 'Technical skills, tools, programming languages, and certifications mentioned in the job description.',
    soft: 'Interpersonal skills like leadership, communication, teamwork, and problem-solving.',
    education: 'Degrees, certifications, and educational requirements from the job posting.'
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {descriptions[type]}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
