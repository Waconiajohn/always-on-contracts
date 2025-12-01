/**
 * Type Adapters for V4 Resume Builder
 * 
 * These functions transform existing API responses into the types
 * expected by the V4 builder components.
 */

import type {
  JobBlueprint,
  GapAnalysis,
  BulletSuggestion,
  HiringManagerPriority,
  ResumeStructureSection,
} from "@/components/resume-builder/v4/types/builderV2Types";

/**
 * Transform score-resume-match response to JobBlueprint
 */
export function transformScoreToBlueprint(scoreData: any): JobBlueprint {
  const priorities: HiringManagerPriority[] = (scoreData.priorityFixes || [])
    .slice(0, 3)
    .map((fix: any, i: number) => ({
      id: `priority-${i}`,
      category: fix.category || "technical",
      requirement: fix.issue || fix.fix || "",
      why: fix.details || "",
      howToAddress: fix.fix || "",
      priority: fix.priority || 1,
    }));

  const structure: ResumeStructureSection[] = [
    {
      section: "summary",
      recommendedBullets: 0,
      focus: "3-4 sentence overview highlighting your key strengths",
      keywordsToInclude: [],
    },
    {
      section: "experience",
      recommendedBullets: 5,
      focus: "Most recent 3-5 positions with quantified achievements",
      keywordsToInclude: [],
    },
    {
      section: "skills",
      recommendedBullets: 10,
      focus: "Technical and soft skills relevant to the role",
      keywordsToInclude: [],
    },
  ];

  return {
    inferredIndustry: scoreData.detected?.industry || "General",
    inferredRoleFamily: scoreData.detected?.role || "Target Role",
    inferredSeniority: (scoreData.detected?.level?.toLowerCase() || "mid") as any,
    roleSummary: "Focus on quantifiable achievements and technical depth",
    competencies: (scoreData.breakdown?.strengths || []).map((s: any) => ({
      skill: s.description || String(s),
      category: 'required' as const,
      type: 'technical' as const,
    })),
    mustHaves: [],
    hiringManagerPriorities: priorities,
    dealBreakers: [],
    resumeStructure: structure,
    atsKeywords: {
      critical: scoreData.missingKeywords?.slice(0, 5) || [],
      important: scoreData.missingKeywords?.slice(5, 15) || [],
      bonus: [],
    },
  };
}

/**
 * Transform gaps from score data to V4 GapAnalysis format
 */
export function transformGapsToV4(scoreData: any): GapAnalysis[] {
  return (scoreData.priorityFixes || []).map((fix: any, i: number) => {
    // Map category to valid GapType
    let gapType: 'missing_skill_or_tool' | 'weak_achievement_story' | 'missing_metrics_or_scope' | 'missing_domain_experience' | 'unclear_level_or_seniority' | 'positioning_issue' = 'missing_skill_or_tool';
    
    if (fix.category === 'technical') {
      gapType = 'missing_skill_or_tool';
    } else if (fix.category === 'experience') {
      gapType = 'missing_domain_experience';
    } else if (fix.category === 'achievement') {
      gapType = 'weak_achievement_story';
    } else if (fix.category === 'metrics') {
      gapType = 'missing_metrics_or_scope';
    } else if (fix.category === 'level') {
      gapType = 'unclear_level_or_seniority';
    } else {
      gapType = 'positioning_issue';
    }

    return {
      id: `gap-${i}`,
      gapType,
      severity: fix.priority === 1 ? "critical" : fix.priority === 2 ? "important" : "nice-to-have",
      title: fix.issue || fix.fix || "",
      relatedCompetencies: [],
      relatedResumeSections: [],
      currentStateSnapshot: fix.currentState || "",
      targetState: fix.targetState || fix.fix || "",
      whyItMatters: fix.details || "",
    };
  });
}

/**
 * Transform edge function bullet response to V4 BulletSuggestion format
 */
export function transformBulletsToV4(
  edgeFunctionResponse: any,
  section: string
): BulletSuggestion[] {
  // Handle both old format (with DRAFT markers) and new format (clean JSON)
  const bullets = edgeFunctionResponse.personalizedVersion?.bullets || 
                  edgeFunctionResponse.bullets || 
                  [];

  return bullets.map((bullet: any, i: number) => {
    // Clean up old format if it has DRAFT markers
    let bulletText = bullet.text || bullet.content || String(bullet);
    
    // Remove "- DRAFT - verify this matches your actual experience:" prefix
    bulletText = bulletText.replace(/^[-•]\s*DRAFT\s*-\s*verify this matches your actual experience:\s*/i, '');
    
    // Remove "(Based on: ...)" suffix
    bulletText = bulletText.replace(/\s*\(Based on:.*?\)\s*$/i, '');

    return {
      id: `${section}-bullet-${i}`,
      originalText: bullet.originalText || '',
      suggestedText: bulletText.trim(),
      editedText: undefined,
      status: 'pending',
      confidence: bullet.confidence || 'high',
      whyThisHelps: bullet.whyThisHelps || bullet.why || '',
      supports: bullet.supports || [],
      sourceBasis: bullet.sourceBasis || bullet.source || '',
      interviewQuestions: bullet.interviewQuestions || [],
      order: i,
    };
  });
}

/**
 * Clean bullet text by removing DRAFT markers and source attributions
 */
export function cleanBulletText(text: string): string {
  let cleaned = text;
  
  // Remove DRAFT prefix
  cleaned = cleaned.replace(/^[-•]\s*DRAFT\s*-\s*verify this matches your actual experience:\s*/i, '');
  
  // Remove (Based on: ...) suffix
  cleaned = cleaned.replace(/\s*\(Based on:.*?\)\s*$/i, '');
  
  return cleaned.trim();
}
