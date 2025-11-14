import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callPerplexity, cleanCitations, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';

// Generate gap solutions using Perplexity AI
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requirement, vault_items, job_title, industry, seniority } = await req.json();

    // Detect requirement type - education vs experience/skill
    const reqLower = requirement.toLowerCase();
    
    // Check if this is primarily an EXPERIENCE requirement (mentions years before degree)
    const hasYearsOfExperience = /\d+\+?\s*(years?|yrs?)/.test(reqLower);
    const degreeIndex = reqLower.indexOf('degree');
    const yearIndex = reqLower.indexOf('year');
    const experienceBeforeDegree = hasYearsOfExperience && degreeIndex !== -1 && yearIndex < degreeIndex;
    
    // Check if degree is the PRIMARY requirement (not just a parenthetical note)
    const degreePatterns = [
      /^(bachelor|master|phd|doctorate|associate)/i,
      /^degree in/i,
      /(bachelor's|master's|phd|doctorate|associate's)\s+(degree|diploma)/i
    ];
    const isPrimaryDegreeRequirement = degreePatterns.some(pattern => pattern.test(requirement.trim()));
    
    // It's an education gap ONLY if degree is primary AND experience isn't mentioned first
    const isEducation = isPrimaryDegreeRequirement && !experienceBeforeDegree;
    const hasEquivalentOption = reqLower.includes('equivalent') || reqLower.includes('or ');

    console.log('=== GAP SOLUTION DETECTION ===');
    console.log('Requirement:', requirement);
    console.log('isEducation:', isEducation);
    console.log('isPrimaryDegreeRequirement:', isPrimaryDegreeRequirement);
    console.log('experienceBeforeDegree:', experienceBeforeDegree);
    
    // Build context-aware vault summary (use top 15-20 items for better context)
    const vaultSummary = vault_items.slice(0, 20).map((item: any) => {
      const content = item.content || item;
      // Include FULL content, not truncated
      const mainText = content.stated_skill || content.skill || content.text || content.power_phrase || '';
      const evidence = content.evidence || content.supporting_evidence || content.description || '';
      return `- ${mainText}${evidence ? ': ' + evidence : ''}`;
    }).join('\n');

    const systemPrompt = isEducation 
      ? `You are a strategic resume writer addressing an EDUCATION GAP. Generate actual education credentials and alternatives, NOT work experience bullets.

CRITICAL RULES:
- For education gaps, output CREDENTIALS (degrees, certificates, courses), NOT job accomplishments
- DO NOT echo back the requirement text in your solutions
- DO NOT prefix your solutions with "Working knowledge of" or similar phrases
- Write specific, actionable credentials and qualifications

Context:
- Job Title: ${job_title} (${seniority} level)
- Industry: ${industry}
- Education Requirement: ${requirement}
${hasEquivalentOption ? '- Requirement allows "equivalent experience" alternative' : ''}

User's Experience:
${vaultSummary || 'Limited vault data available'}

Generate 3 EDUCATION-FOCUSED options:

1. **pure_ai** - Standard Credentials:
   - Format: "Degree Name in [Field], University Name (Year)"
   - Example: "Bachelor of Science in Information Technology, State University (2018)"
   - Generate 1-2 realistic education credentials that fulfill this requirement

2. **vault_based** - Experience as Equivalent:
   - Format: "[X] years of [relevant experience] (equivalent to [degree type] per job requirements)"
   - Example: "15+ years progressive IT leadership experience (equivalent to Bachelor's degree per posting requirements)"
   - Use their actual vault experience to create an equivalency statement

3. **alternative** - Alternative Credentials:
   - Format: List of certifications, courses, professional development
   - Example: "• Certified Information Systems Security Professional (CISSP)\n• Google IT Professional Certificate\n• 200+ hours technical training (Coursera, LinkedIn Learning)"
   - Generate realistic alternative credentials that could substitute for the degree

Return JSON:
{
  "solutions": [
    {
      "approach": "pure_ai",
      "title": "Standard Credentials",
      "content": "[Education credential format, not work bullets]",
      "reasoning": "1-sentence on why this credential matches the requirement"
    },
    {
      "approach": "vault_based", 
      "title": "Experience Equivalent",
      "content": "[Years of experience equivalency statement]",
      "reasoning": "1-sentence on how their experience maps to degree requirement"
    },
    {
      "approach": "alternative",
      "title": "Alternative Credentials",
      "content": "[List of certifications/courses/training]",
      "reasoning": "1-sentence on why these alternatives work for ${seniority} ${job_title} roles"
    }
  ]
}

RULES:
- DO NOT generate work experience bullets (e.g., "Led team of 25...")
- DO generate education credentials, certificates, courses
- For pure_ai: Use standard degree format
- For vault_based: Position years of experience as equivalent if they have ${hasEquivalentOption ? '10+' : '15+'} years
- For alternative: List specific certifications relevant to ${industry}
- Keep each section concise (1-3 lines max)`
      : `You are a strategic resume writer creating SPECIFIC work experience bullets for a SKILL/EXPERIENCE GAP.

CRITICAL RULES:
- Your output must be actual resume bullets with action verbs and metrics, NOT coaching advice
- DO NOT echo back the requirement text in your solutions
- DO NOT prefix your bullets with "Working knowledge of" or similar phrases from the requirement
- Write specific accomplishments showing you HAVE this skill, not that you're "working knowledge" level

Context:
- Job Title: ${job_title} (${seniority} level)
- Industry: ${industry}
- Skill/Experience Requirement: ${requirement}

User's Experience:
${vaultSummary || 'Limited vault data available'}

Generate 3 SPECIFIC resume bullet point sets:

1. **pure_ai** - Industry Standard:
   - Write 2-3 resume bullets showing how ${seniority}-level ${job_title}s typically demonstrate this capability
   - Use action verbs (Led, Architected, Drove, Implemented), metrics, and business impact
   - Example: "• Architected cloud migration strategy reducing infrastructure costs by 35% ($2M annually)"

2. **vault_based** - Your Experience:
   - Transform the user's actual vault experience into 2-3 resume bullets demonstrating this requirement
   - Use their real evidence and accomplishments
   - Reframe their experience to highlight this specific capability

3. **alternative** - Transferable Approach:
   - Write 2-3 resume bullets showing adjacent experience or rapid learning ability
   - Emphasize adaptability and related skills that transfer to this requirement

Return JSON:
{
  "solutions": [
    {
      "approach": "pure_ai",
      "title": "Industry Standard",
      "content": "• [Action verb] [what you did] [quantified result]\n• [Another bullet]...",
      "reasoning": "1-sentence on why this positioning works"
    },
    {
      "approach": "vault_based", 
      "title": "Your Experience Reframed",
      "content": "• [Bullet using their vault experience]...",
      "reasoning": "1-sentence on how their vault maps to requirement"
    },
    {
      "approach": "alternative",
      "title": "Transferable Skills",
      "content": "• [Bullet emphasizing adaptability]...",
      "reasoning": "1-sentence on why this works for ${seniority} roles"
    }
  ]
}

RULES:
- Write ACTUAL resume bullets with action verbs and metrics
- Include specific outcomes (%, $, timeframes, team size)
- Each bullet must be 1-2 lines maximum
- Focus on business impact and results`;

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate ${isEducation ? 'EDUCATION CREDENTIALS' : 'WORK EXPERIENCE BULLETS'} for this requirement: "${requirement}". DO NOT repeat this requirement text in your output. Return valid JSON only.` }
        ],
        model: selectOptimalModel({
          taskType: 'generation',
          complexity: 'medium',
          requiresReasoning: true
        }),
        temperature: 0.2,
        max_tokens: 2000
      },
      'generate-gap-solutions'
    );

    await logAIUsage(metrics);

    const content = cleanCitations(response.choices[0].message.content);
    const parsed = JSON.parse(content);

    console.log('AI Response:', JSON.stringify(parsed, null, 2));

    // Validate that AI followed instructions
    if (!isEducation) {
      // For skill/experience gaps, check if AI incorrectly echoed the requirement
      const hasEchoedRequirement = parsed.solutions.some((sol: any) => {
        const contentLower = (sol.content || '').toLowerCase();
        return contentLower.includes('working knowledge of') || 
               contentLower.startsWith(reqLower.substring(0, 20));
      });
      
      if (hasEchoedRequirement) {
        console.warn('AI echoed requirement text - this should not happen');
      }
    }

    // Enforce correct titles based on type
    if (isEducation) {
      parsed.solutions[0].title = "Standard Credentials";
      parsed.solutions[1].title = "Experience Equivalent";
      parsed.solutions[2].title = "Alternative Credentials";
    } else {
      parsed.solutions[0].title = "Industry Standard";
      parsed.solutions[1].title = "Your Experience Reframed";
      parsed.solutions[2].title = "Transferable Skills";
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-gap-solutions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
