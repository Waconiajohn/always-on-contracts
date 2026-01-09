import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { callLovableAI, LOVABLE_AI_MODELS } from "../_shared/lovable-ai-config.ts";
import { extractJSON } from "../_shared/json-parser.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= Types =============
interface ConfirmedFacts {
  [fieldKey: string]: string | number | string[] | { min: number; max: number };
}

interface Executive50PlusPreferences {
  hideGraduationYears: boolean;
  experienceCondensationYears: number;
  includeAdditionalExperience: boolean;
  signatureWinsPosition: 'top' | 'inline';
}

type ResumeMode = 'interview-safe' | 'brainstorm';

interface CustomizationSettings {
  intensity: 'conservative' | 'moderate' | 'aggressive';
  tone: 'formal' | 'conversational' | 'technical' | 'executive';
}

interface BenchmarkResumeRequest {
  resumeText: string;
  jobDescription: string;
  fitBlueprint: any;
  confirmedFacts?: ConfirmedFacts;
  missingBulletResponses?: Record<string, string>; // Legacy support
  customization?: CustomizationSettings;
  executive50PlusPrefs?: Executive50PlusPreferences;
  resumeMode?: ResumeMode;
}

// ============= Helper Functions =============

function formatConfirmedFacts(confirmedFacts: ConfirmedFacts): string {
  if (!confirmedFacts || Object.keys(confirmedFacts).length === 0) {
    return '';
  }
  
  const lines: string[] = [];
  for (const [key, value] of Object.entries(confirmedFacts)) {
    if (value === null || value === undefined || value === '') continue;
    
    if (typeof value === 'object' && 'min' in value && 'max' in value) {
      lines.push(`- ${key}: ${value.min}-${value.max}`);
    } else if (Array.isArray(value)) {
      lines.push(`- ${key}: ${value.join(', ')}`);
    } else {
      lines.push(`- ${key}: ${value}`);
    }
  }
  
  return lines.length > 0 
    ? `USER-CONFIRMED FACTS (verified, use these exact figures):\n${lines.join('\n')}` 
    : '';
}

function buildExecutive50PlusInstructions(prefs?: Executive50PlusPreferences): string {
  if (!prefs) return '';
  
  const instructions: string[] = [];
  
  if (prefs.hideGraduationYears) {
    instructions.push('- OMIT graduation years from education section');
  }
  
  if (prefs.experienceCondensationYears) {
    instructions.push(`- Condense experience older than ${prefs.experienceCondensationYears} years into "Additional Experience" section`);
    if (!prefs.includeAdditionalExperience) {
      instructions.push('- Do NOT include the Additional Experience section at all');
    }
  }
  
  if (prefs.signatureWinsPosition === 'top') {
    instructions.push('- Place "Signature Wins" or "Career Highlights" section BEFORE detailed experience');
  }
  
  return instructions.length > 0
    ? `\nEXECUTIVE 50+ FORMATTING RULES:\n${instructions.join('\n')}`
    : '';
}

function buildModeInstructions(mode: ResumeMode): string {
  if (mode === 'interview-safe') {
    return `
RESUME MODE: INTERVIEW-SAFE (DEFAULT)
- ONLY use claims backed by verified evidence (E tags) or user-confirmed facts
- Every metric, scope claim, and achievement MUST have evidence support
- Do NOT extrapolate or embellish beyond what's proven
- If evidence is weak, use softer language or omit the claim
- Mark any inference with [NEEDS-CONFIRMATION] if included`;
  } else {
    return `
RESUME MODE: BRAINSTORM
- You may include plausible inferences and suggestions
- Mark speculative content with [SUGGESTION] tag
- Still avoid outright fabrication
- User understands this is a working draft`;
  }
}

