import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Utility to clean citations from generated content
const cleanCitations = (text: string): string => {
  if (!text) return '';

  let cleaned = text;

  // Remove citation markers [1], [2], etc.
  cleaned = cleaned.replace(/\[\d+\]/g, '');

  // Remove "According to X," patterns
  cleaned = cleaned.replace(/According to [^,\.]+,?\s*/gi, '');
  cleaned = cleaned.replace(/Based on [^,\.]+,?\s*/gi, '');
  cleaned = cleaned.replace(/Research shows (that\s+)?/gi, '');
  cleaned = cleaned.replace(/Industry data (shows|indicates) (that\s+)?/gi, '');
  cleaned = cleaned.replace(/Studies (show|indicate) (that\s+)?/gi, '');
  cleaned = cleaned.replace(/Data from [^,\.]+,?\s*/gi, '');
  cleaned = cleaned.replace(/As reported by [^,\.]+,?\s*/gi, '');

  // Remove source mentions at end of sentences
  cleaned = cleaned.replace(/\(source:[^\)]+\)/gi, '');
  cleaned = cleaned.replace(/\(via [^\)]+\)/gi, '');

  // Clean up spacing issues
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/\s+\./g, '.');
  cleaned = cleaned.replace(/\s+,/g, ',');

  // Fix sentence capitalization after removal
  cleaned = cleaned.replace(/\.\s+([a-z])/g, (match, p1) => '. ' + p1.toUpperCase());

  return cleaned.trim();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const {
      generation_type, // 'ideal' or 'personalized'
      section_type,
      section_guidance,
      job_analysis_research, // From perplexity-research
      vault_items, // For personalized generation
      job_title,
      industry,
      seniority
    } = await req.json();

    if (!generation_type || !section_type) {
      throw new Error('generation_type and section_type are required');
    }

    console.log(`Generating ${generation_type} ${section_type} with Perplexity`);

    // Build vault context for personalized generation
    let vaultContext = '';
    if (generation_type === 'personalized' && vault_items && vault_items.length > 0) {
      vaultContext = `\n\nCANDIDATE'S CAREER VAULT DATA:\n`;
      vault_items.forEach((item: any, idx: number) => {
        vaultContext += `\n${idx + 1}. ${item.content || item.text || JSON.stringify(item)}`;
      });
      vaultContext += `\n\nUse these REAL achievements and experiences when generating content.`;
    }

    // Extract key data from research
    const researchContext = job_analysis_research ? `
RESEARCH INSIGHTS:
${job_analysis_research}

Critical: Use the problem-solution framework identified in research.
` : '';

    // Build system prompt
    const systemPrompt = `You are a Certified Professional Resume Writer (CPRW) creating world-class resume content.

CRITICAL INSTRUCTIONS:
- Write in FIRST PERSON ("I help...", "Led...", "Drove...")
- Write AS IF you are the candidate (not about them)
- NEVER include citations, sources, or reference markers like [1], [2]
- NEVER say "According to..." or "Based on research..."
- NEVER add footnotes or source attributions
- Output ONLY the resume content itself
- Use specific numbers and metrics when available
- Focus on business impact and results
- Match the tone to ${seniority || 'mid-level'} ${industry || 'professional'} standards

Remember: This is a resume, not a research paper. Write clean, professional content only.`;

    // Build prompts based on section type
    let userPrompt = '';

    switch (section_type) {
      case 'opening_paragraph':
      case 'summary':
        userPrompt = `Generate a powerful professional summary paragraph following the CPRW problem-solution framework.

${researchContext}${vaultContext}

STRUCTURE (3-4 sentences):
Sentence 1: "I help [company type] [solve specific problem] by [method/approach]."
Sentence 2: "[Specific achievement] resulting in [quantified outcome with numbers]."
Sentence 3: "Expertise in [top 5-7 critical skills], with deep experience in [industry-specific area]."
Sentence 4 (optional): "[What makes this candidate different/valuable for THIS role]."

SECTION GUIDANCE:
${section_guidance}

TARGET ROLE: ${job_title || 'professional role'}
SENIORITY: ${seniority || 'mid-level'}

${generation_type === 'ideal'
  ? 'Generate an industry-standard example showing what excellence looks like for this role.'
  : 'Use the candidate\'s ACTUAL experiences from Career Vault. Replace generic examples with their real achievements.'}

Output ONLY the paragraph text. No citations, no explanations.`;
        break;

      case 'skills_list':
      case 'core_competencies':
      case 'key_skills':
      case 'technical_skills':
        userPrompt = `Generate a focused skills list for this resume.

${researchContext}${vaultContext}

REQUIREMENTS:
- 12-15 specific skills (NOT general descriptions)
- Prioritize ATS critical keywords from job description
- Mix technical and soft skills appropriate for ${seniority || 'mid-level'} level
- Use exact terminology from job posting
- Order by relevance (most important first)
${generation_type === 'personalized' ? '- Include ONLY skills the candidate actually has from Career Vault' : ''}

SECTION GUIDANCE:
${section_guidance}

OUTPUT FORMAT: Return as JSON array of strings
["Skill 1", "Skill 2", "Skill 3", ...]

Return ONLY valid JSON, no markdown, no explanations, no citations.`;
        break;

      case 'accomplishments':
      case 'selected_accomplishments':
      case 'key_achievements':
        userPrompt = `Generate ${vault_items?.length || 3} powerful accomplishment bullets.

${researchContext}${vaultContext}

REQUIREMENTS FOR EACH BULLET:
- Start with strong action verb
- Include quantified results (%, $, #, timeframe)
- Show business impact, not just tasks
- Match ${seniority || 'mid-level'} expectations
- Use S.T.A.R. method (Situation, Task, Action, Result)
${generation_type === 'personalized' ? '- Use candidate\'s ACTUAL achievements from Career Vault' : ''}

SECTION GUIDANCE:
${section_guidance}

OUTPUT FORMAT: Return as JSON array of strings
["• Bullet 1...", "• Bullet 2...", "• Bullet 3..."]

Return ONLY valid JSON, no markdown, no explanations, no citations.`;
        break;

      case 'professional_timeline':
      case 'experience':
      case 'work_history':
        userPrompt = `Generate professional experience entries.

${researchContext}${vaultContext}

For each position, provide:
- Job Title at Company Name (dates)
- 3-4 achievement bullets using format: "Action verb + what you did + quantified result"
- Focus on relevance to target role: ${job_title}
${generation_type === 'personalized' ? '- Use candidate\'s ACTUAL work history from Career Vault' : ''}

SECTION GUIDANCE:
${section_guidance}

OUTPUT FORMAT: Return as JSON array of objects
[
  {
    "title": "Job Title",
    "company": "Company Name",
    "dates": "Jan 2020 - Present",
    "bullets": ["• Bullet 1", "• Bullet 2", "• Bullet 3"]
  }
]

Return ONLY valid JSON, no markdown, no explanations, no citations.`;
        break;

      default:
        userPrompt = `Generate content for the "${section_type}" section.

${researchContext}${vaultContext}

SECTION GUIDANCE:
${section_guidance}

${generation_type === 'personalized' ? 'Use candidate\'s actual Career Vault data.' : 'Show industry-standard example.'}

Output clean resume content only. No citations, no sources.`;
    }

    // Call Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.3, // Lower for more consistent output
        max_tokens: 2000,
        return_citations: false, // We don't want citations
        search_recency_filter: null, // Don't trigger web search for generation
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      throw new Error(`Perplexity API failed: ${response.status}`);
    }

    const data = await response.json();
    let generatedContent = data.choices[0]?.message?.content || '';

    console.log('Raw Perplexity output (first 200 chars):', generatedContent.substring(0, 200));

    // Clean up citations if any leaked through
    generatedContent = cleanCitations(generatedContent);

    // Try to parse as JSON for structured sections
    let parsed: any;
    const structuredSections = [
      'skills_list', 'core_competencies', 'key_skills', 'technical_skills',
      'accomplishments', 'selected_accomplishments', 'key_achievements',
      'professional_timeline', 'experience', 'work_history'
    ];

    if (structuredSections.includes(section_type)) {
      try {
        // Clean markdown code blocks if present
        let jsonText = generatedContent
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        parsed = JSON.parse(jsonText);

        // Validate skills sections return arrays
        if (['skills_list', 'core_competencies', 'key_skills', 'technical_skills'].includes(section_type)) {
          if (!Array.isArray(parsed)) {
            console.error('Skills section did not return array, attempting extraction');
            // Fallback: try to extract from text
            const skillMatches = jsonText.match(/"([^"]+)"/g);
            if (skillMatches && skillMatches.length > 0) {
              parsed = skillMatches.map(s => s.replace(/"/g, ''));
            } else {
              throw new Error('Could not parse skills array');
            }
          }
        }

        console.log(`Successfully parsed JSON for ${section_type}`);

      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Failed to parse content:', generatedContent.substring(0, 500));

        // Fallback for skills: try line-by-line extraction
        if (['skills_list', 'core_competencies', 'key_skills', 'technical_skills'].includes(section_type)) {
          const lines = generatedContent.split('\n').filter(l => l.trim());
          const skills: string[] = [];
          for (const line of lines) {
            const cleaned = line.replace(/^[•\-*\d.]+\s*/, '').trim();
            if (cleaned && cleaned.length < 100) {
              skills.push(cleaned);
            }
          }
          if (skills.length > 0) {
            parsed = skills;
            console.log('Extracted skills from lines:', skills.length);
          } else {
            throw new Error('Could not extract skills from response');
          }
        } else {
          // For other structured sections, return as text if JSON parsing fails
          parsed = generatedContent;
        }
      }
    } else {
      // For paragraph sections (summary, etc.), keep as text
      parsed = generatedContent;
    }

    return new Response(
      JSON.stringify({
        success: true,
        generation_type,
        section_type,
        content: parsed,
        raw_content: generatedContent,
        cleaned: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-resume-with-perplexity:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
