/**
 * Retry Orchestrator
 * Intelligent retry and recovery strategies for extraction failures
 */

import { ValidationResult, ExtractedData, ExtractionContext } from '../validation/validation-engine.ts';

export interface ExtractionError {
  type: 'low_confidence' | 'incomplete_extraction' | 'malformed_json' | 'extraction_failure';
  confidence?: number;
  issues?: any[];
  error?: string;
}

export interface ExtractionAttempt {
  extracted: ExtractedData;
  validation: ValidationResult;
  rawResponse: string;
}

export interface RetryStrategy {
  name: string;
  cost: number; // Relative cost (1 = cheap, 5 = expensive)
  shouldAttempt: (error: ExtractionError, attempt: number) => boolean;
  execute: (
    context: ExtractionContext,
    previousAttempt: ExtractionAttempt,
    extractFn: (prompt: string, options?: any) => Promise<any>
  ) => Promise<ExtractedData>;
}

export interface RetryConfig {
  context: ExtractionContext;
  maxAttempts: number;
  minConfidence: number;
  extractFn: (prompt: string, options?: any) => Promise<any>;
  validationRules?: any[];
}

export interface RetryResult {
  success: boolean;
  data: ExtractedData;
  validation: ValidationResult;
  error?: ExtractionError;
  metadata: {
    attempts: number;
    finalStrategy: string;
    totalCost: number;
  };
}

/**
 * STRATEGY 1: Enhanced Prompt
 * Add more specific guidance based on what was missing
 */
export const enhancedPromptStrategy: RetryStrategy = {
  name: 'enhanced_prompt',
  cost: 1,
  shouldAttempt: (error, attempt) => attempt === 1 && error.type === 'low_confidence',
  execute: async (context, previous, extractFn) => {
    console.log('🔄 Retry Strategy: Enhanced Prompt');

    // Build enhanced prompt based on missing fields
    const missingFields = (previous.validation.issues || [])
      .filter(i => i.suggestedFix === 'retry_with_enhanced_prompt')
      .map(i => i.metadata);

    let enhancedGuidance = '\n\n⚠️ IMPORTANT - Previous extraction missed key information:\n';

    if (missingFields.some(f => f?.expectedMin)) {
      enhancedGuidance += '- Extract MORE items. The resume likely contains additional relevant information.\n';
    }

    if (previous.validation.issues.some(i => i.rule === 'completeness_check')) {
      enhancedGuidance += '- Look carefully for ALL quantified achievements, even if not explicitly stated as "achievements"\n';
      enhancedGuidance += '- Include scope metrics (team sizes, budget amounts, project scale)\n';
    }

    // Get original prompt from context
    const originalPrompt = (context as any).originalPrompt || '';
    const enhancedPrompt = originalPrompt + enhancedGuidance;

    const response = await extractFn(enhancedPrompt);
    return response.parsedData || response.data || response;
  }
};

/**
 * STRATEGY 2: Different Model
 * Try more powerful AI model
 */
export const differentModelStrategy: RetryStrategy = {
  name: 'different_model',
  cost: 3,
  shouldAttempt: (error, attempt) => attempt === 2 && error.type === 'low_confidence',
  execute: async (context, previous, extractFn) => {
    console.log('🔄 Retry Strategy: Different Model (using more powerful AI)');

    const originalPrompt = (context as any).originalPrompt || '';

    // Pass option to use more powerful model
    const response = await extractFn(originalPrompt, {
      forceHighQuality: true,
      requiresAccuracy: true
    });

    return response.parsedData || response.data || response;
  }
};

/**
 * STRATEGY 3: Section-by-Section
 * Extract each resume section separately then merge
 */
