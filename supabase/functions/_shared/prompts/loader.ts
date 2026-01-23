/**
 * Prompt Loader - Loads prompts from database with fallback to registry
 * Enables admin editing of prompts without code changes
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { PROMPT_REGISTRY, ManagedPrompt } from './registry.ts';

/**
 * Get a prompt with database override support
 * Checks admin_prompt_overrides first, falls back to PROMPT_REGISTRY
 */
export async function getPromptWithOverride(promptId: string): Promise<{
  systemPrompt: string;
  userPromptTemplate: string | null;
  source: 'database' | 'registry';
  version?: string;
}> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check for active override in database
    const { data: override, error } = await supabase
      .from('admin_prompt_overrides')
      .select('override_prompt, is_active')
      .eq('prompt_id', promptId)
      .eq('is_active', true)
      .maybeSingle();
    
    if (!error && override?.override_prompt) {
      console.log(`[prompt-loader] Using database override for: ${promptId}`);
      return {
        systemPrompt: override.override_prompt,
        userPromptTemplate: null, // Templates not supported in overrides yet
        source: 'database'
      };
    }
  } catch (err) {
    console.warn(`[prompt-loader] Error checking override for ${promptId}:`, err);
    // Fall through to registry
  }
  
  // Fall back to registry
  const registryEntry = Object.values(PROMPT_REGISTRY).find(p => p.id === promptId);
  
  if (registryEntry) {
    console.log(`[prompt-loader] Using registry for: ${promptId}`);
    return {
      systemPrompt: registryEntry.systemPrompt || '',
      userPromptTemplate: null, // Template is a function, can't serialize
      source: 'registry',
      version: registryEntry.version
    };
  }
  
  console.warn(`[prompt-loader] Prompt not found: ${promptId}`);
  return {
    systemPrompt: '',
    userPromptTemplate: null,
    source: 'registry'
  };
}

/**
 * Get all available prompt IDs from the registry
 */
export function getAllPromptIds(): Array<{ id: string; name: string; systemPrompt: string }> {
  return Object.entries(PROMPT_REGISTRY).map(([key, value]) => ({
    id: value.id,
    name: key.replace(/_/g, ' ').replace(/V\d+$/, '').trim(),
    systemPrompt: value.systemPrompt || ''
  }));
}

/**
 * Hardcoded prompts that can be loaded by ID
 * These are the actual prompts used in edge functions
 */
export const EDGE_FUNCTION_PROMPTS: Record<string, {
  id: string;
  name: string;
  systemPrompt: string;
  description: string;
}> = {
  'instant-resume-score': {
    id: 'instant-resume-score',
    name: 'Quick Score Analysis',
    systemPrompt: `You are an expert resume analyst. Analyze the resume against the job description.

EXTRACTION RULES:
1. Extract the TOP 20 most important matched keywords (critical/high priority first)
2. Extract the TOP 15 most important missing keywords (critical/high priority first)
3. Focus on technical skills, certifications, key competencies, and industry-specific terms
4. Keywords should be single terms or short phrases (1-4 words)

SCORING WEIGHTS: jdMatch=60%, industryBenchmark=20%, atsCompliance=12%, humanVoice=8%`,
    description: 'Analyzes resume against job description for keyword matches and gaps'
  },
  'hiring-manager-review': {
    id: 'hiring-manager-review',
    name: 'Hiring Manager Review',
    systemPrompt: `You are a senior hiring manager reviewing resumes. Provide critical, honest feedback on whether you would interview this candidate and what would make their resume stand out.

Be specific about:
1. First impressions (would you continue reading?)
2. Key strengths that catch your eye
3. Red flags or concerns
4. Missing elements for this role
5. Overall interview decision (Yes/Maybe/No)`,
    description: 'Simulates hiring manager review with critical feedback'
  },
  'optimize-resume': {
    id: 'optimize-resume',
    name: 'Resume Optimization',
    systemPrompt: `You are an expert resume writer. Optimize the resume to better match the job description while maintaining authenticity.

RULES:
1. Never fabricate experience or skills
2. Reframe existing experience to highlight relevance
3. Add missing keywords where genuine experience supports them
4. Improve bullet points with metrics and impact
5. Maintain the candidate's authentic voice`,
    description: 'Optimizes resume content to better match job requirements'
  },
  'keyword-analysis': {
    id: 'keyword-analysis',
    name: 'Keyword Analysis',
    systemPrompt: `You are an ATS and keyword expert. Analyze keywords from the job description and identify which are present or missing in the resume.

OUTPUT RULES:
1. Return only the keyword text - no context phrases needed
2. Classify each as critical, high, or medium priority
3. Include technical skills, soft skills, certifications, and industry terms
4. Limit to most important keywords (20 matched, 15 missing max)`,
    description: 'Lightweight keyword extraction without context'
  }
};

/**
 * Load an edge function prompt with database override support
 */
export async function loadEdgeFunctionPrompt(functionName: string): Promise<string> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check for active override
    const { data: override } = await supabase
      .from('admin_prompt_overrides')
      .select('override_prompt')
      .eq('prompt_id', functionName)
      .eq('is_active', true)
      .maybeSingle();
    
    if (override?.override_prompt) {
      console.log(`[prompt-loader] Using DB override for: ${functionName}`);
      return override.override_prompt;
    }
  } catch (err) {
    console.warn(`[prompt-loader] DB check failed for ${functionName}:`, err);
  }
  
  // Fall back to hardcoded
  const prompt = EDGE_FUNCTION_PROMPTS[functionName];
  return prompt?.systemPrompt || '';
}
