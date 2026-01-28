/**
 * Centralized seniority level mapping utilities
 * Ensures consistency between UI labels and DB-valid values
 */

// Database-valid seniority levels (must match rb_projects check constraint)
export const DB_SENIORITY_LEVELS = [
  'IC', 'Senior IC', 'Manager', 'Senior Manager', 
  'Director', 'Senior Director', 'VP', 'SVP', 'C-Level'
] as const;

export type DBSeniorityLevel = typeof DB_SENIORITY_LEVELS[number];

// UI-friendly labels for display in dropdowns
export const UI_SENIORITY_OPTIONS = [
  { value: 'IC', label: 'Entry Level' },
  { value: 'IC', label: 'Junior' },
  { value: 'IC', label: 'Mid-Level' },
  { value: 'Senior IC', label: 'Senior' },
  { value: 'Senior IC', label: 'Lead' },
  { value: 'Senior IC', label: 'Principal' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Senior Manager', label: 'Senior Manager' },
  { value: 'Director', label: 'Director' },
  { value: 'Senior Director', label: 'Senior Director' },
  { value: 'VP', label: 'VP' },
  { value: 'SVP', label: 'SVP' },
  { value: 'C-Level', label: 'C-Level' },
];

/**
 * Map Quick Score / AI detected level to DB-valid value
 */
export function mapDetectedLevelToDB(detected: string | null | undefined): DBSeniorityLevel | null {
  if (!detected) return null;
  const normalized = detected.toLowerCase().trim();
  
  const mapping: Record<string, DBSeniorityLevel> = {
    'entry': 'IC',
    'entry level': 'IC',
    'junior': 'IC',
    'mid': 'IC',
    'mid-level': 'IC',
    'senior': 'Senior IC',
    'lead': 'Senior IC',
    'staff': 'Senior IC',
    'principal': 'Senior IC',
    'manager': 'Manager',
    'senior manager': 'Senior Manager',
    'director': 'Director',
    'senior director': 'Senior Director',
    'vp': 'VP',
    'vice president': 'VP',
    'svp': 'SVP',
    'senior vice president': 'SVP',
    'c-level': 'C-Level',
    'c_level': 'C-Level',
    'executive': 'Director',
    'cxo': 'C-Level',
  };
  
  return mapping[normalized] || null;
}

/**
 * Map UI dropdown label back to DB-valid value for saving
 */
export function mapUILevelToDB(uiLevel: string): DBSeniorityLevel | string {
  const mapping: Record<string, DBSeniorityLevel> = {
    'Entry Level': 'IC',
    'Junior': 'IC',
    'Mid-Level': 'IC',
    'Senior': 'Senior IC',
    'Lead': 'Senior IC',
    'Principal': 'Senior IC',
    'Manager': 'Manager',
    'Senior Manager': 'Senior Manager',
    'Director': 'Director',
    'Senior Director': 'Senior Director',
    'VP': 'VP',
    'SVP': 'SVP',
    'C-Level': 'C-Level',
  };
  return mapping[uiLevel] || uiLevel;
}

/**
 * Map DB value to UI-friendly label for display
 */
export function mapDBLevelToUI(dbLevel: string | null): string {
  if (!dbLevel) return '';
  const mapping: Record<string, string> = {
    'IC': 'Mid-Level',
    'Senior IC': 'Senior',
    'Manager': 'Manager',
    'Senior Manager': 'Senior Manager',
    'Director': 'Director',
    'Senior Director': 'Senior Director',
    'VP': 'VP',
    'SVP': 'SVP',
    'C-Level': 'C-Level',
  };
  return mapping[dbLevel] || dbLevel;
}

/**
 * Get a user-friendly display label for any seniority level
 */
export function getSeniorityLabel(dbValue: DBSeniorityLevel | string | null): string {
  if (!dbValue) return 'Unknown';
  const labels: Record<string, string> = {
    'IC': 'Individual Contributor',
    'Senior IC': 'Senior',
    'Manager': 'Manager',
    'Senior Manager': 'Senior Manager',
    'Director': 'Director',
    'Senior Director': 'Senior Director',
    'VP': 'Vice President',
    'SVP': 'Senior Vice President',
    'C-Level': 'C-Level Executive',
  };
  return labels[dbValue] || dbValue;
}
