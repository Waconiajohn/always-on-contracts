import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';
import { sanitizeForAI, stripPII } from '../_shared/rb-schemas.ts';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';
import { checkRateLimit } from '../_shared/rate-limiter.ts';
import { RESUME_ARCHITECT_SYSTEM_PROMPT } from '../_shared/resume-prompts.ts';

interface ScoreTier {
  tier: 'FREEZING' | 'COLD' | 'LUKEWARM' | 'WARM' | 'HOT' | 'ON_FIRE';
  emoji: string;
  color: string;
  message: string;
}

function getScoreTier(score: number): ScoreTier {
  if (score <= 20) return { tier: 'FREEZING', emoji: '🥶', color: '#1E40AF', message: 'Major gaps - needs significant work' };
  if (score <= 40) return { tier: 'COLD', emoji: '❄️', color: '#3B82F6', message: 'Many missing keywords and gaps' };
  if (score <= 60) return { tier: 'LUKEWARM', emoji: '😐', color: '#F59E0B', message: 'Getting there, but improvements needed' };
  if (score <= 75) return { tier: 'WARM', emoji: '🔥', color: '#F97316', message: 'Good match, minor optimizations left' };
  if (score <= 90) return { tier: 'HOT', emoji: '🌟', color: '#EF4444', message: 'Strong match - ready to apply!' };
  return { tier: 'ON_FIRE', emoji: '🚀', color: '#DC2626', message: 'Exceptional match - top candidate!' };
}

// Normalize keyword arrays to ensure consistent structure
// AI may return keywords with various property names (name, term, skill, text, value)
// Now includes category, type, and context fields for organized display
function normalizeKeywordArray(arr: unknown): Array<{
  keyword: string;
  priority: 'critical' | 'high' | 'medium';
  category?: 'required' | 'preferred' | 'nice-to-have';
  type?: 'technical' | 'domain' | 'leadership' | 'soft' | 'certification' | 'tool';
  frequency?: number;
  jdContext?: string;
  resumeContext?: string;
  suggestedPhrasing?: string;
}> {
  if (!Array.isArray(arr)) {
    console.warn('[instant-resume-score] Keywords not an array:', typeof arr);
    return [];
  }

  return arr
    .map((item, index) => {
      // Handle plain strings
      if (typeof item === 'string') {
        const keyword = item.trim();
        return keyword ? { keyword, priority: 'high' as const } : null;
      }

      // Handle objects with various property names AI might use
      if (item && typeof item === 'object') {
        const keyword = (
          item.keyword || item.name || item.term || 
          item.skill || item.text || item.value || ''
        ).toString().trim();
        
        if (!keyword) {
          console.warn(`[instant-resume-score] Empty keyword at index ${index}:`, JSON.stringify(item).substring(0, 100));
          return null;
        }
        
        const priority = ['critical', 'high', 'medium'].includes(item.priority) 
          ? item.priority as 'critical' | 'high' | 'medium'
          : 'high';

        // Normalize category (required/preferred/nice-to-have)
        const validCategories = ['required', 'preferred', 'nice-to-have'];
        const category = validCategories.includes(item.category) 
          ? item.category as 'required' | 'preferred' | 'nice-to-have'
          : undefined;

        // Normalize type (technical/domain/leadership/soft/certification/tool)
        const validTypes = ['technical', 'domain', 'leadership', 'soft', 'certification', 'tool'];
        const type = validTypes.includes(item.type)
          ? item.type as 'technical' | 'domain' | 'leadership' | 'soft' | 'certification' | 'tool'
          : undefined;

        return {
          keyword,
          priority,
          category,
          type,
          frequency: typeof item.frequency === 'number' ? item.frequency : undefined,
          jdContext: typeof item.jdContext === 'string' ? item.jdContext : 
                     typeof item.context === 'string' ? item.context : undefined,
          resumeContext: typeof item.resumeContext === 'string' ? item.resumeContext : undefined,
          suggestedPhrasing: typeof item.suggestedPhrasing === 'string' ? item.suggestedPhrasing :
                             typeof item.suggestion === 'string' ? item.suggestion : undefined,
        };
      }
      
      console.warn(`[instant-resume-score] Invalid keyword type at index ${index}:`, typeof item);
      return null;
    })
    .filter((k): k is NonNullable<typeof k> => k !== null && k.keyword.length > 0);
}

