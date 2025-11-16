// src/lib/atsTypes.ts

export type KeywordPriority = "must_have" | "nice_to_have" | "industry_standard";

export interface AtsKeyword {
  phrase: string;
  priority: KeywordPriority;
  /**
   * How important this keyword is for this specific JD,
   * 0–100, where 100 = critical.
   */
  importanceScore: number;
}

export interface SectionCoverage {
  sectionId: string;
  sectionHeading: string;
  coverageScore: number; // 0–100
  matchedKeywords: AtsKeyword[];
  missingKeywords: AtsKeyword[];
}

export interface AtsScoreSummary {
  overallScore: number;          // 0–100
  mustHaveCoverage: number;      // % of must-have terms hit
  niceToHaveCoverage: number;    // % of nice-to-have terms hit
  industryCoverage: number;      // % of industry-standard patterns hit
}

export interface AtsScoreData {
  summary: AtsScoreSummary;
  perSection: SectionCoverage[];
  allMatchedKeywords: AtsKeyword[];
  allMissingKeywords: AtsKeyword[];
  /**
   * Optional: short narrative summary to show in UI.
   */
  narrative?: string;
}
