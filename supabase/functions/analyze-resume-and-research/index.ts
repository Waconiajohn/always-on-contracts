import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
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

    const { resume_text, target_roles, target_industries } = await req.json();

    if (!resume_text) {
      throw new Error('resume_text is required');
    }

    const rolesText = target_roles?.join(', ') || 'Not specified';
    const industriesText = target_industries?.join(', ') || 'Not specified';

    // Fetch Career Vault for context-aware skill extraction
    const { data: intelligenceData, error: intelligenceError } = await supabase.functions.invoke(
      'get-vault-intelligence',
      { headers: { Authorization: authHeader } }
    );

    const intelligence = intelligenceError ? null : intelligenceData?.intelligence;
    
    let vaultContext = '';
    if (intelligence) {
      const existingSkills = intelligence.technicalDepth.map((t: any) => 
        `${t.skill_name} (${t.proficiency_level}, verified)`
      ).join(', ');

      const projectContext = intelligence.projects.slice(0, 5).map((p: any) => 
        `${p.project_name}: ${p.technologies_used?.join(', ') || 'technologies used'}`
      ).join('\n');

      const achievementContext = intelligence.businessImpacts.slice(0, 5).map((b: any) => 
        b.context || b.metric_type
      ).join('; ');

      vaultContext = `
CAREER VAULT INTELLIGENCE (Use for skill verification):
CONFIRMED SKILLS (${intelligence.counts.technicalSkills}): ${existingSkills}

PROJECT TECHNOLOGIES:
${projectContext}

ACHIEVEMENT CONTEXTS:
${achievementContext}

**EXTRACTION MANDATE:**
- Cross-reference skills against confirmed Career Vault skills
- If a skill matches Career Vault data, mark it as verified and increase confidence
- Consider skills demonstrated in projects even if not explicitly listed
- Look for skills implied by quantified achievements
`;
    }

    // Use Lovable AI to analyze resume and generate hierarchical skill taxonomy
    const prompt = `Analyze this resume and generate a comprehensive hierarchical skill taxonomy.

RESUME:
${resume_text}

TARGET ROLES: ${rolesText}
TARGET INDUSTRIES: ${industriesText}

${vaultContext}

Generate three categories with HIERARCHICAL DEPTH:

1. CORE SKILLS (from resume): Skills explicitly mentioned or clearly demonstrated
   - Mark as "resume_verified" if confirmed in Career Vault
   - Organize by skill hierarchy: Expert > Advanced > Intermediate > Basic

2. INFERRED SKILLS (likely has): Skills implied by roles/achievements but not explicitly stated
   - Verify against projects and achievements from Career Vault
   - Only include if there's concrete evidence (not assumptions)

3. GROWTH SKILLS (needs for target roles): Required skills with gaps
   - Check against target role requirements
   - Exclude skills already confirmed in Career Vault

For each skill, provide:
- skill_name: Clear, specific skill name (use industry-standard terminology)
- skill_category: One of: technical, leadership, domain_expertise, soft_skills, tools
- skill_hierarchy: One of: expert, advanced, intermediate, basic, learning
- source: "resume", "inferred", "growth", or "resume_verified" (if matches Career Vault)
- confidence_score: 0-100 (increase if verified in Career Vault or demonstrated in projects)
- sub_attributes: Array of 3-5 specific sub-skills or applications
- market_frequency: Estimated % of target job postings requiring this skill (0-100)
- evidence: Array of specific achievements, projects, or contexts demonstrating this skill

Return ONLY a JSON array of skill objects. Example:
[
  {
    "skill_name": "Strategic Planning",
    "skill_category": "leadership",
    "skill_hierarchy": "advanced",
    "source": "resume_verified",
    "confidence_score": 95,
    "sub_attributes": [
      "Multi-year roadmap development",
      "Cross-functional planning",
      "Budget forecasting ($1M+)",
      "Competitive positioning"
    ],
    "market_frequency": 85,
    "evidence": [
      "Led 3-year product strategy for SaaS platform",
      "Managed $2.5M product budget",
      "Coordinated planning across 5 departments"
    ]
  }
]

CRITICAL REQUIREMENTS:
1. Verify skills against Career Vault - mark matching skills as "resume_verified"
2. Organize by skill_hierarchy (expert to learning)
3. Include evidence array with specific examples from resume or Career Vault
4. Cross-reference skills against projects and achievements
5. Use industry-specific terminology and skill taxonomy

Aim for 25-30 total skills with hierarchical organization and evidence-based validation.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('Failed to analyze resume');
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0]?.message?.content || '[]';
    
    // Extract JSON from markdown code blocks if present
    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    }

    const skills = JSON.parse(jsonContent);

    console.log('[ANALYZE-RESUME] AI generated', skills.length, 'skills');

    // Fetch Career Vault intelligence for skill verification
    const { data: verificationData, error: verificationError } = await supabase.functions.invoke(
      'get-vault-intelligence',
      { headers: { Authorization: authHeader } }
    );

    const verificationIntelligence = verificationError ? null : verificationData?.intelligence;
    
    if (verificationIntelligence) {
      console.log('[ANALYZE-RESUME] Career Vault loaded for verification:', {
        confirmedSkills: verificationIntelligence.counts.technicalSkills,
        projects: verificationIntelligence.counts.projects,
        businessImpacts: verificationIntelligence.counts.businessImpacts
      });

      // Verify skills against Career Vault data
      const confirmedSkillNames = verificationIntelligence.technicalDepth.map((t: any) => t.skill_name.toLowerCase());
      const projectSkills = verificationIntelligence.projects.flatMap((p: any) => 
        (p.technologies_used || []).map((t: string) => t.toLowerCase())
      );
      
      // Enhance skills with Career Vault validation
      skills.forEach((skill: any) => {
        const skillLower = skill.skill_name.toLowerCase();
        
        // Check if skill is confirmed in Career Vault
        if (confirmedSkillNames.includes(skillLower)) {
          const vaultSkill = verificationIntelligence.technicalDepth.find(
            (t: any) => t.skill_name.toLowerCase() === skillLower
          );
          
          skill.confidence_score = Math.max(skill.confidence_score, 95);
          skill.source = 'resume_verified';
          skill.verification_note = `Confirmed in Career Vault (${vaultSkill?.proficiency_level || 'validated'})`;
          
          // Add years of experience if available
          if (vaultSkill?.years_experience) {
            skill.years_experience = vaultSkill.years_experience;
          }
        }
        
        // Check if skill appears in completed projects
        if (projectSkills.includes(skillLower)) {
          skill.confidence_score = Math.max(skill.confidence_score, 85);
          skill.project_validated = true;
          
          const relatedProjects = verificationIntelligence.projects.filter((p: any) => 
            (p.technologies_used || []).some((t: string) => t.toLowerCase() === skillLower)
          );
          
          if (relatedProjects.length > 0) {
            skill.evidence_projects = relatedProjects.map((p: any) => p.project_name);
          }
        }
        
        // Check for business impacts that demonstrate this skill
        const relatedImpacts = verificationIntelligence.businessImpacts.filter((b: any) => 
          b.context?.toLowerCase().includes(skillLower) || 
          b.metric_type?.toLowerCase().includes(skillLower)
        );
        
        if (relatedImpacts.length > 0) {
          skill.quantified_evidence = relatedImpacts.map((b: any) => 
            `${b.metric_type}: ${b.metric_value}`
          );
        }
      });
      
      console.log('[ANALYZE-RESUME] Skills verified against Career Vault');
    }

    console.log('[ANALYZE-RESUME] Now verifying with Perplexity...');

    // Verify skills with Perplexity
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    let verification_result = null;
    let citations = [];

    if (perplexityKey) {
      try {
        const verificationPrompt = `Verify these ${skills.length} skills for ${rolesText} in ${industriesText}:

