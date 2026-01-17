/**
 * Lovable AI Gateway Configuration
 *
 * Provides access to OpenAI and Google Gemini models via Lovable AI Gateway
 * Used for: structured extraction, content generation, and conversational AI
 */

import { AIError, retryWithBackoff, calculateBackoff } from './error-handling.ts';
import { CircuitBreaker } from './circuit-breaker.ts';

// Circuit breaker for Lovable AI Gateway
const lovableCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 300000, // 5 minutes
  name: 'LovableAI'
});

export const LOVABLE_AI_MODELS = {
  // Default: Balanced performance and cost
  DEFAULT: 'google/gemini-2.5-flash',
  
  // Premium: OpenAI GPT-5 for complex reasoning and reliable structured output
  PREMIUM: 'openai/gpt-5',
  
  // Advanced: Latest OpenAI model for most complex tasks
  ADVANCED: 'openai/gpt-5.2',
  
  // Fast: Cheapest for simple tasks
  FAST: 'google/gemini-2.5-flash-lite',
  
  // Image generation
  IMAGE: 'google/gemini-2.5-flash-image',
  
  // Mini models for cost-effective mid-tier tasks
  MINI: 'openai/gpt-5-mini',
} as const;

export const LOVABLE_AI_CONFIG = {
  API_URL: 'https://ai.gateway.lovable.dev/v1/chat/completions',
  DEFAULT_TEMPERATURE: 0.3,
  DEFAULT_MAX_TOKENS: 4000,
  
  // Pricing per 1M tokens (accurate as of 2025)
  PRICING: {
    'google/gemini-2.5-flash': { input: 0.30, output: 2.50 },
    'google/gemini-3-pro-preview': { input: 2.50, output: 10.00 },
    'google/gemini-2.5-flash-lite': { input: 0.10, output: 0.80 },
    'openai/gpt-5': { input: 10.00, output: 30.00 },
    'openai/gpt-5.2': { input: 15.00, output: 45.00 },
    'openai/gpt-5-mini': { input: 1.50, output: 6.00 },
    'openai/gpt-5-nano': { input: 0.50, output: 2.00 },
  },
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  RETRY_MULTIPLIER: 2,
} as const;

export interface LovableAIRequest {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' }; // For OpenAI models
  response_mime_type?: string; // For Gemini models (use "application/json")
  tools?: Array<{
    type: "function";
    function: {
      name: string;
      description: string;
      parameters: any;
    };
  }>;
  tool_choice?: { type: "function"; function: { name: string } };
}

interface LovableAIResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
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
}

/**
 * Calculate cost in USD for a Lovable AI call
 */
export function calculateLovableAICost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = LOVABLE_AI_CONFIG.PRICING[model as keyof typeof LOVABLE_AI_CONFIG.PRICING];
  if (!pricing) {
    console.warn(`Unknown pricing for model ${model}, using DEFAULT pricing`);
    return calculateLovableAICost(LOVABLE_AI_MODELS.DEFAULT, inputTokens, outputTokens);
  }
  
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Call Lovable AI Gateway with circuit breaker, retry logic, and cost tracking
 *
 * Use this for: structured extraction, content generation, conversational AI
 */