export const sectionBySectionStrategy: RetryStrategy = {
  name: 'section_by_section',
  cost: 2,
  shouldAttempt: (error, attempt) => error.type === 'incomplete_extraction',
  execute: async (context, previous, extractFn) => {
    console.log('🔄 Retry Strategy: Section-by-Section Extraction');

    // Split resume into sections (simplified)
    const sections = splitResumeIntoSections(context.resumeText);

    const allExtracted: any[] = [];

    for (const section of sections) {
      if (section.text.trim().length < 50) continue; // Skip tiny sections

      const sectionPrompt = `Extract from this specific section:\n\n${section.text}\n\n${(context as any).originalPrompt || ''}`;

      try {
        const response = await extractFn(sectionPrompt);
        const extracted = response.parsedData || response.data || response;

        if (Array.isArray(extracted)) {
          allExtracted.push(...extracted);
        } else if (extracted) {
          allExtracted.push(extracted);
        }
      } catch (error) {
        console.error(`Failed to extract from section ${section.title}:`, error);
        // Continue with other sections
      }
    }

    return { powerPhrases: allExtracted };
  }
};

/**
 * STRATEGY 4: JSON Repair
 * Attempt to fix malformed JSON
 */
export const jsonRepairStrategy: RetryStrategy = {
  name: 'json_repair',
  cost: 1,
  shouldAttempt: (error, attempt) => error.type === 'malformed_json',
  execute: async (context, previous, extractFn) => {
    console.log('🔄 Retry Strategy: JSON Repair');

    const rawResponse = previous.rawResponse;

    // Try automated repair
    const repaired = attemptJSONRepair(rawResponse);
    if (repaired) {
      console.log('✅ JSON repaired successfully');
      return repaired;
    }

    // If automated repair fails, ask AI to fix it
    const fixPrompt = `The following JSON is malformed. Fix it and return ONLY valid JSON with no markdown:

${rawResponse}

Return the corrected JSON:`;

    const response = await extractFn(fixPrompt);
    const fixed = response.parsedData || response.data || JSON.parse(response.raw || response);

    return fixed;
  }
};

/**
 * All retry strategies (ordered by cost)
 */
export const RETRY_STRATEGIES: RetryStrategy[] = [
  enhancedPromptStrategy,
  jsonRepairStrategy,
  sectionBySectionStrategy,
  differentModelStrategy,
];

/**
 * Main retry orchestrator
 */
export async function extractWithRetry(config: RetryConfig): Promise<RetryResult> {
  let attempt = 0;
  let lastError: ExtractionError | null = null;
  let lastAttempt: ExtractionAttempt | null = null;
  let totalCost = 0;

  while (attempt < config.maxAttempts) {
    try {
      attempt++;
      console.log(`\n📍 Extraction attempt ${attempt}/${config.maxAttempts}`);

      // Perform extraction
      const extracted = await performExtraction(config);
      totalCost += 1; // Base cost

      // Validate
      const { runValidation } = await import('../validation/validation-engine.ts');
      const validation = await runValidation(
        extracted,
        config.context,
        config.validationRules
      );

      console.log(`Validation: ${validation.passed ? '✅ PASS' : '❌ FAIL'} (${validation.confidence}% confidence)`);

      // Check if we should retry
      if (validation.passed || validation.confidence >= config.minConfidence) {
        // Success!
        console.log(`✅ Extraction successful on attempt ${attempt}`);
        return {
          success: true,
          data: extracted,
          validation,
          metadata: {
            attempts: attempt,
            finalStrategy: attempt === 1 ? 'initial_extraction' : 'retry_recovery',
            totalCost
          }
        };
      }

      // Validation failed, determine if we should retry
      lastError = {
        type: 'low_confidence',
        confidence: validation.confidence,
        issues: validation.issues
      };
      lastAttempt = {
        extracted,
        validation,
        rawResponse: (extracted as any).rawResponse || JSON.stringify(extracted)
      };

      // Try recovery strategies
      const strategies = RETRY_STRATEGIES
        .filter(s => s.shouldAttempt(lastError, attempt))
        .sort((a, b) => a.cost - b.cost); // Cheapest first

      for (const strategy of strategies) {
        if (attempt >= config.maxAttempts) break;

        console.log(`🔧 Attempting recovery: ${strategy.name}`);

        try {
          const recovered = await strategy.execute(
            config.context,
            lastAttempt,
            config.extractFn
          );

          totalCost += strategy.cost;

          // Validate recovery
          const recoveryValidation = await runValidation(
            recovered,
            config.context,
            config.validationRules
          );

          console.log(`Recovery validation: ${recoveryValidation.confidence}% confidence`);

          if (recoveryValidation.confidence > validation.confidence) {
            // Improvement!
            console.log(`✅ Recovery successful with ${strategy.name}`);
            return {
              success: true,
              data: recovered,
              validation: recoveryValidation,
              metadata: {
                attempts: attempt,
                finalStrategy: strategy.name,
                totalCost
              }
            };
          } else {
            console.log(`⚠️ Recovery did not improve confidence`);
          }
        } catch (error) {
          console.error(`Recovery strategy ${strategy.name} failed:`, error);
        }
      }

    } catch (error) {
      console.error(`❌ Extraction attempt ${attempt} failed:`, error);
      lastError = {
        type: 'extraction_failure',
        error: error.message
      };

      // Exponential backoff before retry
      if (attempt < config.maxAttempts) {
        const backoffMs = 1000 * Math.pow(2, attempt - 1);
        console.log(`⏳ Waiting ${backoffMs}ms before retry...`);
        await sleep(backoffMs);
      }
    }
  }

  // All retries exhausted
  console.log(`❌ All ${config.maxAttempts} attempts exhausted`);

  return {
    success: false,
    data: lastAttempt?.extracted || getEmptyExtractedData(),
    validation: lastAttempt?.validation || getFailedValidation(),
    error: lastError || undefined,
    metadata: {
      attempts: config.maxAttempts,
      finalStrategy: 'fallback',
      totalCost
    }
  };
}

