/**
 * Model Optimizer - Automatically select optimal model based on task complexity
 *
 * Reduces costs by 20-50% by using SMALL model for simple tasks and
 * HUGE model only for complex reasoning.
 */

import { PERPLEXITY_MODELS } from './ai-config.ts';

export type TaskType = 'generation' | 'analysis' | 'research' | 'extraction' | 'validation';
export type ComplexityLevel = 'low' | 'medium' | 'high';

interface OptimizationHints {
  taskType?: TaskType;
  complexity?: ComplexityLevel;
  estimatedInputTokens?: number;
  estimatedOutputTokens?: number;
  requiresResearch?: boolean;
  requiresReasoning?: boolean;
  multiStep?: boolean;
}

interface ModelRecommendation {
  model: string;
  reasoning: string;
  estimatedCost: number;
  alternatives?: Array<{
    model: string;
    reasoning: string;
    estimatedCost: number;
  }>;
}

/**
 * Automatically select the best model for the task
 *
 * @example
 * // Simple extraction
 * const model = selectOptimalModel({
 *   taskType: 'extraction',
 *   complexity: 'low',
 *   estimatedInputTokens: 500
 * });
 * // Returns: PERPLEXITY_MODELS.SMALL (5x cheaper)
 *
 * @example
 * // Complex research
 * const model = selectOptimalModel({
 *   taskType: 'research',
 *   complexity: 'high',
 *   requiresResearch: true
 * });
 * // Returns: PERPLEXITY_MODELS.HUGE (best quality)
 */
export function selectOptimalModel(hints: OptimizationHints): string {
  const {
    taskType = 'generation',
    complexity = 'medium',
    estimatedInputTokens = 0,
    estimatedOutputTokens = 0,
    requiresResearch = false,
    requiresReasoning = false,
    multiStep = false
  } = hints;

  // Use HUGE for complex research and reasoning
  if (requiresResearch && complexity === 'high') {
    return PERPLEXITY_MODELS.HUGE;
  }

  if (requiresReasoning && multiStep) {
    return PERPLEXITY_MODELS.HUGE;
  }

  if (taskType === 'research' && estimatedInputTokens > 5000) {
    return PERPLEXITY_MODELS.HUGE;
  }

  // Use SMALL for simple, short tasks
  if (
    complexity === 'low' &&
    estimatedInputTokens < 1000 &&
    estimatedOutputTokens < 500 &&
    !requiresResearch
  ) {
    return PERPLEXITY_MODELS.SMALL;
  }

  // Simple extraction with structured output
  if (taskType === 'extraction' && complexity === 'low') {
    return PERPLEXITY_MODELS.SMALL;
  }

  // Simple validation
  if (taskType === 'validation' && estimatedInputTokens < 2000) {
    return PERPLEXITY_MODELS.SMALL;
  }

  // Default to DEFAULT model for most tasks
  return PERPLEXITY_MODELS.DEFAULT;
}

/**
 * Get detailed model recommendation with reasoning and cost estimates
 *
 * @example
 * const recommendation = getModelRecommendation({
 *   taskType: 'analysis',
 *   complexity: 'medium',
 *   estimatedInputTokens: 2000,
 *   estimatedOutputTokens: 1000
 * });
 *
 * console.log(recommendation.model);      // 'sonar-pro'
 * console.log(recommendation.reasoning);  // 'Balanced model for medium complexity analysis'
 * console.log(recommendation.estimatedCost); // 0.003
 */
export function getModelRecommendation(hints: OptimizationHints): ModelRecommendation {
  const model = selectOptimalModel(hints);
  const inputTokens = hints.estimatedInputTokens || 2000;
  const outputTokens = hints.estimatedOutputTokens || 1000;

  // Pricing per 1M tokens
  const pricing: Record<string, { input: number; output: number }> = {
    [PERPLEXITY_MODELS.SMALL]: { input: 0.2, output: 0.2 },
    [PERPLEXITY_MODELS.DEFAULT]: { input: 1.0, output: 1.0 },
    [PERPLEXITY_MODELS.HUGE]: { input: 5.0, output: 5.0 }
  };

  const modelPricing = pricing[model];
  const estimatedCost =
    (inputTokens / 1_000_000) * modelPricing.input +
    (outputTokens / 1_000_000) * modelPricing.output;

  // Generate reasoning
  let reasoning = '';
  if (model === PERPLEXITY_MODELS.SMALL) {
    reasoning = 'Fast and economical model suitable for simple, structured tasks';
  } else if (model === PERPLEXITY_MODELS.HUGE) {
    reasoning = 'Most powerful model for complex reasoning and research';
  } else {
    reasoning = 'Balanced model for general-purpose tasks';
  }

  // Add task-specific reasoning
  if (hints.taskType) {
    reasoning += ` (${hints.taskType}`;
    if (hints.complexity) {
      reasoning += `, ${hints.complexity} complexity`;
    }
    reasoning += ')';
  }

  // Calculate alternatives
  const alternatives = Object.values(PERPLEXITY_MODELS)
    .filter(m => m !== model)
    .map(altModel => {
      const altPricing = pricing[altModel];
      const altCost =
        (inputTokens / 1_000_000) * altPricing.input +
        (outputTokens / 1_000_000) * altPricing.output;

      let altReasoning = '';
      if (altModel === PERPLEXITY_MODELS.SMALL) {
        altReasoning = 'Lower cost but may sacrifice quality';
      } else if (altModel === PERPLEXITY_MODELS.HUGE) {
        altReasoning = 'Higher quality but 5x more expensive';
      } else {
        altReasoning = 'Good balance of cost and quality';
      }

      return {
        model: altModel,
        reasoning: altReasoning,
        estimatedCost: altCost
      };
    })
    .sort((a, b) => a.estimatedCost - b.estimatedCost);

  return {
    model,
    reasoning,
    estimatedCost,
    alternatives
  };
}

