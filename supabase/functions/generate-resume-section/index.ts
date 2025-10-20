import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      sectionType,
      sectionGuidance,
      jobAnalysis,
      vaultItems,
      userSelections, // Which vault items user checked
      enhanceMode = false // true if regenerating/enhancing
    } = await req.json()

    const lovableKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableKey) {
      throw new Error('LOVABLE_API_KEY not configured')
    }

    // Build context for AI
    const jobContext = `
JOB TITLE: ${jobAnalysis.roleProfile?.title || 'Not specified'}
COMPANY: ${jobAnalysis.roleProfile?.company || 'Not specified'}
INDUSTRY: ${jobAnalysis.roleProfile?.industry || 'Not specified'}
SENIORITY: ${jobAnalysis.roleProfile?.seniority || 'Not specified'}

KEY JOB REQUIREMENTS:
${(jobAnalysis.jobRequirements?.required || []).slice(0, 10).map((r: any) => `• ${r.requirement}`).join('\n')}

ATS CRITICAL KEYWORDS:
${(jobAnalysis.atsKeywords?.critical || []).slice(0, 15).join(', ')}

ATS IMPORTANT KEYWORDS:
${(jobAnalysis.atsKeywords?.important || []).slice(0, 15).join(', ')}
`

    const vaultContext = vaultItems && vaultItems.length > 0
      ? `
SELECTED VAULT ITEMS TO INCORPORATE:
${vaultItems.map((item: any, i: number) => `
${i + 1}. [${item.category}]
   Content: ${JSON.stringify(item.content).substring(0, 300)}
   Match Score: ${item.matchScore}%
   Satisfies: ${(item.satisfiesRequirements || []).slice(0, 3).join(', ')}
`).join('\n')}
`
      : ''

    let prompt = ''

    // Different prompts based on section type
    switch (sectionType) {
      case 'opening_paragraph':
      case 'summary':
        prompt = `You are an expert resume writer. Write a compelling ${sectionType === 'opening_paragraph' ? '3-4 sentence opening paragraph' : '2-3 sentence professional summary'} for this candidate's resume.

${jobContext}

${vaultContext}

GUIDANCE FOR THIS SECTION:
${sectionGuidance}

INSTRUCTIONS:
1. Write in first person but omit "I" (e.g., "Results-driven executive with..." not "I am a results-driven...")
2. Include specific years of experience if available in vault
3. Weave in 2-3 quantifiable achievements from vault items
4. Incorporate critical ATS keywords naturally
5. Match the tone and seniority level of the target role
6. Make it powerful, confident, and specific - avoid generic phrases
7. Focus on value proposition: what makes this candidate the ideal hire

Return ONLY the paragraph text, no explanations or formatting.`
        break

      case 'skills_list':
      case 'core_competencies':
      case 'technical_skills':
        prompt = `You are an expert resume writer. Generate a skills list for this candidate's resume.

${jobContext}

${vaultContext}

GUIDANCE FOR THIS SECTION:
${sectionGuidance}

INSTRUCTIONS:
1. Generate 10-12 skills that match the job requirements
2. Prioritize ATS critical keywords from job description
3. Include skills from selected vault items
4. Mix hard skills and soft skills appropriately for seniority level
5. Use industry-standard terminology
6. Order by relevance to job (most important first)
7. Ensure each skill is backed by vault evidence

Return as JSON array of strings:
["Skill 1", "Skill 2", "Skill 3", ...]

Return ONLY valid JSON, no markdown formatting.`
        break

      case 'accomplishments':
      case 'selected_accomplishments':
        prompt = `You are an expert resume writer. Generate ${vaultItems.length || 3} powerful accomplishment bullets for this candidate's resume.

${jobContext}

${vaultContext}

GUIDANCE FOR THIS SECTION:
${sectionGuidance}

INSTRUCTIONS:
1. Each accomplishment should map to one of the top job requirements
2. Use strong action verbs (Led, Drove, Transformed, Pioneered, Architected, etc.)
3. Include specific, quantifiable metrics (%, $, scale, time)
4. Follow the CAR format: Challenge/Context + Action + Result
5. Incorporate ATS keywords naturally
6. Make the impact and "so what" crystal clear
7. Write in past tense for past roles, present for current
8. Each bullet should be 1-2 sentences maximum

Return as JSON array:
[
  {
    "bullet": "The accomplishment text...",
    "requirementAddressed": "Which job requirement this addresses",
    "keywords": ["keyword1", "keyword2"]
  }
]

Return ONLY valid JSON, no markdown formatting.`
        break

      case 'experience':
      case 'professional_timeline':
        prompt = `You are an expert resume writer. Generate experience bullets for a work history entry.

${jobContext}

${vaultContext}

GUIDANCE FOR THIS SECTION:
${sectionGuidance}

INSTRUCTIONS:
1. Generate 3-5 achievement-focused bullets for this role
2. Tailor to emphasize experience relevant to target job
3. Use action verbs and quantify results
4. Include scope/scale when relevant (team size, budget, users, etc.)
5. Focus on impact and outcomes, not just responsibilities
6. Incorporate relevant ATS keywords
7. Most recent roles should have more detail than older ones

Return as JSON array:
[
  {
    "bullet": "Achievement bullet text...",
    "keywords": ["keyword1", "keyword2"]
  }
]

Return ONLY valid JSON, no markdown formatting.`
        break

      case 'additional_skills':
        prompt = `You are an expert resume writer. Generate an ATS keyword list for this candidate.

${jobContext}

${vaultContext}

INSTRUCTIONS:
1. Extract important keywords from job description not yet covered in resume
2. Include tools, technologies, methodologies mentioned
3. Add relevant certifications or specialized knowledge
4. Include industry buzzwords and terminology
5. Keep it concise - just the terms separated by bullet points or commas
6. Focus on keywords that will improve ATS score

Return as JSON array of strings:
["Keyword 1", "Keyword 2", "Keyword 3", ...]

Return ONLY valid JSON, no markdown formatting.`
        break

      default:
        prompt = `You are an expert resume writer. Generate content for the ${sectionType} section.

${jobContext}

${vaultContext}

GUIDANCE:
${sectionGuidance}

Generate appropriate content for this section that incorporates the vault items and matches the job requirements.

Return as plain text or JSON array depending on section type.`
    }

    console.log('Calling Lovable AI for section generation...')
    console.log('Section type:', sectionType)
    console.log('Vault items:', vaultItems?.length || 0)

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7, // Slightly higher for creative writing
        max_tokens: 2048
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Lovable AI error:', response.status, errorText)
      
      // Pass through rate limit and payment errors to client
      if (response.status === 429 || response.status === 402) {
        return new Response(
          JSON.stringify({
            success: false,
            error: response.status === 429 
              ? 'Rate limit exceeded. Please try again in a moment.'
              : 'Payment required. Please add credits to your workspace.'
          }),
          {
            status: response.status,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        )
      }
      
      throw new Error(`AI generation failed: ${response.status}`)
    }

    const data = await response.json()
    let generatedContent = data.choices?.[0]?.message?.content || ''

    console.log('Raw AI response:', generatedContent.substring(0, 200))

    // Clean up response - remove markdown formatting if present
    generatedContent = generatedContent
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    // Try to parse as JSON for structured sections
    let parsed: any
    try {
      parsed = JSON.parse(generatedContent)
    } catch {
      // If not JSON, treat as plain text (for summary/opening paragraph)
      parsed = generatedContent
    }

    return new Response(
      JSON.stringify({
        success: true,
        sectionType,
        content: parsed,
        rawContent: generatedContent
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error: any) {
    console.error('Error in generate-resume-section:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate section'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
