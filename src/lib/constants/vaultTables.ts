/**
 * Centralized registry for all Career Vault tables
 * Single source of truth for table metadata, field names, and display names
 */

export const VAULT_TABLES = {
  vault_power_phrases: {
    name: 'vault_power_phrases',
    displayName: 'Achievement',
    contentField: 'power_phrase',
    evidenceField: 'impact_metrics',
    qualityField: 'quality_tier',
    timestampField: 'last_updated_at',
    idField: 'vault_id',
  },
  vault_confirmed_skills: {
    name: 'vault_confirmed_skills',
    displayName: 'Skill',
    contentField: 'skill_name',
    evidenceField: 'custom_notes',
    qualityField: 'source', // Special case: uses 'source' instead of 'quality_tier'
    timestampField: 'created_at', // No last_updated_at field
    idField: 'user_id', // Special case: uses user_id instead of vault_id
  },
  vault_hidden_competencies: {
    name: 'vault_hidden_competencies',
    displayName: 'Competency',
    contentField: 'inferred_capability',
    evidenceField: 'evidence_from_resume',
    qualityField: 'quality_tier',
    timestampField: 'last_updated_at',
    idField: 'vault_id',
  },
  vault_soft_skills: {
    name: 'vault_soft_skills',
    displayName: 'Soft Skill',
    contentField: 'skill_name',
    evidenceField: 'examples',
    qualityField: 'quality_tier',
    timestampField: 'last_updated_at',
    idField: 'vault_id',
  },
  vault_leadership_philosophy: {
    name: 'vault_leadership_philosophy',
    displayName: 'Leadership Philosophy',
    contentField: 'philosophy_statement',
    evidenceField: 'real_world_application',
    qualityField: 'quality_tier',
    timestampField: 'last_updated_at',
    idField: 'vault_id',
  },
  vault_executive_presence: {
    name: 'vault_executive_presence',
    displayName: 'Executive Presence',
    contentField: 'presence_indicator',
    evidenceField: 'situational_example',
    qualityField: 'quality_tier',
    timestampField: 'last_updated_at',
    idField: 'vault_id',
  },
  vault_personality_traits: {
    name: 'vault_personality_traits',
    displayName: 'Personality Trait',
    contentField: 'trait_name',
    evidenceField: 'behavioral_evidence',
    qualityField: 'quality_tier',
    timestampField: 'last_updated_at',
    idField: 'vault_id',
  },
  vault_work_style: {
    name: 'vault_work_style',
    displayName: 'Work Style',
    contentField: 'preference_area',
    evidenceField: 'preference_description',
    qualityField: 'quality_tier',
    timestampField: 'last_updated_at',
    idField: 'vault_id',
  },
  vault_values_motivations: {
    name: 'vault_values_motivations',
    displayName: 'Core Value',
    contentField: 'value_name',
    evidenceField: 'manifestation',
    qualityField: 'quality_tier',
    timestampField: 'last_updated_at',
    idField: 'vault_id',
  },
  vault_behavioral_indicators: {
    name: 'vault_behavioral_indicators',
    displayName: 'Behavioral Pattern',
    contentField: 'specific_behavior',
    evidenceField: 'outcome_pattern',
    qualityField: 'quality_tier',
    timestampField: 'last_updated_at',
    idField: 'vault_id',
  },
} as const;

export type VaultTableName = keyof typeof VAULT_TABLES;

export const VAULT_TABLE_NAMES = Object.keys(VAULT_TABLES) as VaultTableName[];

/**
 * Helper to get table config by name
 */
export const getTableConfig = (tableName: string) => {
  return VAULT_TABLES[tableName as VaultTableName];
};
