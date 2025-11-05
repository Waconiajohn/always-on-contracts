import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { PERPLEXITY_CONFIG } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user ID for cost tracking
    const authHeader = req.headers.get('Authorization');
    let userId: string | undefined;
    if (authHeader) {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
        userId = user?.id;
      } catch (e) {
        console.log('Could not extract user for cost tracking:', e);
      }
    }

    // Build system prompt with Career Vault context
    const systemPrompt = `You are an AI Job Search Assistant powered by the user's Career Vault.

User's Profile:
- Skills: ${context?.skills?.join(', ') || 'Not provided'}
- Target Titles: ${context?.titles?.join(', ') || 'Not provided'}
- Transferable Skills: ${context?.transferableSkills || 0} available
- Current Search: "${context?.query || 'None'}"
- Results Found: ${context?.resultsCount || 0}
- Active Filters: ${context?.activeFilters || 'None'}

Your role:
1. Guide users through job searches with proactive suggestions
2. Recommend filter adjustments based on results
3. Explain why jobs match their background
4. Warn when to use transferable skills (only as last resort)
5. Provide quick actions as buttons in your responses

Style:
- Be conversational but efficient
- Use emojis sparingly for emphasis
- Suggest 2-3 quick actions per response
- Keep responses under 100 words unless explaining complex matches

Format quick actions as:
[Action: Label]

Example:
"I found 23 remote Product Manager positions matching your skills. 8 of these emphasize your healthcare background.

[Action: Show Remote Only]
[Action: View Healthcare Matches]
[Action: Adjust Filters]"`;

    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY is not configured');
    }

    const response = await fetch(PERPLEXITY_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectOptimalModel({
          taskType: 'generation',
          complexity: 'low',
          requiresReasoning: false,
          outputLength: 'short'
        }),
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Track token usage from streaming response (estimate for now)
    // Note: Streaming responses don't provide token counts, so we log after stream completes
    const requestId = `job-search-assistant-${Date.now()}`;
    
    // Estimate tokens (rough approximation: 4 chars per token)
    const estimatedInputTokens = Math.ceil(JSON.stringify(messages).length / 4);
    
    // Create a transform stream to count output tokens
    const { readable, writable } = new TransformStream();
    let outputText = '';
    
    response.body?.pipeTo(writable);
    
    const trackingReader = readable.getReader();
    const trackingStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await trackingReader.read();
            if (done) {
              // Log usage after stream completes
              const estimatedOutputTokens = Math.ceil(outputText.length / 4);
              const cost = ((estimatedInputTokens * 0.001) + (estimatedOutputTokens * 0.001)) / 1000; // HUGE model pricing
              
              await logAIUsage({
                function_name: 'job-search-assistant',
                model: selectOptimalModel({
                  taskType: 'generation',
                  complexity: 'low',
                  requiresReasoning: false,
                  outputLength: 'short'
                }),
                input_tokens: estimatedInputTokens,
                output_tokens: estimatedOutputTokens,
                cost_usd: cost,
                request_id: requestId,
                user_id: userId,
                created_at: new Date().toISOString()
              });
              
              controller.close();
              break;
            }
            
            // Track output for token estimation
            const chunk = new TextDecoder().decode(value);
            outputText += chunk;
            
            controller.enqueue(value);
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(trackingStream, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Job search assistant error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
