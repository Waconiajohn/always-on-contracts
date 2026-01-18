/**
 * SkillsSuggester - Suggests missing skills from job description
 * Allows one-click addition of recommended skills
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Plus, 
  Loader2,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SuggestedSkill {
  skill: string;
  relevance: 'critical' | 'high' | 'medium';
  reason: string;
}

interface SkillsSuggesterProps {
  currentSkills: string[];
  jobDescription: string;
  onSkillAdd: (skill: string) => void;
}

export function SkillsSuggester({
  currentSkills,
  jobDescription,
  onSkillAdd,
}: SkillsSuggesterProps) {
  const [suggestions, setSuggestions] = useState<SuggestedSkill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [addedSkills, setAddedSkills] = useState<Set<string>>(new Set());
  const [hasFetched, setHasFetched] = useState(false);

  // Fetch suggestions when expanded for the first time
  useEffect(() => {
    if (isExpanded && !hasFetched && !isLoading) {
      fetchSuggestions();
    }
  }, [isExpanded, hasFetched]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-keywords', {
        body: {
          currentSkills,
          jobDescription,
          type: 'skills',
        },
      });

      if (error) throw error;

      if (data?.suggestions) {
        // Filter out skills already in resume
        const currentSkillsLower = new Set(currentSkills.map(s => s.toLowerCase()));
        const filteredSuggestions = (data.suggestions as SuggestedSkill[]).filter(
          s => !currentSkillsLower.has(s.skill.toLowerCase())
        );
        setSuggestions(filteredSuggestions);
      }
      setHasFetched(true);
    } catch (error) {
      console.error('Failed to fetch skill suggestions:', error);
      toast.error('Failed to fetch suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSkill = (skill: string) => {
    onSkillAdd(skill);
    setAddedSkills(prev => new Set([...prev, skill]));
    toast.success(`Added "${skill}" to skills`);
  };

  const pendingSuggestions = suggestions.filter(s => !addedSkills.has(s.skill));
  const criticalCount = pendingSuggestions.filter(s => s.relevance === 'critical').length;

  // Don't render if no job description
  if (!jobDescription) return null;

  return (
    <div className="mt-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "h-7 px-2 text-xs gap-1.5",
          criticalCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
        )}
      >
        <Lightbulb className="h-3.5 w-3.5" />
        {isLoading ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Finding suggestions...
          </>
        ) : hasFetched ? (
          pendingSuggestions.length > 0 ? (
            <>
              {pendingSuggestions.length} skill suggestion{pendingSuggestions.length !== 1 ? 's' : ''}
              {criticalCount > 0 && (
                <Badge variant="destructive" className="h-4 text-[10px] px-1.5 ml-1">
                  {criticalCount} critical
                </Badge>
              )}
            </>
          ) : (
            "Skills look complete!"
          )
        ) : (
          "Find missing skills"
        )}
        {isExpanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </Button>

      {isExpanded && (
        <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing job description for missing skills...
            </div>
          ) : pendingSuggestions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Click to add skills mentioned in the job description:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {pendingSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.skill}
                    onClick={() => handleAddSkill(suggestion.skill)}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                      "border hover:bg-accent",
                      suggestion.relevance === 'critical' 
                        ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30" 
                        : suggestion.relevance === 'high'
                        ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30"
                        : "border-border bg-muted/30"
                    )}
                    title={suggestion.reason}
                  >
                    <Plus className="h-3 w-3" />
                    {suggestion.skill}
                    {suggestion.relevance === 'critical' && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 ml-0.5">★</span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                ★ = Critical skills explicitly required in job posting
              </p>
            </div>
          ) : addedSkills.size > 0 ? (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 py-2">
              <Check className="h-4 w-4" />
              All suggested skills have been added!
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">
              Your skills section looks well-aligned with this job posting.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