// Normalize gap analysis arrays to ensure required fields exist
function normalizeGapArray<T extends Record<string, unknown>>(
  arr: unknown, 
  requiredFields: string[]
): T[] {
  if (!Array.isArray(arr)) {
    console.warn('[instant-resume-score] Gap array not an array:', typeof arr);
    return [];
  }

  return arr.filter((item, index) => {
    if (!item || typeof item !== 'object') {
      console.warn(`[instant-resume-score] Invalid gap item at index ${index}:`, typeof item);
      return false;
    }
    
    // Check all required fields are non-empty strings
    for (const field of requiredFields) {
      const value = (item as Record<string, unknown>)[field];
      if (!value || (typeof value === 'string' && !value.trim())) {
        console.warn(`[instant-resume-score] Missing ${field} in gap item at index ${index}:`, JSON.stringify(item).substring(0, 100));
        return false;
      }
    }
    return true;
  }) as T[];
}

serve(async (req) => {
  const requestOrigin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(requestOrigin);

  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(requestOrigin);
  }

  try {
    const startTime = Date.now();

    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[instant-resume-score] No auth header provided');
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with user's auth token to validate
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claims?.claims?.sub) {
      console.log('[instant-resume-score] Invalid token:', claimsError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claims.claims.sub as string;
    console.log('[instant-resume-score] Authenticated user:', userId);

    // Rate limiting check (10 requests per minute)
    const rateCheck = await checkRateLimit(userId, 'instant-resume-score', 10);
    if (!rateCheck.allowed) {
      console.log('[instant-resume-score] Rate limit exceeded for user:', userId);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Rate limit exceeded. Please wait before trying again.',
          retryAfter: rateCheck.retryAfter 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateCheck.retryAfter || 60)
          } 
        }
      );
    }

    const { resumeText, jobDescription, targetRole, targetIndustry, targetLevel } = await req.json();

    if (!resumeText || !jobDescription) {
      throw new Error('Resume text and job description are required');
    }

    // Sanitize user inputs before processing
    const sanitizedResume = stripPII(sanitizeForAI(resumeText));
    const sanitizedJD = sanitizeForAI(jobDescription);

    // Use service role client for data operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // STEP 1: Detect role and industry if not provided
    let detectedRole = targetRole;
    let detectedIndustry = targetIndustry;
    let detectedLevel = targetLevel;

    if (!detectedRole || !detectedIndustry) {
      const roleDetectionPrompt = `Analyze this job description and resume to detect:
1. Target job title/role
2. Industry
3. Seniority level (Entry-Level, Mid-Level, Senior, Executive)

JOB DESCRIPTION:
${sanitizedJD.substring(0, 2000)}

RESUME (first 1000 chars):
${sanitizedResume.substring(0, 1000)}

Return JSON: { "role": "...", "industry": "...", "level": "..." }`;

      const { response: roleResponse } = await callLovableAI({
        messages: [
          { role: 'system', content: 'Return only valid JSON, no explanation.' },
          { role: 'user', content: roleDetectionPrompt }
        ],
        model: LOVABLE_AI_MODELS.FAST,
        temperature: 0.1,
        max_tokens: 200,
        response_format: { type: 'json_object' }
      }, 'instant-resume-score-detect');

      try {
        const detected = JSON.parse(roleResponse.choices[0].message.content);
        detectedRole = detected.role || 'Professional';
        detectedIndustry = detected.industry || 'General';
        detectedLevel = detected.level || 'Mid-Level';
      } catch {
        detectedRole = 'Professional';
        detectedIndustry = 'General';
        detectedLevel = 'Mid-Level';
      }
    }

    // STEP 2: Use tool calling with COMPREHENSIVE analysis schema
    // This schema matches the comprehensive prompts for organized output
    const scoringTool = {
      type: "function" as const,
      function: {
        name: "return_score_analysis",
        description: "Return the complete resume score analysis with organized competencies and hiring priorities",
        parameters: {
          type: "object",
          properties: {
            scores: {
              type: "object",
              properties: {
                jdMatch: { type: "object", properties: { score: { type: "number" }, weight: { type: "number" } }, required: ["score", "weight"] },
                industryBenchmark: { type: "object", properties: { score: { type: "number" }, weight: { type: "number" } }, required: ["score", "weight"] },
                atsCompliance: { type: "object", properties: { score: { type: "number" }, weight: { type: "number" } }, required: ["score", "weight"] },
                humanVoice: { type: "object", properties: { score: { type: "number" }, weight: { type: "number" } }, required: ["score", "weight"] }
              },
              required: ["jdMatch", "industryBenchmark", "atsCompliance", "humanVoice"]
            },
            breakdown: {
              type: "object",
              properties: {
                jdMatch: {
                  type: "object",
                  properties: {
                    // ORGANIZED keyword structure - by category
                    matchedKeywords: {
                      type: "array",
                      description: "Keywords found in both JD and resume, with context",
                      items: {
                        type: "object",
                        properties: {
                          keyword: { type: "string", description: "The exact keyword/skill (1-4 words)" },
                          priority: { type: "string", enum: ["critical", "high", "medium"] },
                          category: { type: "string", enum: ["required", "preferred", "nice-to-have"], description: "How the JD categorizes this requirement" },
                          type: { type: "string", enum: ["technical", "domain", "leadership", "soft", "certification", "tool"] },
                          jdContext: { type: "string", description: "1-2 sentence quote from JD showing how this keyword is used" },
                          resumeContext: { type: "string", description: "1-2 sentence quote from resume showing how candidate demonstrates this" }
                        },
                        required: ["keyword", "priority", "category", "type"]
                      },
                      maxItems: 25
                    },
                    missingKeywords: {
                      type: "array",
                      description: "Keywords in JD but NOT in resume, with suggested phrasing",
                      items: {
                        type: "object",
                        properties: {
                          keyword: { type: "string", description: "The exact keyword/skill (1-4 words)" },
                          priority: { type: "string", enum: ["critical", "high", "medium"] },
                          category: { type: "string", enum: ["required", "preferred", "nice-to-have"] },
                          type: { type: "string", enum: ["technical", "domain", "leadership", "soft", "certification", "tool"] },
                          jdContext: { type: "string", description: "1-2 sentence quote from JD showing why this is important" },
                          suggestedPhrasing: { type: "string", description: "How the candidate could naturally add this to their resume" },
                          frequency: { type: "number", description: "How many times this appears in the JD" }
                        },
                        required: ["keyword", "priority", "category", "type", "jdContext", "suggestedPhrasing"]
                      },
                      maxItems: 20
                    },
                    skillsMatch: { type: "number" },
                    experienceMatch: { type: "number" }
                  },
                  required: ["matchedKeywords", "missingKeywords", "skillsMatch", "experienceMatch"]
                },
                // NEW: Hiring Manager Priorities section
                hiringPriorities: {
                  type: "array",
                  description: "Top 5-8 things the hiring manager REALLY cares about based on JD analysis",
                  items: {
                    type: "object",
                    properties: {
                      priority: { type: "string", description: "What the hiring manager is looking for" },
                      whyItMatters: { type: "string", description: "Why this is important for the role" },
                      evidenceNeeded: { type: "string", description: "What evidence would convince a hiring manager" },
                      candidateStatus: { type: "string", enum: ["strong", "partial", "missing"], description: "How well the candidate demonstrates this" },
                      candidateEvidence: { type: "string", description: "Quote from resume showing this, or null if missing" }
                    },
                    required: ["priority", "whyItMatters", "evidenceNeeded", "candidateStatus"]
                  },
                  maxItems: 8
                },
                industryBenchmark: {
                  type: "object",
                  properties: {
                    roleStandards: { type: "array", items: { type: "string" } },
                    meetingStandards: { type: "array", items: { type: "string" } },
                    belowStandards: { type: "array", items: { type: "string" } },
                    competitiveRank: { type: "string" }
                  },
                  required: ["roleStandards", "meetingStandards", "belowStandards", "competitiveRank"]
                },
                atsCompliance: {
                  type: "object",
                  properties: {
                    headerIssues: { type: "array", items: { type: "string" } },
                    formatIssues: { type: "array", items: { type: "string" } },
                    keywordPlacement: { type: "string", enum: ["good", "poor", "unknown"] }
                  },
                  required: ["headerIssues", "formatIssues", "keywordPlacement"]
                },
                humanVoice: {
                  type: "object",
                  properties: {
                    aiProbability: { type: "number" },
                    concerns: { type: "array", items: { type: "string" } },
                    humanElements: { type: "array", items: { type: "string" } }
                  },
                  required: ["aiProbability", "concerns", "humanElements"]
                }
              },
              required: ["jdMatch", "hiringPriorities", "industryBenchmark", "atsCompliance", "humanVoice"]
            },
            gapAnalysis: {
              type: "object",
              properties: {
                fullMatches: { 
                  type: "array", 
                  items: { 
                    type: "object", 
                    properties: { 
                      requirement: { type: "string" }, 
                      evidence: { type: "string" },
                      strength: { type: "string", enum: ["strong", "adequate"] }
                    } 
                  }, 
                  maxItems: 10 
                },
                partialMatches: { 
                  type: "array", 
                  items: { 
                    type: "object", 
                    properties: { 
                      requirement: { type: "string" }, 
                      currentStatus: { type: "string" }, 
                      recommendation: { type: "string" },
                      severity: { type: "string", enum: ["critical", "important", "nice-to-have"] }
                    } 
                  }, 
                  maxItems: 8 
                },
                missingRequirements: { 
                  type: "array", 
                  items: { 
                    type: "object", 
                    properties: { 
                      requirement: { type: "string" }, 
                      workaround: { type: "string" },
                      severity: { type: "string", enum: ["critical", "important", "nice-to-have"] },
                      interviewRisk: { type: "string", description: "What interview question might expose this gap" }
                    } 
                  }, 
                  maxItems: 8 
                },
                overqualifications: { type: "array", items: { type: "object", properties: { experience: { type: "string" }, recommendation: { type: "string" } } }, maxItems: 3 },
                irrelevantContent: { type: "array", items: { type: "object", properties: { content: { type: "string" }, recommendation: { type: "string" } } }, maxItems: 3 },
                gapSummary: { type: "array", items: { type: "string" }, maxItems: 5 }
              },
              required: ["fullMatches", "partialMatches", "missingRequirements", "gapSummary"]
            },
            quickWins: { type: "array", items: { type: "string" }, maxItems: 5 }
          },
          required: ["scores", "breakdown", "gapAnalysis", "quickWins"]
        }
      }
    };

    // COMPREHENSIVE SYSTEM PROMPT - Uses the shared must-interview framework
    const systemPrompt = `${RESUME_ARCHITECT_SYSTEM_PROMPT}

## ADDITIONAL SCORING RULES:

1. **ORGANIZED KEYWORD EXTRACTION**
   - Group keywords by category: required, preferred, nice-to-have
   - Tag each keyword by type: technical, domain, leadership, soft, certification, tool
   - For MATCHED keywords: include exact quotes from BOTH the JD and resume showing context
   - For MISSING keywords: include JD context AND a suggested phrasing for the candidate

2. **HIRING MANAGER PRIORITIES**
   - Identify 5-8 things that would make a hiring manager say "we MUST interview this person"
   - For each priority, explain WHY it matters and what EVIDENCE would be convincing
   - Assess the candidate's current status: strong, partial, or missing

3. **GAP SEVERITY LEVELS**
   - critical: Would likely result in rejection
   - important: Would hurt chances but not disqualify
   - nice-to-have: Would strengthen application

4. **INTERVIEW RISK AWARENESS**
   - For each missing requirement, note what interview question might expose this gap
   - This helps the candidate prepare or address the gap proactively

SCORING WEIGHTS: jdMatch=60%, industryBenchmark=20%, atsCompliance=12%, humanVoice=8%`;

    const userPrompt = `ROLE: ${detectedRole} | INDUSTRY: ${detectedIndustry} | LEVEL: ${detectedLevel}

## JOB DESCRIPTION:
${sanitizedJD.substring(0, 6000)}

## RESUME:
${sanitizedResume.substring(0, 6000)}

Analyze this resume against the job description and return a COMPREHENSIVE analysis.

Your analysis must:
1. Score the resume on all 4 dimensions (jdMatch, industryBenchmark, atsCompliance, humanVoice)
2. Extract ALL relevant keywords, organized by category (required/preferred/nice-to-have) and type
3. For MATCHED keywords: provide context quotes from BOTH the JD and resume
4. For MISSING keywords: provide JD context AND a suggested phrasing for how to add it
5. Identify the TOP 5-8 hiring manager priorities and assess the candidate's status on each
6. Provide gap analysis with severity levels (critical/important/nice-to-have)
7. Include interview risk notes for missing requirements

Return via the return_score_analysis function.`;

    let scoreData: any;
    let metrics: any;

    try {
      const result = await callLovableAI({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.1,
        max_tokens: 8000,
        tools: [scoringTool],
        tool_choice: { type: "function", function: { name: "return_score_analysis" } }
      }, 'instant-resume-score');

      metrics = result.metrics;
      await logAIUsage(metrics);

      // Extract from tool call response
      const toolCall = result.response.choices[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const args = typeof toolCall.function.arguments === 'string' 
          ? JSON.parse(toolCall.function.arguments) 
          : toolCall.function.arguments;
        scoreData = args;
        console.log('[instant-resume-score] Tool call parsing successful');
      } else {
        // Fallback: try to parse from content
        const rawContent = result.response.choices[0]?.message?.content || '';
        const parseResult = extractJSON(rawContent);
        if (!parseResult.success || !parseResult.data) {
          throw new Error('No tool call and content parse failed');
        }
        scoreData = parseResult.data;
        console.log('[instant-resume-score] Content fallback parsing successful');
      }
    } catch (primaryError) {
      console.error('[instant-resume-score] Primary model failed:', primaryError);
      
      // Fallback to simpler model with reduced prompt
      console.log('[instant-resume-score] Trying fallback model...');
      const fallbackResult = await callLovableAI({
        messages: [
          { role: 'system', content: 'You are a resume analyst. Return JSON with scores and analysis.' },
          { role: 'user', content: `Analyze this resume against the job description. Return JSON with: scores (jdMatch, industryBenchmark, atsCompliance, humanVoice each with score 0-100 and weight), breakdown (jdMatch with matchedKeywords array and missingKeywords array), gapAnalysis (fullMatches, partialMatches, missingRequirements arrays), quickWins array.

JOB: ${sanitizedJD.substring(0, 2000)}

RESUME: ${sanitizedResume.substring(0, 3000)}` }
        ],
        model: LOVABLE_AI_MODELS.FAST,
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      }, 'instant-resume-score-fallback');

      metrics = fallbackResult.metrics;
      await logAIUsage(metrics);

      const rawContent = fallbackResult.response.choices[0]?.message?.content || '';
      const parseResult = extractJSON(rawContent);
      if (!parseResult.success || !parseResult.data) {
        console.error('[instant-resume-score] Fallback also failed:', rawContent.substring(0, 500));
        throw new Error('Failed to parse scoring response after fallback');
      }
      scoreData = parseResult.data;
      console.log('[instant-resume-score] Fallback parsing successful');
    }

    // Calculate weighted overall score (60/20/12/8) with null safety
    const jdMatchScore = scoreData?.scores?.jdMatch?.score ?? 0;
    const industryScore = scoreData?.scores?.industryBenchmark?.score ?? 0;
    const atsScore = scoreData?.scores?.atsCompliance?.score ?? 0;
    const humanScore = scoreData?.scores?.humanVoice?.score ?? 0;

    const weightedScore =
      (jdMatchScore * 0.60) +
      (industryScore * 0.20) +
      (atsScore * 0.12) +
      (humanScore * 0.08);

    const overallScore = Math.round(weightedScore);
    const tier = getScoreTier(overallScore);

    // Calculate next tier threshold
    let nextTierThreshold = 100;
    let pointsToNextTier = 0;
    if (overallScore <= 20) { nextTierThreshold = 21; pointsToNextTier = 21 - overallScore; }
    else if (overallScore <= 40) { nextTierThreshold = 41; pointsToNextTier = 41 - overallScore; }
    else if (overallScore <= 60) { nextTierThreshold = 61; pointsToNextTier = 61 - overallScore; }
    else if (overallScore <= 75) { nextTierThreshold = 76; pointsToNextTier = 76 - overallScore; }
    else if (overallScore <= 90) { nextTierThreshold = 91; pointsToNextTier = 91 - overallScore; }

    const executionTime = Date.now() - startTime;

    // Normalize and validate gapAnalysis arrays
    const gapAnalysis = {
      fullMatches: normalizeGapArray<{ requirement: string; evidence: string }>(
        scoreData.gapAnalysis?.fullMatches, 
        ['requirement', 'evidence']
      ),
      partialMatches: normalizeGapArray<{ requirement: string; currentStatus: string; recommendation: string }>(
        scoreData.gapAnalysis?.partialMatches,
        ['requirement', 'currentStatus', 'recommendation']
      ),
      missingRequirements: normalizeGapArray<{ requirement: string; workaround: string }>(
        scoreData.gapAnalysis?.missingRequirements,
        ['requirement', 'workaround']
      ),
      overqualifications: normalizeGapArray<{ experience: string; recommendation: string }>(
        scoreData.gapAnalysis?.overqualifications,
        ['experience']
      ),
      irrelevantContent: normalizeGapArray<{ content: string; recommendation: string }>(
        scoreData.gapAnalysis?.irrelevantContent,
        ['content']
      ),
      gapSummary: Array.isArray(scoreData.gapAnalysis?.gapSummary)
        ? scoreData.gapAnalysis.gapSummary.filter((s: unknown) => typeof s === 'string' && s.trim())
        : []
    };

    // Normalize and validate keyword arrays
    const normalizedMatchedKeywords = normalizeKeywordArray(scoreData.breakdown?.jdMatch?.matchedKeywords);
    const normalizedMissingKeywords = normalizeKeywordArray(scoreData.breakdown?.jdMatch?.missingKeywords);

    console.log('[instant-resume-score] Normalized keywords:', {
      matchedRaw: scoreData.breakdown?.jdMatch?.matchedKeywords?.length || 0,
      matchedNormalized: normalizedMatchedKeywords.length,
      missingRaw: scoreData.breakdown?.jdMatch?.missingKeywords?.length || 0,
      missingNormalized: normalizedMissingKeywords.length,
      firstMatchedKw: normalizedMatchedKeywords[0]?.keyword,
      firstMissingKw: normalizedMissingKeywords[0]?.keyword
    });

    // Ensure breakdown has all required fields with normalized keywords
    // Now includes hiringPriorities for organized display
    const breakdown = {
      jdMatch: {
        matchedKeywords: normalizedMatchedKeywords,
        missingKeywords: normalizedMissingKeywords,
        skillsMatch: scoreData.breakdown?.jdMatch?.skillsMatch || 0,
        experienceMatch: scoreData.breakdown?.jdMatch?.experienceMatch || 0
      },
      // NEW: Hiring manager priorities with candidate status
      hiringPriorities: Array.isArray(scoreData.breakdown?.hiringPriorities)
        ? scoreData.breakdown.hiringPriorities.filter((p: any) => 
            p && typeof p === 'object' && p.priority && p.whyItMatters
          ).map((p: any) => ({
            priority: p.priority || '',
            whyItMatters: p.whyItMatters || '',
            evidenceNeeded: p.evidenceNeeded || '',
            candidateStatus: ['strong', 'partial', 'missing'].includes(p.candidateStatus) 
              ? p.candidateStatus 
              : 'missing',
            candidateEvidence: p.candidateEvidence || null
          }))
        : [],
      industryBenchmark: {
        roleStandards: scoreData.breakdown?.industryBenchmark?.roleStandards || [],
        meetingStandards: scoreData.breakdown?.industryBenchmark?.meetingStandards || [],
        belowStandards: scoreData.breakdown?.industryBenchmark?.belowStandards || [],
        competitiveRank: scoreData.breakdown?.industryBenchmark?.competitiveRank || 'Unknown'
      },
      atsCompliance: {
        headerIssues: scoreData.breakdown?.atsCompliance?.headerIssues || [],
        formatIssues: scoreData.breakdown?.atsCompliance?.formatIssues || [],
        keywordPlacement: scoreData.breakdown?.atsCompliance?.keywordPlacement || 'unknown'
      },
      humanVoice: {
        aiProbability: scoreData.breakdown?.humanVoice?.aiProbability || 0,
        concerns: scoreData.breakdown?.humanVoice?.concerns || [],
        humanElements: scoreData.breakdown?.humanVoice?.humanElements || []
      }
    };

    // Generate priorityFixes from gapAnalysis for backward compatibility
    const priorityFixes: any[] = [];
    let priority = 1;
    
    // Add ALL missing requirements as critical fixes
    for (const item of gapAnalysis.missingRequirements) {
      priorityFixes.push({
        priority: priority++,
        category: 'jdMatch',
        gapType: 'missing_requirement',
        issue: item.requirement,
        fix: item.workaround,
        impact: '+15 points'
      });
    }
    
    // Add ALL partial matches as important fixes
    for (const item of gapAnalysis.partialMatches) {
      priorityFixes.push({
        priority: priority++,
        category: 'jdMatch',
        gapType: 'partial_match',
        issue: item.currentStatus,
        fix: item.recommendation,
        impact: '+10 points'
      });
    }

    const result = {
      success: true,
      overallScore,
      tier,
      nextTierThreshold,
      pointsToNextTier,
      scores: scoreData.scores,
      breakdown,
      gapAnalysis,
      priorityFixes,
      quickWins: scoreData.quickWins || [],
      detected: {
        role: detectedRole,
        industry: detectedIndustry,
        level: detectedLevel
      },
      executionTimeMs: executionTime,
      analyzedAt: new Date().toISOString()
    };

    console.log('[instant-resume-score] Analysis complete:', {
      score: overallScore,
      tier: tier.tier,
      fullMatches: gapAnalysis.fullMatches.length,
      partialMatches: gapAnalysis.partialMatches.length,
      missing: gapAnalysis.missingRequirements.length
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in instant-resume-score:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