export async function callLovableAI(
  request: LovableAIRequest,
  functionName: string,
  userId?: string,
  timeoutMs: number = 45000
): Promise<{ response: LovableAIResponse; metrics: AIUsageMetrics }> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    throw new AIError('LOVABLE_API_KEY not configured', 'API_ERROR', 500, false);
  }

  const model = request.model || LOVABLE_AI_MODELS.DEFAULT;
  const startTime = Date.now();
  let retryCount = 0;

  try {
    // Wrap in circuit breaker
    const result = await lovableCircuitBreaker.execute(async () => {
      // Wrap in retry logic
      return await retryWithBackoff(
        async () => {
          // Create abort controller for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

          try {
            console.log(`[${functionName}] Calling Lovable AI with model: ${model}, timeout: ${timeoutMs}ms`);

            // Determine model type for parameter compatibility
            const isGeminiModel = model.includes('gemini');
            const isOpenAIModel = model.includes('openai') || model.includes('gpt');
            const maxTokens = request.max_tokens ?? LOVABLE_AI_CONFIG.DEFAULT_MAX_TOKENS;

            // Build the request body with proper parameters for each model type
            const requestBody: any = {
              model,
              messages: request.messages,
            };

            // OpenAI newer models (GPT-5+) don't support temperature or max_tokens parameters
            if (isOpenAIModel) {
              requestBody.max_completion_tokens = maxTokens;
              // GPT-5 models only support temperature=1, so we omit it entirely
            } else {
              requestBody.max_tokens = maxTokens;
              requestBody.temperature = request.temperature ?? LOVABLE_AI_CONFIG.DEFAULT_TEMPERATURE;
            }

            // Handle JSON output mode based on model type
            if (request.response_mime_type) {
              // Gemini-style JSON mode
              if (isGeminiModel) {
                requestBody.response_mime_type = request.response_mime_type;
              } else {
                // Convert to OpenAI format if OpenAI model
                requestBody.response_format = { type: 'json_object' };
              }
            } else if (request.response_format) {
              // OpenAI-style JSON mode (legacy)
              if (isGeminiModel) {
                // Convert to Gemini format
                requestBody.response_mime_type = "application/json";
              } else {
                requestBody.response_format = request.response_format;
              }
            }

            // Add tools if provided
            if (request.tools) {
              requestBody.tools = request.tools;
            }
            if (request.tool_choice) {
              requestBody.tool_choice = request.tool_choice;
            }

            const response = await fetch(LOVABLE_AI_CONFIG.API_URL, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
              signal: controller.signal,
            });

            if (!response.ok) {
              const errorText = await response.text();

              // Handle rate limits (retryable)
              if (response.status === 429) {
                throw new AIError(
                  'Rate limit exceeded',
                  'RATE_LIMIT',
                  429,
                  true,
                  'Too many requests. Please wait a moment and try again.',
                  60
                );
              }

              // Handle payment required (not retryable)
              if (response.status === 402) {
                throw new AIError(
                  'AI credits depleted',
                  'PAYMENT_REQUIRED',
                  402,
                  false,
                  'AI credits depleted. Please add credits to your Lovable workspace.'
                );
              }

              // Server errors (retryable)
              if (response.status >= 500) {
                throw new AIError(
                  `Server error: ${errorText}`,
                  'API_ERROR',
                  response.status,
                  true,
                  'The AI service is temporarily unavailable. Please try again.'
                );
              }

              throw new AIError(
                `Lovable AI error (${response.status}): ${errorText}`,
                'API_ERROR',
                response.status,
                false
              );
            }

            const data: LovableAIResponse = await response.json();
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
            throw error;
          } finally {
            clearTimeout(timeoutId);
          }
        },
        LOVABLE_AI_CONFIG.MAX_RETRIES,
        (attempt, error) => {
          retryCount = attempt;
          console.warn(`[${functionName}] Retry ${attempt}/${LOVABLE_AI_CONFIG.MAX_RETRIES}:`, error.message);
        }
      );
    });

    const executionTime = Date.now() - startTime;

    // Calculate cost and create metrics
    const cost = calculateLovableAICost(
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
    };

    console.log(`[${functionName}] Success - Tokens: ${result.usage.total_tokens}, Cost: $${cost.toFixed(6)}, Time: ${executionTime}ms`);

    return { response: result, metrics };

  } catch (error) {
    const executionTime = Date.now() - startTime;
    const aiError = error instanceof AIError ? error : new AIError(
      error instanceof Error ? error.message : 'Unknown error',
      'API_ERROR',
      500,
      true
    );

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
 * Clean up citations and markdown from AI responses
 */
// Export circuit breaker for monitoring
export { lovableCircuitBreaker };

/**
 * Clean up citations and markdown from AI responses
 */
export function cleanCitations(text: string): string {
  if (!text) return '';
  
  // Remove citation markers like [1], [2], etc.
  let cleaned = text.replace(/\[\d+\]/g, '');
  
  // Remove "Sources:" or "Citations:" sections
  cleaned = cleaned.replace(/\n\n(Sources|Citations):[\s\S]*$/i, '');
  
  // Remove any remaining markdown formatting
  cleaned = cleaned.replace(/[*_~`#]/g, '');
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\n\n+/g, '\n\n').trim();
  
  return cleaned;
}
