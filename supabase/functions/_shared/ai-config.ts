/**
 * Centralized AI Configuration - Perplexity Only
 * 
 * CRITICAL: This project uses Perplexity exclusively for all AI operations.
 * Using any other provider (Lovable AI, Gemini, OpenAI direct) is prohibited.
 */

import { AIError, handlePerplexityError, retryWithBackoff } from './error-handling.ts';
import { perplexityCircuitBreaker } from './circuit-breaker.ts';

export const PERPLEXITY_MODELS = {
  // Production default - best balance of cost and quality
  DEFAULT: 'llama-3.1-sonar-large-128k-online',
  
  // Fast and cheap for simple tasks
  SMALL: 'llama-3.1-sonar-small-128k-online',
  
  // Most powerful for complex reasoning
  HUGE: 'llama-3.1-sonar-huge-128k-online',
} as const;

export const PERPLEXITY_CONFIG = {
  API_URL: 'https://api.perplexity.ai/chat/completions',
  DEFAULT_TEMPERATURE: 0.2,
  DEFAULT_MAX_TOKENS: 4000,
  DEFAULT_TOP_P: 0.9,
  
  // Pricing per 1M tokens (as of 2025)
  PRICING: {
    [PERPLEXITY_MODELS.SMALL]: { input: 0.2, output: 0.2 },
    [PERPLEXITY_MODELS.DEFAULT]: { input: 1.0, output: 1.0 },
    [PERPLEXITY_MODELS.HUGE]: { input: 5.0, output: 5.0 },
  },
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  RETRY_MULTIPLIER: 2,
} as const;

interface PerplexityRequest {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  return_citations?: boolean;
  return_related_questions?: boolean;
  search_recency_filter?: 'month' | 'week' | 'day';
}

interface PerplexityResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: string[];
}

export interface AIUsageMetrics {
  function_name: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  request_id: string;
  user_id?: string;
  created_at: string;
  execution_time_ms?: number;
  error_code?: string;
  retry_count?: number;
}

/**
 * Validates that the model is a valid Perplexity model
 */
export function validateModel(model: string): void {
  const validModels = Object.values(PERPLEXITY_MODELS);
  if (!validModels.includes(model as any)) {
    throw new Error(
      `Invalid model: ${model}. Must use one of: ${validModels.join(', ')}`
    );
  }
}

/**
 * Calculate cost in USD for a Perplexity API call
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = PERPLEXITY_CONFIG.PRICING[model as keyof typeof PERPLEXITY_CONFIG.PRICING];
  if (!pricing) {
    console.warn(`Unknown pricing for model ${model}, using DEFAULT pricing`);
    return calculateCost(PERPLEXITY_MODELS.DEFAULT, inputTokens, outputTokens);
  }
  
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Call Perplexity API with automatic retry logic, circuit breaker, timeout, and cost tracking
 * 
 * This is the ONLY way to make AI calls in this project.
 */
export async function callPerplexity(
  request: PerplexityRequest,
  functionName: string,
  userId?: string,
  timeoutMs: number = 45000 // 45 second default timeout
): Promise<{ response: PerplexityResponse; metrics: AIUsageMetrics }> {
  const apiKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (!apiKey) {
    throw new AIError('PERPLEXITY_API_KEY not configured', 'API_ERROR', 500, false);
  }

  const model = request.model || PERPLEXITY_MODELS.DEFAULT;
  validateModel(model);

  const startTime = Date.now();
  let retryCount = 0;

  try {
    // Wrap in circuit breaker
    const result = await perplexityCircuitBreaker.execute(async () => {
      // Wrap in retry logic
      return await retryWithBackoff(
        async () => {
          // Create abort controller for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

          try {
            console.log(`[${functionName}] Calling Perplexity with model: ${model}, timeout: ${timeoutMs}ms`);

            const response = await fetch(PERPLEXITY_CONFIG.API_URL, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...request,
                model,
                temperature: request.temperature ?? PERPLEXITY_CONFIG.DEFAULT_TEMPERATURE,
                max_tokens: request.max_tokens ?? PERPLEXITY_CONFIG.DEFAULT_MAX_TOKENS,
                top_p: PERPLEXITY_CONFIG.DEFAULT_TOP_P,
              }),
              signal: controller.signal,
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Perplexity API error (${response.status}): ${errorText}`);
            }

            const data: PerplexityResponse = await response.json();
            return data;

          } catch (error) {
            // Handle abort/timeout
            if (error instanceof Error && error.name === 'AbortError') {
              throw new AIError(
                `Request timed out after ${timeoutMs}ms`,
                'TIMEOUT',
                408,
                true,
                `AI request took longer than ${timeoutMs}ms`
              );
            }
            throw handlePerplexityError(error);
          } finally {
            clearTimeout(timeoutId);
          }
        },
        PERPLEXITY_CONFIG.MAX_RETRIES,
        (attempt, error) => {
          retryCount = attempt;
          console.warn(`[${functionName}] Retry ${attempt}/${PERPLEXITY_CONFIG.MAX_RETRIES}:`, error.message);
        }
      );
    });

    const executionTime = Date.now() - startTime;

    // Calculate cost and create metrics
    const cost = calculateCost(
      model,
      result.usage.prompt_tokens,
      result.usage.completion_tokens
    );

    const metrics: AIUsageMetrics = {
      function_name: functionName,
      model,
      input_tokens: result.usage.prompt_tokens,
      output_tokens: result.usage.completion_tokens,
      cost_usd: cost,
      request_id: result.id,
      user_id: userId,
      created_at: new Date().toISOString(),
      execution_time_ms: executionTime,
      retry_count: retryCount,
    };

    console.log(`[${functionName}] Success - Tokens: ${result.usage.total_tokens}, Cost: $${cost.toFixed(6)}, Time: ${executionTime}ms`);

    return { response: result, metrics };

  } catch (error) {
    const executionTime = Date.now() - startTime;
    const aiError = error instanceof AIError ? error : handlePerplexityError(error);
    
    // Log failed metrics
    console.error(`[${functionName}] Failed after ${executionTime}ms:`, {
      error: aiError.code,
      message: aiError.message,
      retries: retryCount
    });

    throw aiError;
  }
}

/**
 * Clean citation markers from Perplexity output
 * Use this for generation tasks where citations are unwanted
 */
export function cleanCitations(text: string): string {
  let cleaned = text;
  
  // Remove citation numbers like [1], [2], etc.
  cleaned = cleaned.replace(/\[\d+\]/g, '');
  
  // Remove "According to X," patterns
  cleaned = cleaned.replace(/According to [^,]+,\s*/gi, '');
  
  // Remove "Research shows" patterns
  cleaned = cleaned.replace(/Research shows that\s*/gi, '');
  cleaned = cleaned.replace(/Studies indicate that\s*/gi, '');
  
  // Remove "Source:" patterns
  cleaned = cleaned.replace(/Source:\s*[^\n]+\n?/gi, '');
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}
