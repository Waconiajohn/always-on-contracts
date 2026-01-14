import { useState, useCallback } from "react";
import { EnrichmentSuggestion } from "@/types/master-resume";
import { OptimizedResume } from "@/types/resume-builder-v3";

/**
 * Hook for generating enrichment suggestions by comparing
 * an optimized resume against the master resume content.
 */
export function useEnrichment() {
  const [suggestions, setSuggestions] = useState<EnrichmentSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  /**
   * Compare optimized resume to master resume and generate suggestions
   * for new content that could be added to the master.
   */
  const generateSuggestions = useCallback(
    (optimizedResume: OptimizedResume, masterResumeContent: string): EnrichmentSuggestion[] => {
      if (!masterResumeContent || !optimizedResume) return [];

      setIsAnalyzing(true);
      const newSuggestions: EnrichmentSuggestion[] = [];
      const masterLower = masterResumeContent.toLowerCase();

      // Check experience bullets for new content
      optimizedResume.experience.forEach((exp) => {
        exp.bullets.forEach((bullet) => {
          // Check if this bullet content exists in master resume
          const bulletLower = bullet.toLowerCase();
          // Use a fuzzy match - check if significant portion exists
          const significantWords = bulletLower
            .split(/\s+/)
            .filter((w) => w.length > 4)
            .slice(0, 5);

          const matchCount = significantWords.filter((word) =>
            masterLower.includes(word)
          ).length;

          // If less than 60% of significant words match, it's likely new content
          if (significantWords.length > 0 && matchCount / significantWords.length < 0.6) {
            newSuggestions.push({
              type: "bullet",
              content: bullet,
              sourceContext: `${exp.title} at ${exp.company}`,
              confidence: 0.8,
            });
          }
        });
      });

      // Check for new skills
      optimizedResume.skills.forEach((skill) => {
        if (!masterLower.includes(skill.toLowerCase())) {
          newSuggestions.push({
            type: "skill",
            content: skill,
            confidence: 0.9,
          });
        }
      });

      // Limit suggestions to avoid overwhelming the user
      const limitedSuggestions = newSuggestions.slice(0, 10);
      setSuggestions(limitedSuggestions);
      setIsAnalyzing(false);

      return limitedSuggestions;
    },
    []
  );

  /**
   * Format selected suggestions into text that can be appended to master resume
   */
  const formatSuggestionsForEnrichment = useCallback(
    (selectedSuggestions: EnrichmentSuggestion[]): string => {
      if (selectedSuggestions.length === 0) return "";

      const bullets = selectedSuggestions.filter((s) => s.type === "bullet");
      const skills = selectedSuggestions.filter((s) => s.type === "skill");
      const achievements = selectedSuggestions.filter((s) => s.type === "achievement");

      let content = "\n--- Added from Resume Builder ---\n";

      if (bullets.length > 0) {
        content += "\nExperience Highlights:\n";
        bullets.forEach((b) => {
          content += `• ${b.content}\n`;
          if (b.sourceContext) {
            content += `  (From: ${b.sourceContext})\n`;
          }
        });
      }

      if (skills.length > 0) {
        content += "\nAdditional Skills:\n";
        content += skills.map((s) => s.content).join(", ") + "\n";
      }

      if (achievements.length > 0) {
        content += "\nAchievements:\n";
        achievements.forEach((a) => {
          content += `• ${a.content}\n`;
        });
      }

      return content;
    },
    []
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    isAnalyzing,
    generateSuggestions,
    formatSuggestionsForEnrichment,
    clearSuggestions,
  };
}
