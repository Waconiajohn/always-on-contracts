// =====================================================
// EXECUTIVE STRATEGY DASHBOARD - LEVEL SCORES HOOK
// =====================================================
// Derives 4 acceptance level scores from existing analysis data
// No new AI calls - pure frontend computation
// =====================================================

import { useMemo } from "react";
import { 
  FitAnalysisResult, 
  StandardsResult,
  LevelScores, 
  AcceptanceLevel,
  LevelStatus 
} from "@/types/resume-builder-v3";

interface UseLevelScoresProps {
  fitAnalysis: FitAnalysisResult | null;
  standards: StandardsResult | null;
}

const LEVEL_CONFIG: Record<AcceptanceLevel, { label: string; description: string }> = {
  ats: {
    label: "ATS Screening",
    description: "Will the algorithm pass you through?",
  },
  recruiter: {
    label: "Recruiter Review", 
    description: "Will someone pick up the phone?",
  },
  hiring_manager: {
    label: "Hiring Manager Fit",
    description: "Do you match what they're looking for?",
  },
  executive: {
    label: "Executive Positioning",
    description: "Are you positioned as a leader?",
  },
};

function getStatus(score: number): LevelStatus {
  if (score >= 80) return "passing";
  if (score >= 60) return "needs_work";
  return "critical";
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function useLevelScores({ fitAnalysis, standards }: UseLevelScoresProps): LevelScores | null {
  return useMemo(() => {
    if (!fitAnalysis) return null;

    // ===== LEVEL 1: ATS SCREENING =====
    // Keywords found vs missing (60%) + format compliance signals (40%)
    const totalKeywords = fitAnalysis.keywords_found.length + fitAnalysis.keywords_missing.length;
    const keywordRatio = totalKeywords > 0 
      ? fitAnalysis.keywords_found.length / totalKeywords 
      : 0.5;
    
    // Format compliance: assume good if we have a summary and reasonable gaps
    const formatScore = fitAnalysis.executive_summary.length > 50 ? 0.8 : 0.6;
    
    const atsScore = clamp((keywordRatio * 0.6 + formatScore * 0.4) * 100);
    
    const atsBlockers: string[] = [];
    if (fitAnalysis.keywords_missing.length > 3) {
      atsBlockers.push(`Missing ${fitAnalysis.keywords_missing.length} critical keywords`);
    }
    if (keywordRatio < 0.5) {
      atsBlockers.push("Keyword match rate below 50%");
    }

    const atsActions: string[] = [];
    if (fitAnalysis.keywords_missing.length > 0) {
      atsActions.push(`Add keywords: ${fitAnalysis.keywords_missing.slice(0, 3).join(", ")}`);
    }

    // ===== LEVEL 2: RECRUITER REVIEW =====
    // Strength count (50%) + summary quality (30%) + quick wins (20%)
    const strongStrengths = fitAnalysis.strengths.filter(s => s.strength_level === "strong").length;
    const totalStrengths = fitAnalysis.strengths.length;
    const strengthScore = totalStrengths > 0 
      ? Math.min(strongStrengths / 3, 1) // Cap at 3 strong strengths = 100%
      : 0.3;
    
    const summaryQuality = fitAnalysis.executive_summary.length > 100 ? 0.9 : 0.6;
    const quickWins = totalStrengths >= 2 ? 0.8 : 0.5;
    
    const recruiterScore = clamp((strengthScore * 0.5 + summaryQuality * 0.3 + quickWins * 0.2) * 100);
    
    const recruiterBlockers: string[] = [];
    if (strongStrengths < 2) {
      recruiterBlockers.push("Need more demonstrable strengths");
    }
    if (fitAnalysis.executive_summary.length < 100) {
      recruiterBlockers.push("Executive summary lacks impact");
    }

    const recruiterActions: string[] = [];
    if (strongStrengths < 3) {
      recruiterActions.push("Strengthen evidence for top skills");
    }

    // ===== LEVEL 3: HIRING MANAGER FIT =====
    // Gap severity (60%) + fit score (40%)
    const criticalGaps = fitAnalysis.gaps.filter(g => g.severity === "critical").length;
    const moderateGaps = fitAnalysis.gaps.filter(g => g.severity === "moderate").length;
    const gapPenalty = (criticalGaps * 15 + moderateGaps * 5);
    const gapScore = Math.max(0, 100 - gapPenalty);
    
    const fitScore = fitAnalysis.fit_score;
    
    const hiringManagerScore = clamp((gapScore * 0.6 + fitScore * 0.4) / 100 * 100);
    
    const hiringManagerBlockers: string[] = [];
    if (criticalGaps > 0) {
      hiringManagerBlockers.push(`${criticalGaps} critical gap${criticalGaps > 1 ? 's' : ''} to address`);
    }
    if (moderateGaps > 2) {
      hiringManagerBlockers.push(`${moderateGaps} moderate gaps identified`);
    }

    const hiringManagerActions: string[] = [];
    if (fitAnalysis.gaps.length > 0) {
      hiringManagerActions.push(`Address: ${fitAnalysis.gaps[0].requirement}`);
    }

    // ===== LEVEL 4: EXECUTIVE POSITIONING =====
    // Benchmarks (50%) + power phrases (30%) + metrics (20%)
    let executiveScore = 65; // Base score
    let benchmarkRatio = 0.5;
    let powerPhraseBonus = 0;
    let metricsBonus = 0;
    
    if (standards) {
      const exceedsCount = standards.benchmarks.filter(b => b.candidate_status === "exceeds").length;
      const meetsCount = standards.benchmarks.filter(b => b.candidate_status === "meets").length;
      const totalBenchmarks = standards.benchmarks.length;
      
      benchmarkRatio = totalBenchmarks > 0 
        ? (exceedsCount * 1.2 + meetsCount * 0.8) / totalBenchmarks
        : 0.5;
      
      powerPhraseBonus = Math.min(standards.power_phrases.length / 5, 1);
      metricsBonus = Math.min(standards.metrics_suggestions.length / 3, 1);
      
      executiveScore = clamp((benchmarkRatio * 0.5 + powerPhraseBonus * 0.3 + metricsBonus * 0.2) * 100);
    }

    const executiveBlockers: string[] = [];
    if (standards) {
      const belowCount = standards.benchmarks.filter(b => b.candidate_status === "below").length;
      if (belowCount > 0) {
        executiveBlockers.push(`${belowCount} benchmark${belowCount > 1 ? 's' : ''} below standard`);
      }
      if (standards.power_phrases.length < 3) {
        executiveBlockers.push("Lacking executive-level language");
      }
    } else {
      executiveBlockers.push("Complete interview to unlock executive insights");
    }

    const executiveActions: string[] = [];
    if (standards?.benchmarks.find(b => b.candidate_status === "below")) {
      const belowBenchmark = standards.benchmarks.find(b => b.candidate_status === "below");
      if (belowBenchmark?.recommendation) {
        executiveActions.push(belowBenchmark.recommendation);
      }
    }

    // Calculate overall score (weighted average)
    const overall = clamp(
      (atsScore * 0.2 + recruiterScore * 0.25 + hiringManagerScore * 0.3 + executiveScore * 0.25)
    );

    return {
      ats: {
        level: "ats" as AcceptanceLevel,
        score: atsScore,
        status: getStatus(atsScore),
        label: LEVEL_CONFIG.ats.label,
        description: LEVEL_CONFIG.ats.description,
        blockers: atsBlockers,
        actions: atsActions,
      },
      recruiter: {
        level: "recruiter" as AcceptanceLevel,
        score: recruiterScore,
        status: getStatus(recruiterScore),
        label: LEVEL_CONFIG.recruiter.label,
        description: LEVEL_CONFIG.recruiter.description,
        blockers: recruiterBlockers,
        actions: recruiterActions,
      },
      hiring_manager: {
        level: "hiring_manager" as AcceptanceLevel,
        score: hiringManagerScore,
        status: getStatus(hiringManagerScore),
        label: LEVEL_CONFIG.hiring_manager.label,
        description: LEVEL_CONFIG.hiring_manager.description,
        blockers: hiringManagerBlockers,
        actions: hiringManagerActions,
      },
      executive: {
        level: "executive" as AcceptanceLevel,
        score: executiveScore,
        status: getStatus(executiveScore),
        label: LEVEL_CONFIG.executive.label,
        description: LEVEL_CONFIG.executive.description,
        blockers: executiveBlockers,
        actions: executiveActions,
      },
      overall,
    };
  }, [fitAnalysis, standards]);
}