// ============= Main Handler =============

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Use getUser with the token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authenticated user:', user.id);

    const body: BenchmarkResumeRequest = await req.json();
    const { 
      resumeText, 
      jobDescription, 
      fitBlueprint, 
      confirmedFacts,
      missingBulletResponses, // Legacy
      customization,
      executive50PlusPrefs,
      resumeMode = 'interview-safe'
    } = body;
    
    if (!resumeText || !jobDescription || !fitBlueprint) {
      throw new Error('Resume text, job description, and fit blueprint are required');
    }

    console.log('Generating benchmark resume with mode:', resumeMode);
    console.log('Confirmed facts count:', Object.keys(confirmedFacts || {}).length);

    // ============= Build System Prompt =============
    const systemPrompt = `You are an elite resume writer producing "Benchmark Resumes" — the resumes hiring teams measure other candidates against. Your writing is crisp, metrics-forward, and structurally aligned to the role's success criteria.

CRITICAL PRINCIPLES:
1. EVIDENCE-FIRST: Every claim must map to evidence IDs (E1, E2) or user-confirmed facts
2. NO FABRICATION: Never invent metrics, tools, titles, scope, or ownership
3. INTERVIEW-SAFE: Everything you write must be defensible in an interview
4. RUBRIC-ALIGNED: Structure resume to highlight competencies in the role success rubric

${buildModeInstructions(resumeMode)}

VERIFICATION RULES:
- Verified bullets use evidence tags: [E1, E3] or confirmed fact references
- If a requirement has a gap, you may:
  a) De-emphasize it (don't highlight)
  b) Reframe adjacent experience truthfully
  c) Include in "Exposure" line (if truly minimal exposure exists)
  d) NEVER claim ownership you don't have evidence for

STRUCTURE FOR BENCHMARK RESUME:

1. HEADER & BRANDING
   - Use target title from JD (or truthful equivalent)
   - Add 1-line branding statement aligned to role outcomes

2. SIGNATURE WINS (Optional - for senior roles)
   - 3-5 executive-level outcomes
   - Only if evidence strongly supports

3. PROFESSIONAL SUMMARY (5-7 lines)
   - Scope (years, domains)
   - Lifecycle ownership
   - Leadership dimension
   - 1-2 concrete proof points with evidence

4. CORE COMPETENCIES (12-16 items)
   - Aligned to JD keywords
   - Only include what's evidenced

5. PROFESSIONAL EXPERIENCE
   - 1-line role framing per position
   - 5-8 bullets per role, ordered by: outcomes → leadership → systems → tools
   - Each bullet ends with [E#, R#] traceability tags

6. TOOLS & PLATFORMS
   - Only list evidenced tools
   - Use "Workflow platforms (multiple)" for gaps with equivalents

7. EDUCATION & CERTIFICATIONS
   - Follow 50+ rules if specified

${buildExecutive50PlusInstructions(executive50PlusPrefs)}`;

    // ============= Build User Prompt =============
    const confirmedFactsBlock = formatConfirmedFacts(confirmedFacts || {});
    const legacyResponses = missingBulletResponses || {};
    const legacyResponsesBlock = Object.keys(legacyResponses).length > 0 
      ? `LEGACY USER RESPONSES:\n${Object.entries(legacyResponses).map(([id, resp]) => `- ${id}: ${resp}`).join('\n')}`
      : '';

    // Extract rubric and pattern if available
    const rubricContext = fitBlueprint.roleSuccessRubric 
      ? `\nROLE SUCCESS RUBRIC:\n${JSON.stringify(fitBlueprint.roleSuccessRubric, null, 2)}`
      : '';
    
    const patternContext = fitBlueprint.benchmarkResumePattern
      ? `\nBENCHMARK PATTERN TO FOLLOW:\n${JSON.stringify(fitBlueprint.benchmarkResumePattern, null, 2)}`
      : '';

    // Use verified bullet bank if available
    const verifiedBullets = fitBlueprint.bulletBankVerified 
      ? `\nVERIFIED BULLETS (use these directly):\n${JSON.stringify(fitBlueprint.bulletBankVerified, null, 2)}`
      : fitBlueprint.bulletBank 
        ? `\nBULLET BANK:\n${JSON.stringify(fitBlueprint.bulletBank, null, 2)}`
        : '';

    const userPrompt = `Generate a Benchmark Resume for this candidate-job match.

ORIGINAL RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

FIT ANALYSIS:
- Overall Fit Score: ${fitBlueprint.overallFitScore || 'N/A'}
- Evidence Units: ${fitBlueprint.evidenceInventory?.length || 0}
- Requirements Analyzed: ${fitBlueprint.requirements?.length || 0}
${rubricContext}
${patternContext}

EVIDENCE INVENTORY:
${JSON.stringify(fitBlueprint.evidenceInventory || [], null, 2)}

FIT MAP (requirement -> qualification status):
${JSON.stringify(fitBlueprint.fitMap || [], null, 2)}
${verifiedBullets}

${confirmedFactsBlock}
${legacyResponsesBlock}

CUSTOMIZATION:
- Intensity: ${customization?.intensity || 'moderate'} (${customization?.intensity === 'conservative' ? 'very cautious claims' : customization?.intensity === 'aggressive' ? 'bolder framing within evidence' : 'balanced approach'})
- Tone: ${customization?.tone || 'formal'}

EXECUTIVE SUMMARY GUIDANCE:
${JSON.stringify(fitBlueprint.executiveSummary || {}, null, 2)}

ATS KEYWORDS TO INCLUDE:
${JSON.stringify(fitBlueprint.atsAlignment?.topKeywords || [], null, 2)}

Return valid JSON only, no markdown, no commentary. Use this exact schema:

{
  "resume_text": "Full resume as plain text, ATS-friendly format",
  "sections": [
    {
      "id": "header",
      "type": "header",
      "title": "Header",
      "content": ["CANDIDATE NAME", "Target Title | Branding Line"],
      "evidence_tags": {}
    },
    {
      "id": "signature-wins",
      "type": "achievements",
      "title": "Signature Wins",
      "content": ["• Executive outcome 1 [E1]", "• Executive outcome 2 [E3, E5]"],
      "evidence_tags": {"0": ["E1"], "1": ["E3", "E5"]}
    },
    {
      "id": "summary",
      "type": "summary",
      "title": "Professional Summary",
      "content": ["5-7 line summary paragraph..."],
      "evidence_tags": {"0": ["E1", "E4", "E7"]}
    },
    {
      "id": "competencies",
      "type": "competencies",
      "title": "Core Competencies",
      "content": ["Competency 1", "Competency 2"],
      "evidence_tags": {}
    },
    {
      "id": "experience-1",
      "type": "experience",
      "title": "Professional Experience",
      "content": ["COMPANY | Title | Dates", "Role framing line", "• Bullet 1 [E1, R2]", "• Bullet 2 [E3]"],
      "evidence_tags": {"2": ["E1", "R2"], "3": ["E3"]}
    },
    {
      "id": "skills",
      "type": "skills",
      "title": "Tools & Platforms",
      "content": ["Tool 1", "Tool 2", "Workflow platforms (multiple)"],
      "evidence_tags": {}
    },
    {
      "id": "education",
      "type": "education",
      "title": "Education",
      "content": ["Degree, University"],
      "evidence_tags": {}
    }
  ],
  "changelog": [
    {
      "section": "Summary",
      "change": "Added quantified retention metric",
      "reason": "Addresses R3 requirement for retention experience",
      "evidence_used": ["E4"],
      "requirement_ids": ["R3"]
    }
  ],
  "verification_report": {
    "total_claims": 25,
    "verified_claims": 23,
    "inferred_claims": 2,
    "unverifiable_omitted": 3
  },
  "follow_up_questions": []
}`;

    console.log('Calling Lovable AI for Benchmark Resume generation...');

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.PREMIUM,
        temperature: 0.6, // Slightly lower for more consistent output
      },
      'benchmark-resume',
      user.id,
      90000 // 90 second timeout for complex generation
    );

    console.log('AI response received, usage:', metrics);

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI response length:', content.length);
    console.log('AI response starts with:', content.substring(0, 100));
    console.log('AI response ends with:', content.substring(content.length - 100));

    // Parse the JSON response using shared parser
    let parseResult = extractJSON(content);
    
    // Fallback: Try direct JSON parse if extractJSON fails
    if (!parseResult.success || !parseResult.data) {
      console.log('extractJSON failed, trying direct parse...');
      try {
        // Try to find JSON between code blocks or parse directly
        let jsonStr = content.trim();
        
        // Remove markdown code blocks if present
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
        }
        
        const directParse = JSON.parse(jsonStr);
        parseResult = { success: true, data: directParse };
        console.log('Direct parse succeeded');
      } catch (directError) {
        console.error('Direct parse also failed:', directError);
        console.error('Failed to parse AI response (first 1000 chars):', content.substring(0, 1000));
        console.error('Parse error from extractJSON:', parseResult.error);
        throw new Error('Failed to parse benchmark resume result');
      }
    }

    const rawResume = parseResult.data;
    
    // Transform to camelCase for frontend
    const benchmarkResume = {
      resumeText: rawResume.resume_text || '',
      sections: (rawResume.sections || []).map((s: any) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        content: s.content || [],
        evidenceTags: s.evidence_tags || {},
        isEdited: false
      })),
      changelog: (rawResume.changelog || []).map((c: any) => ({
        section: c.section || 'General',
        change: c.change,
        rationale: c.reason || c.rationale || '',
        evidenceUsed: c.evidence_used || [],
        requirementIds: c.requirement_ids || []
      })),
      verificationReport: rawResume.verification_report || null,
      followUpQuestions: rawResume.follow_up_questions || [],
      _meta: {
        generatedAt: new Date().toISOString(),
        mode: resumeMode,
        confirmedFactsUsed: Object.keys(confirmedFacts || {}).length,
        executionTimeMs: Date.now() - startTime,
        model: LOVABLE_AI_MODELS.PREMIUM
      }
    };

    console.log('Benchmark Resume generated successfully:', {
      sectionsCount: benchmarkResume.sections.length,
      changelogCount: benchmarkResume.changelog.length,
      mode: resumeMode,
      executionTimeMs: benchmarkResume._meta.executionTimeMs
    });

    return new Response(JSON.stringify(benchmarkResume), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Benchmark Resume error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      _meta: {
        executionTimeMs: Date.now() - startTime
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
