/**
 * Vault Response Type Definitions
 * 
 * CRITICAL NAMING CONVENTIONS:
 * - Database columns: snake_case (e.g., vault_id, user_id, created_at)
 * - TypeScript interfaces: camelCase (e.g., vaultId, userId, createdAt)
 * - Edge function parameters: camelCase
 * - When querying career_vault table: Use vaultData.id (NOT vaultData.vault_id)
 * - When querying vault_* tables: Use vault_id column
 */

/**
 * Standard success response structure for all vault edge functions
 */
export interface VaultSuccessResponse<T = any> {
  success: true;
  data: T;
  metadata?: {
    timestamp: string;
    processingTimeMs?: number;
  };
}

/**
 * Standard error response structure for all vault edge functions
 */
export interface VaultErrorResponse {
  success: false;
  error: string;
  details?: any;
  code?: string;
}

/**
 * Union type for all vault responses
 */
export type VaultResponse<T = any> = VaultSuccessResponse<T> | VaultErrorResponse;

/**
 * Auto-population extraction results
 * 
 * NAMING CONVENTION NOTE:
 * - Returns: { extracted: { powerPhrasesCount, transferableSkillsCount, ... } }
 * - Frontend accesses: data.extracted.powerPhrasesCount
 */
export interface AutoPopulationResult {
  extracted: {
    powerPhrasesCount: number;
    transferableSkillsCount: number;
    hiddenCompetenciesCount: number;
    softSkillsCount: number;
    leadershipPhilosophyCount: number;
    executivePresenceCount: number;
    personalityTraitsCount: number;
    workStyleCount: number;
    valuesMotivationsCount: number;
    behavioralIndicatorsCount: number;
  };
  vaultId: string;
  processingTime: number;
}

/**
 * Competitive analysis result
 * 
 * NAMING CONVENTION NOTE:
 * - Database query: vault_career_context.vault_id = vaultData.id
 * - NOT: vault_career_context.vault_id = vaultData.vault_id (this is wrong!)
 */
export interface CompetitiveAnalysisResult {
  marketPosition: {
    percentile: number;
    competitiveStrength: 'weak' | 'moderate' | 'strong' | 'exceptional';
    gapAnalysis: string[];
  };
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    action: string;
    impact: string;
  }>;
  benchmarkData: {
    industryAverage: number;
    topPerformers: number;
    yourScore: number;
  };
}

/**
 * Vault intelligence extraction result
 */
export interface VaultIntelligenceResult {
  extracted: {
    category: string;
    items: Array<{
      content: string;
      confidence: number;
      qualityTier: 'gold' | 'silver' | 'bronze' | 'assumed';
    }>;
  };
  totalExtracted: number;
}

/**
 * Career context data structure
 * 
 * CRITICAL: This maps to vault_career_context table
 * Database columns are snake_case, TypeScript uses camelCase
 */
export interface CareerContextData {
  vaultId: string;  // Maps to: vault_id (database)
  roleLevel: string;  // Maps to: role_level (database)
  industryContext: string;  // Maps to: industry_context (database)
  keyStrengths: string[];  // Maps to: key_strengths (database, JSONB)
  developmentAreas: string[];  // Maps to: development_areas (database, JSONB)
  marketPosition: number;  // Maps to: market_position (database)
  lastUpdatedAt: string;  // Maps to: last_updated_at (database)
}

/**
 * Vault statistics summary
 */
export interface VaultStatistics {
  totalItems: number;
  vaultStrength: number;  // 0-100 score
  qualityBreakdown: {
    gold: number;
    silver: number;
    bronze: number;
    assumed: number;
  };
  categoryBreakdown: {
    powerPhrases: number;
    transferableSkills: number;
    hiddenCompetencies: number;
    softSkills: number;
    leadershipPhilosophy: number;
    executivePresence: number;
    personalityTraits: number;
    workStyle: number;
    valuesMotivations: number;
    behavioralIndicators: number;
  };
}

/**
 * Salary report result
 */
export interface SalaryReportResult {
  currentEstimate: {
    min: number;
    max: number;
    median: number;
  };
  marketData: {
    percentile: number;
    industryAverage: number;
  };
  recommendations: string[];
}

/**
 * Helper type for database query results
 * Use this when querying career_vault table
 */
export interface CareerVaultRecord {
  id: string;  // This is what you use for vault_id in other tables!
  user_id: string;
  resume_raw_text: string;
  onboarding_step: string;
  created_at: string;
  updated_at: string;
  // Add other fields as needed
}

/**
 * Helper function to create success response
 */
export function createSuccessResponse<T>(data: T): VaultSuccessResponse<T> {
  return {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Helper function to create error response
 */
export function createErrorResponse(error: string, details?: any): VaultErrorResponse {
  return {
    success: false,
    error,
    details
  };
}