${skills.map((s: any) => `- ${s.skill_name} (${s.skill_category}, market freq: ${s.market_frequency}%)`).join('\n')}

Provide:
1. Are these skills accurate and relevant for these target roles?
2. Any critical missing skills that should be added?
3. Are the market frequency estimates realistic based on current job postings?
4. Brief market insights for these roles

Be concise but specific.`;

        const verifyResponse = await fetch('https://api.perplexity.ai/chat/completions', {
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
                content: 'You are a career market analyst. Verify skill relevance and market demand with current data.'
              },
              {
                role: 'user',
                content: verificationPrompt
              }
            ],
            temperature: 0.2,
            max_tokens: 1500,
            search_recency_filter: 'month',
          }),
        });

        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          verification_result = verifyData.choices[0]?.message?.content;
          citations = verifyData.citations || [];
          
          console.log('Perplexity verification complete with', citations.length, 'citations');

          // Store verification
          await supabase
            .from('vault_verifications')
            .insert({
              user_id: user.id,
              verification_type: 'skills',
              original_content: skills,
              verification_result,
              citations,
              verified_at: new Date().toISOString(),
            });
        } else {
          console.error('Perplexity verification failed:', await verifyResponse.text());
        }
      } catch (verifyError) {
        console.error('Error during Perplexity verification:', verifyError);
        // Continue without verification - not critical
      }
    } else {
      console.log('Perplexity API key not configured, skipping verification');
    }

    // Delete existing taxonomy for this user
    await supabase
      .from('vault_skill_taxonomy')
      .delete()
      .eq('user_id', user.id);

    // Insert new skill taxonomy
    const taxonomyData = skills.map((skill: any) => ({
      user_id: user.id,
      skill_name: skill.skill_name,
      skill_category: skill.skill_category,
      source: skill.source === 'resume_verified' ? 'resume' : skill.source,
      confidence_score: skill.confidence_score,
      sub_attributes: skill.sub_attributes,
      market_frequency: skill.market_frequency,
    }));

    const { error: insertError } = await supabase
      .from('vault_skill_taxonomy')
      .insert(taxonomyData);

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        skills_count: skills.length,
        verified: !!verification_result,
        verification_summary: verification_result ? 'Skills verified with current market data' : 'Verification skipped',
        citations_count: citations.length,
        vault_enhanced: !!intelligence,
        vault_verified_count: skills.filter((s: any) => s.source === 'resume_verified').length,
        breakdown: {
          resume: skills.filter((s: any) => s.source === 'resume' || s.source === 'resume_verified').length,
          inferred: skills.filter((s: any) => s.source === 'inferred').length,
          growth: skills.filter((s: any) => s.source === 'growth').length,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-resume-and-research:', error);
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
