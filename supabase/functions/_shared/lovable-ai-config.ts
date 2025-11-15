/**
 * Lovable AI Gateway Configuration
 * 
 * Provides access to Google Gemini models via Lovable AI Gateway
 * Used for: structured extraction, content generation, and conversational AI
 */

export const LOVABLE_AI_MODELS = {
  // Default: Balanced performance and cost
  DEFAULT: 'google/gemini-2.5-flash',
  
  // Premium: Best quality for complex reasoning
  PREMIUM: 'google/gemini-2.5-pro',
  
  // Fast: Cheapest for simple tasks
  FAST: 'google/gemini-2.5-flash-lite',
  
  // Image generation
  IMAGE: 'google/gemini-2.5-flash-image',
} as const;

export const LOVABLE_AI_CONFIG = {
  API_URL: 'https://ai.gateway.lovable.dev/v1/chat/completions',
  DEFAULT_TEMPERATURE: 0.3,
  DEFAULT_MAX_TOKENS: 4000,
  
  // Pricing per 1M tokens (accurate as of 2025)
  PRICING: {
    'google/gemini-2.5-flash': { input: 0.30, output: 2.50 },
    'google/gemini-2.5-pro': { input: 2.50, output: 10.00 },
    'google/gemini-2.5-flash-lite': { input: 0.10, output: 0.80 },
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
  response_format?: { type: 'json_object' };
}

interface LovableAIResponse {
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
 * Call Lovable AI Gateway with automatic retry logic and cost tracking
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
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const model = request.model || LOVABLE_AI_MODELS.DEFAULT;
  const startTime = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(LOVABLE_AI_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature ?? LOVABLE_AI_CONFIG.DEFAULT_TEMPERATURE,
        max_tokens: request.max_tokens ?? LOVABLE_AI_CONFIG.DEFAULT_MAX_TOKENS,
        response_format: request.response_format,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle rate limits
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few moments.');
      }
      
      // Handle payment required
      if (response.status === 402) {
        throw new Error('AI credits depleted. Please add credits to your Lovable workspace.');
      }
      
      throw new Error(`Lovable AI error (${response.status}): ${errorText}`);
    }

    const data: LovableAIResponse = await response.json();
    const executionTime = Date.now() - startTime;

    const metrics: AIUsageMetrics = {
      function_name: functionName,
      model,
      input_tokens: data.usage.prompt_tokens,
      output_tokens: data.usage.completion_tokens,
      cost_usd: calculateLovableAICost(model, data.usage.prompt_tokens, data.usage.completion_tokens),
      request_id: data.id,
      user_id: userId,
      created_at: new Date().toISOString(),
      execution_time_ms: executionTime,
    };

    return { response: data, metrics };

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
    throw new Error('Unknown error calling Lovable AI');
  }
}