/**
 * Estimate token count from text (rough approximation)
 * 1 token ≈ 4 characters for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Suggest model based on prompt and expected output
 *
 * @example
 * const model = suggestModelForPrompt(
 *   'Extract the job title from this resume',
 *   resumeText,
 *   50  // Expecting short output
 * );
 * // Returns: PERPLEXITY_MODELS.SMALL
 */
export function suggestModelForPrompt(
  prompt: string,
  inputText: string,
  expectedOutputLength: number = 1000
): ModelRecommendation {
  const inputTokens = estimateTokens(prompt + inputText);
  const outputTokens = estimateTokens('x'.repeat(expectedOutputLength));

  // Detect task type from prompt
  let taskType: TaskType = 'generation';
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('research') || lowerPrompt.includes('find') || lowerPrompt.includes('search')) {
    taskType = 'research';
  } else if (lowerPrompt.includes('analyze') || lowerPrompt.includes('evaluate')) {
    taskType = 'analysis';
  } else if (lowerPrompt.includes('extract') || lowerPrompt.includes('parse')) {
    taskType = 'extraction';
  } else if (lowerPrompt.includes('validate') || lowerPrompt.includes('check')) {
    taskType = 'validation';
  }

  // Detect complexity from prompt
  let complexity: ComplexityLevel = 'medium';
  if (
    lowerPrompt.includes('comprehensive') ||
    lowerPrompt.includes('detailed') ||
    lowerPrompt.includes('complex') ||
    inputTokens > 5000
  ) {
    complexity = 'high';
  } else if (
    lowerPrompt.includes('simple') ||
    lowerPrompt.includes('quick') ||
    lowerPrompt.includes('brief') ||
    inputTokens < 1000
  ) {
    complexity = 'low';
  }

  const requiresResearch = lowerPrompt.includes('research') || lowerPrompt.includes('latest') || lowerPrompt.includes('current');
  const requiresReasoning = lowerPrompt.includes('why') || lowerPrompt.includes('explain') || lowerPrompt.includes('reason');
  const multiStep = lowerPrompt.includes('step') || lowerPrompt.includes('first') || lowerPrompt.includes('then');

  return getModelRecommendation({
    taskType,
    complexity,
    estimatedInputTokens: inputTokens,
    estimatedOutputTokens: outputTokens,
    requiresResearch,
    requiresReasoning,
    multiStep
  });
}

/**
 * Pre-defined optimization profiles for common tasks
 */
export const OptimizationProfiles = {
  // Resume extraction - simple structured output
  RESUME_EXTRACTION: {
    taskType: 'extraction' as TaskType,
    complexity: 'low' as ComplexityLevel,
    estimatedInputTokens: 2000,
    estimatedOutputTokens: 500
  },

  // Resume analysis - moderate complexity
  RESUME_ANALYSIS: {
    taskType: 'analysis' as TaskType,
    complexity: 'medium' as ComplexityLevel,
    estimatedInputTokens: 3000,
    estimatedOutputTokens: 1500
  },

  // Job matching - analysis with reasoning
  JOB_MATCHING: {
    taskType: 'analysis' as TaskType,
    complexity: 'medium' as ComplexityLevel,
    estimatedInputTokens: 4000,
    estimatedOutputTokens: 800,
    requiresReasoning: true
  },

  // Industry research - complex research task
  INDUSTRY_RESEARCH: {
    taskType: 'research' as TaskType,
    complexity: 'high' as ComplexityLevel,
    estimatedInputTokens: 1000,
    estimatedOutputTokens: 3000,
    requiresResearch: true,
    requiresReasoning: true
  },

  // Cover letter generation - creative generation
  COVER_LETTER: {
    taskType: 'generation' as TaskType,
    complexity: 'medium' as ComplexityLevel,
    estimatedInputTokens: 3000,
    estimatedOutputTokens: 800
  },

  // Interview prep - analysis with reasoning
  INTERVIEW_PREP: {
    taskType: 'analysis' as TaskType,
    complexity: 'high' as ComplexityLevel,
    estimatedInputTokens: 5000,
    estimatedOutputTokens: 2000,
    requiresReasoning: true,
    multiStep: true
  },

  // Quick validation - simple check
  QUICK_VALIDATION: {
    taskType: 'validation' as TaskType,
    complexity: 'low' as ComplexityLevel,
    estimatedInputTokens: 1000,
    estimatedOutputTokens: 200
  }
};
