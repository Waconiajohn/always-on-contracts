/**
 * Shared utilities for resume section type mapping and validation
 * Centralizes section name/type conversions between UI and API
 */
import type { 
  RBEvidence, 
  EvidenceCategory, 
  EvidenceSource, 
  EvidenceConfidence,
  SpanLocation 
} from '@/types/resume-builder';

export type APISectionType = 'summary' | 'skills' | 'experience_bullets' | 'education';
export type UISectionName = 'summary' | 'skills' | 'experience' | 'education';

/**
 * Partial evidence shape from database before type casting
 * Used when fetching evidence from Supabase
 */
export interface PartialEvidence {
  id: string;
  claim_text: string;
  evidence_quote: string | null;
  source: string;
  category: string;
  confidence: string;
  is_active: boolean;
  project_id: string;
  span_location: unknown;
  created_at: string;
}

/**
 * Safe type mapping function for RBEvidence
 * Properly casts database results to typed RBEvidence objects
 */
export function mapToRBEvidence(data: PartialEvidence[]): RBEvidence[] {
  return data.map(item => ({
    id: item.id,
    project_id: item.project_id,
    claim_text: item.claim_text,
    evidence_quote: item.evidence_quote || item.claim_text,
    category: item.category as EvidenceCategory,
    source: item.source as EvidenceSource,
    confidence: item.confidence as EvidenceConfidence,
    span_location: item.span_location as SpanLocation | null,
    is_active: item.is_active,
    created_at: item.created_at,
  }));
}

/**
 * Maps UI section names to API section_type values
 * UI uses 'experience' but API expects 'experience_bullets'
 */
export function mapUISectionToAPIType(name: string): APISectionType {
  if (name === 'experience') return 'experience_bullets';
  if (name === 'summary' || name === 'skills' || name === 'education') {
    return name;
  }
  // Default fallback for unknown sections
  return 'summary';
}

/**
 * Maps API section_type back to UI section name
 */
export function mapAPITypeToUISection(type: APISectionType): UISectionName {
  if (type === 'experience_bullets') return 'experience';
  return type;
}

/**
 * Evidence categories relevant to each section type
 * Used for filtering evidence in personalization
 * Note: Also defined in rb-generate-personalized-section edge function for backend use
 */
export const SECTION_EVIDENCE_CATEGORIES: Record<APISectionType, string[]> = {
  summary: ['skill', 'domain', 'leadership', 'metric', 'responsibility'],
  skills: ['skill', 'tool', 'domain', 'metric'],
  experience_bullets: ['responsibility', 'metric', 'leadership', 'skill', 'tool'],
  education: ['domain', 'skill'],
};

/**
 * Get relevant evidence categories for a section type
 */
export function getRelevantCategories(sectionType: APISectionType): string[] {
  return SECTION_EVIDENCE_CATEGORIES[sectionType] || [];
}
