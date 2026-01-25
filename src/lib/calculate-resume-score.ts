/**
 * Client-side deterministic scoring utility
 * Calculates resume match score based on keyword decisions and requirement coverage
 */

import type { RBEvidence, RBKeywordDecision, RBJDRequirement } from '@/types/resume-builder';

interface ScoringInput {
  keywordDecisions: RBKeywordDecision[];
  jdRequirements: RBJDRequirement[];
  evidence: RBEvidence[];
  currentContent: string;
}

interface ScoringResult {
  score: number;
  breakdown: {
    keywordScore: number;
    requirementScore: number;
    evidenceScore: number;
  };
  details: {
    matchedKeywords: number;
    totalKeywords: number;
    metRequirements: number;
    totalRequirements: number;
    verifiedClaims: number;
    totalClaims: number;
  };
}

/**
 * Normalize text for comparison - lowercase, remove punctuation, collapse whitespace
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if content contains a keyword (with word boundary awareness)
 */
function contentContainsKeyword(content: string, keyword: string): boolean {
  const normalizedContent = normalizeText(content);
  const normalizedKeyword = normalizeText(keyword);
  
  // Create word-boundary-aware regex
  const pattern = new RegExp(`\\b${normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return pattern.test(normalizedContent);
}

/**
 * Calculate keyword coverage score (0-100)
 * Based on approved keywords that appear in content
 */
function calculateKeywordScore(
  keywordDecisions: RBKeywordDecision[],
  content: string
): { score: number; matched: number; total: number } {
  // Only consider keywords marked for addition (not 'not_true' or 'ignore')
  const approvedKeywords = keywordDecisions.filter(kd => kd.decision === 'add');
  
  if (approvedKeywords.length === 0) {
    return { score: 100, matched: 0, total: 0 };
  }
  
  let matchedCount = 0;
  for (const kd of approvedKeywords) {
    if (contentContainsKeyword(content, kd.keyword)) {
      matchedCount++;
    }
  }
  
  const score = Math.round((matchedCount / approvedKeywords.length) * 100);
  return { score, matched: matchedCount, total: approvedKeywords.length };
}

/**
 * Calculate requirement coverage score (0-100)
 * Based on evidence matching requirements with weighted importance
 */
function calculateRequirementScore(
  jdRequirements: RBJDRequirement[],
  evidence: RBEvidence[],
  content: string
): { score: number; met: number; total: number } {
  if (jdRequirements.length === 0) {
    return { score: 100, met: 0, total: 0 };
  }
  
  let totalWeight = 0;
  let earnedWeight = 0;
  let metCount = 0;
  
  for (const req of jdRequirements) {
    // Use category weight mapping for JD requirement categories
    const categoryToWeight: Record<string, number> = {
      hard_skill: 3,
      tool: 2,
      domain: 2,
      responsibility: 3,
      outcome: 2,
      education: 2,
      title: 1,
      soft_skill: 1,
    };
    const weight = categoryToWeight[req.category] || 1;
    totalWeight += weight;
    
    // Check if requirement is met by evidence or content
    const reqText = normalizeText(req.text);
    
    // Check evidence claims
    const hasEvidenceMatch = evidence.some(e => {
      const claimText = normalizeText(e.claim_text);
      return claimText.includes(reqText) || reqText.includes(claimText);
    });
    
    // Check content directly for keywords
    const hasContentMatch = reqText.split(' ').filter(w => w.length > 3).some(word => 
      contentContainsKeyword(content, word)
    );
    
    if (hasEvidenceMatch || hasContentMatch) {
      earnedWeight += weight;
      metCount++;
    }
  }
  
  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 100;
  return { score, met: metCount, total: jdRequirements.length };
}

/**
 * Calculate evidence strength score (0-100)
 * Based on confidence levels of active evidence
 */
function calculateEvidenceScore(
  evidence: RBEvidence[]
): { score: number; verified: number; total: number } {
  const activeEvidence = evidence.filter(e => e.is_active);
  
  if (activeEvidence.length === 0) {
    return { score: 50, verified: 0, total: 0 }; // Neutral when no evidence
  }
  
  // High confidence = full points, medium = 0.7, low = 0.4
  const confidenceWeights: Record<string, number> = {
    high: 1.0,
    medium: 0.7,
    low: 0.4,
  };
  
  let totalPoints = 0;
  let verifiedCount = 0;
  
  for (const e of activeEvidence) {
    const weight = confidenceWeights[e.confidence] || 0.5;
    totalPoints += weight;
    if (e.confidence === 'high' || e.confidence === 'medium') {
      verifiedCount++;
    }
  }
  
  const maxPossible = activeEvidence.length;
  const score = maxPossible > 0 ? Math.round((totalPoints / maxPossible) * 100) : 50;
  
  return { score, verified: verifiedCount, total: activeEvidence.length };
}

/**
 * Calculate overall resume match score
 * Weighted combination of keyword, requirement, and evidence scores
 */
export function calculateResumeScore(input: ScoringInput): ScoringResult {
  const { keywordDecisions, jdRequirements, evidence, currentContent } = input;
  
  const keywordResult = calculateKeywordScore(keywordDecisions, currentContent);
  const requirementResult = calculateRequirementScore(jdRequirements, evidence, currentContent);
  const evidenceResult = calculateEvidenceScore(evidence);
  
  // Weighted average: Keywords 30%, Requirements 50%, Evidence 20%
  const overallScore = Math.round(
    keywordResult.score * 0.30 +
    requirementResult.score * 0.50 +
    evidenceResult.score * 0.20
  );
  
  return {
    score: Math.max(0, Math.min(100, overallScore)),
    breakdown: {
      keywordScore: keywordResult.score,
      requirementScore: requirementResult.score,
      evidenceScore: evidenceResult.score,
    },
    details: {
      matchedKeywords: keywordResult.matched,
      totalKeywords: keywordResult.total,
      metRequirements: requirementResult.met,
      totalRequirements: requirementResult.total,
      verifiedClaims: evidenceResult.verified,
      totalClaims: evidenceResult.total,
    },
  };
}

/**
 * Quick score check for a single content update
 * Lighter weight version for real-time feedback
 */
export function quickScoreCheck(
  content: string,
  targetKeywords: string[]
): { matchedCount: number; matchPercentage: number } {
  if (targetKeywords.length === 0) {
    return { matchedCount: 0, matchPercentage: 100 };
  }
  
  let matched = 0;
  for (const keyword of targetKeywords) {
    if (contentContainsKeyword(content, keyword)) {
      matched++;
    }
  }
  
  return {
    matchedCount: matched,
    matchPercentage: Math.round((matched / targetKeywords.length) * 100),
  };
}
