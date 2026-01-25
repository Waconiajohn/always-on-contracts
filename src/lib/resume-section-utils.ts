/**
 * Shared utilities for resume section type mapping and validation
 * Centralizes section name/type conversions between UI and API
 */

export type APISectionType = 'summary' | 'skills' | 'experience_bullets' | 'education';
export type UISectionName = 'summary' | 'skills' | 'experience' | 'education';

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
