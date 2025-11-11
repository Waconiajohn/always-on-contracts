/**
 * Complete list of all Career Vault tables
 * Use this constant to ensure complete vault coverage across all features
 */
export const VAULT_TABLES = [
  'vault_power_phrases',
  'vault_transferable_skills',
  'vault_hidden_competencies',
  'vault_soft_skills',
  'vault_leadership_philosophy',
  'vault_executive_presence',
  'vault_personality_traits',
  'vault_work_style',
  'vault_values_motivations',
  'vault_behavioral_indicators'
] as const;

// Alias for backward compatibility
export const VAULT_TABLE_NAMES = VAULT_TABLES;

export type VaultTableName = typeof VAULT_TABLES[number];

/**
 * Vault table metadata for queries
 */
export const VAULT_TABLE_FIELDS = {
  vault_power_phrases: 'id, power_phrase, impact_metrics, category, quality_tier',
  vault_transferable_skills: 'id, stated_skill, evidence, quality_tier',
  vault_hidden_competencies: 'id, competency_area, inferred_capability, quality_tier',
  vault_soft_skills: 'id, skill_name, examples, proficiency_level, quality_tier',
  vault_leadership_philosophy: 'id, philosophy_statement, leadership_style, real_world_application, quality_tier',
  vault_executive_presence: 'id, presence_indicator, situational_example, perceived_impact, quality_tier',
  vault_personality_traits: 'id, trait_name, behavioral_evidence, work_context, quality_tier',
  vault_work_style: 'id, preference_area, preference_description, ideal_environment, quality_tier',
  vault_values_motivations: 'id, value_name, importance_level, manifestation, quality_tier',
  vault_behavioral_indicators: 'id, indicator_type, specific_behavior, context, outcome_pattern, quality_tier'
} as const;

/**
 * Helper to build complete vault query
 * @param vaultId - Career vault ID
 * @returns Supabase select string with all 10 vault tables
 */
export function buildCompleteVaultQuery() {
  return `
    ${VAULT_TABLES.map(table => `${table}(${VAULT_TABLE_FIELDS[table]})`).join(',\n    ')}
  `;
}

/**
 * Validate that all vault tables are included in a query result
 * @param vaultData - Query result object
 * @returns Array of missing table names
 */
export function validateVaultCompleteness(vaultData: any): string[] {
  const missingTables: string[] = [];
  
  for (const table of VAULT_TABLES) {
    if (!(table in vaultData)) {
      missingTables.push(table);
    }
  }
  
  return missingTables;
}

/**
 * Table configuration for dynamic operations
 */
export interface TableConfig {
  name: VaultTableName;
  contentField: string;
  idField: string;
  timestampField: string;
  displayName: string;
}

const TABLE_CONFIGS: Record<VaultTableName, TableConfig> = {
  vault_power_phrases: {
    name: 'vault_power_phrases',
    contentField: 'power_phrase',
    idField: 'vault_id',
    timestampField: 'last_updated_at',
    displayName: 'Career Achievement' // Updated from "Power Phrase"
  },
  vault_transferable_skills: {
    name: 'vault_transferable_skills',
    contentField: 'stated_skill',
    idField: 'vault_id',
    timestampField: 'last_updated_at',
    displayName: 'Skill & Expertise' // Updated from "Transferable Skill"
  },
  vault_hidden_competencies: {
    name: 'vault_hidden_competencies',
    contentField: 'inferred_capability',
    idField: 'vault_id',
    timestampField: 'last_updated_at',
    displayName: 'Strategic Capability' // Updated from "Hidden Competency"
  },
  vault_soft_skills: {
    name: 'vault_soft_skills',
    contentField: 'skill_name',
    idField: 'vault_id',
    timestampField: 'created_at',
    displayName: 'Professional Strength' // Updated from "Soft Skill"
  },
  vault_leadership_philosophy: {
    name: 'vault_leadership_philosophy',
    contentField: 'philosophy_statement',
    idField: 'vault_id',
    timestampField: 'created_at',
    displayName: 'Leadership Philosophy'
  },
  vault_executive_presence: {
    name: 'vault_executive_presence',
    contentField: 'presence_indicator',
    idField: 'vault_id',
    timestampField: 'created_at',
    displayName: 'Executive Presence'
  },
  vault_personality_traits: {
    name: 'vault_personality_traits',
    contentField: 'trait_name',
    idField: 'vault_id',
    timestampField: 'created_at',
    displayName: 'Personality Trait'
  },
  vault_work_style: {
    name: 'vault_work_style',
    contentField: 'preference_description',
    idField: 'vault_id',
    timestampField: 'created_at',
    displayName: 'Work Style'
  },
  vault_values_motivations: {
    name: 'vault_values_motivations',
    contentField: 'value_name',
    idField: 'vault_id',
    timestampField: 'created_at',
    displayName: 'Value/Motivation'
  },
  vault_behavioral_indicators: {
    name: 'vault_behavioral_indicators',
    contentField: 'specific_behavior',
    idField: 'vault_id',
    timestampField: 'created_at',
    displayName: 'Behavioral Indicator'
  }
};

/**
 * Get table configuration for dynamic operations
 * @param tableName - Name of the vault table
 * @returns Table configuration object or undefined if not found
 */
export function getTableConfig(tableName: string): TableConfig | undefined {
  return TABLE_CONFIGS[tableName as VaultTableName];
}