/**
 * Perform initial extraction
 */
async function performExtraction(config: RetryConfig): Promise<ExtractedData> {
  const prompt = (config.context as any).originalPrompt || '';
  const response = await config.extractFn(prompt);
  return response.parsedData || response.data || response;
}

/**
 * Split resume into logical sections
 */
function splitResumeIntoSections(resumeText: string): Array<{ title: string; text: string }> {
  const sections: Array<{ title: string; text: string }> = [];

  // Common resume section headers
  const sectionHeaders = [
    'experience',
    'work history',
    'employment',
    'education',
    'skills',
    'certifications',
    'achievements',
    'summary',
    'objective'
  ];

  const lines = resumeText.split('\n');
  let currentSection = { title: 'Introduction', text: '' };

  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim();

    // Check if this line is a section header
    const isHeader = sectionHeaders.some(header =>
      lowerLine.includes(header) && line.length < 50
    );

    if (isHeader) {
      // Save previous section
      if (currentSection.text.trim()) {
        sections.push(currentSection);
      }

      // Start new section
      currentSection = { title: line.trim(), text: '' };
    } else {
      currentSection.text += line + '\n';
    }
  }

  // Add final section
  if (currentSection.text.trim()) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Attempt to repair malformed JSON
 */
function attemptJSONRepair(jsonString: string): any | null {
  try {
    // Remove markdown code blocks
    let cleaned = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    // Trim whitespace
    cleaned = cleaned.trim();

    // Try parsing
    return JSON.parse(cleaned);
  } catch (error) {
    // Try adding missing closing brackets
    try {
      let repaired = jsonString;

      // Count brackets
      const openBraces = (repaired.match(/{/g) || []).length;
      const closeBraces = (repaired.match(/}/g) || []).length;
      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/]/g) || []).length;

      // Add missing closures
      repaired += '}'. repeat(Math.max(0, openBraces - closeBraces));
      repaired += ']'.repeat(Math.max(0, openBrackets - closeBrackets));

      return JSON.parse(repaired);
    } catch (repairError) {
      return null;
    }
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get empty extracted data structure
 */
function getEmptyExtractedData(): ExtractedData {
  return {
    powerPhrases: [],
    skills: [],
    competencies: [],
    softSkills: []
  };
}

/**
 * Get failed validation result
 */
function getFailedValidation(): ValidationResult {
  return {
    passed: false,
    confidence: 0,
    issues: [{
      rule: 'extraction_failure',
      severity: 'critical',
      message: 'Extraction failed after all retry attempts'
    }],
    recommendations: ['Manual review required'],
    requiresUserReview: true
  };
}
