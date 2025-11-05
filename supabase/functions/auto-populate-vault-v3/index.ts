import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callPerplexity } from '../_shared/ai-config.ts';
import { createLogger } from '../_shared/logger.ts';
import { extractJSON } from '../_shared/json-parser.ts';
import type { CompetencyFramework } from '../_shared/competency-frameworks.ts';

const logger = createLogger('auto-populate-vault-v3');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vaultId, resumeText, userId, framework } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    logger.info('Starting framework-driven vault extraction', { vaultId, role: framework?.role });

    // Build competency verification checklist from framework
    const technicalChecklist = framework.technicalCompetencies
      .map(c => `- ${c.name} (${c.requiredLevel} level): ${c.keywords.join(', ')}`)
      .join('\n');
    
    const managementChecklist = framework.managementBenchmarks
      .map(b => `- ${b.aspect}: ${b.minValue}-${b.maxValue} ${b.unit} (typical: ${b.typicalValue})`)
      .join('\n');
    
    const educationChecklist = framework.educationRequirements
      .map(e => `- ${e.level}: ${e.fields.join(' or ')} ${e.required ? '(REQUIRED)' : '(PREFERRED)'}`)
      .join('\n');

    const prompt = `FRAMEWORK-DRIVEN VAULT EXTRACTION

TARGET ROLE: ${framework.role}
INDUSTRY: ${framework.industry}

RESUME TEXT:
${resumeText}

COMPETENCY FRAMEWORK TO VERIFY:

TECHNICAL COMPETENCIES:
${technicalChecklist}

MANAGEMENT BENCHMARKS:
${managementChecklist}

EDUCATION REQUIREMENTS:
${educationChecklist}

EXTRACTION TASK:
1. Extract 12-20 power phrases (quantified achievements with metrics)
2. Extract 15-25 transferable skills that match the technical competencies above
3. Extract 8-15 hidden competencies (inferred from responsibilities)
4. Extract 10-18 soft skills

CAREER CONTEXT VERIFICATION:
For each framework requirement above, check if the resume demonstrates it:
- If PRESENT: note the evidence and mark as VERIFIED
- If MISSING or UNCLEAR: mark as GAP

CRITICAL RULES:
- If education shows "B.S. Mechanical Engineering" and framework requires "Bachelor's in Engineering" → VERIFIED, not a gap
- If resume shows "Supervised 3-4 rigs" and framework requires "Team Size: 3-12 people" → VERIFIED, not a gap
- If resume shows "$350MM AFE" and framework requires "Budget: $50MM-$500MM" → VERIFIED, not a gap
- ONLY flag as GAP if information is truly missing or unclear

Return ONLY valid JSON:
{
  "powerPhrases": [
    {
      "phrase": "Reduced drilling costs by 18% ($63MM savings) through optimization",
      "category": "Cost Reduction",
      "impactArea": "Financial",
      "qualityTier": "gold",
      "confidenceScore": 0.95
    }
  ],
  "transferableSkills": [
    {
      "skill": "Well Control",
      "category": "Technical",
      "proficiencyLevel": "expert",
      "yearsExperience": 12,
      "qualityTier": "gold",
      "confidenceScore": 0.9
    }
  ],
  "hiddenCompetencies": [
    {
      "competencyArea": "Leadership",
      "inferredCapability": "Multi-rig coordination",
      "evidence": "Supervised drilling operations across 3-4 rigs simultaneously",
      "qualityTier": "silver",
      "confidenceScore": 0.85
    }
  ],
  "softSkills": [
    {
      "skill": "Strategic Planning",
      "type": "Leadership",
      "evidence": "Developed 5-year drilling program",
      "qualityTier": "silver",
      "confidenceScore": 0.8
    }
  ],
  "careerContext": {
    "hasManagementExperience": true,
    "managementDetails": {
      "teamSize": 4,
      "verified": true,
      "evidence": "Supervised 3-4 rigs"
    },
    "hasBudgetResponsibility": true,
    "budgetDetails": {
      "amount": 350000000,
      "verified": true,
      "evidence": "$350MM AFE generation"
    },
    "education": {
      "level": "bachelor",
      "field": "Mechanical Engineering",
      "verified": true,
      "meetsRequirement": true
    },
    "certifications": [],
    "competencyGaps": [
      {
        "area": "Well Control Certification",
        "reason": "No IWCF or IADC certification mentioned",
        "severity": "medium"
      }
    ]
  }
}`;

    const { response } = await callPerplexity(
      {
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume analyzer who extracts vault data against competency frameworks. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.1-sonar-large-128k-online',
        temperature: 0.2,
        max_tokens: 8000,
        return_citations: false,
      },
      'auto-populate-vault-v3',
      userId
    );

    const content = response.choices[0].message.content;
    const extractResult = extractJSON(content);
    
    if (!extractResult.success || !extractResult.data) {
      throw new Error("Failed to extract vault data");
    }

    const extracted = extractResult.data;

    // Insert power phrases
    const powerPhrases = extracted.powerPhrases || [];
    if (powerPhrases.length > 0) {
      const { error: ppError } = await supabase
        .from('vault_power_phrases')
        .insert(
          powerPhrases.map((p: any) => ({
            vault_id: vaultId,
            power_phrase: p.phrase,
            category: p.category,
            impact_area: p.impactArea,
            quality_tier: p.qualityTier || 'silver',
            confidence_score: p.confidenceScore || 0.7,
            impact_metrics: p.metrics || null
          }))
        );
      
      if (ppError) logger.error('Error inserting power phrases', ppError);
    }

    // Insert transferable skills
    const skills = extracted.transferableSkills || [];
    if (skills.length > 0) {
      const { error: skillError } = await supabase
        .from('vault_transferable_skills')
        .insert(
          skills.map((s: any) => ({
            vault_id: vaultId,
            stated_skill: s.skill,
            skill_category: s.category,
            proficiency_level: s.proficiencyLevel,
            years_experience: s.yearsExperience,
            quality_tier: s.qualityTier || 'silver',
            confidence_score: s.confidenceScore || 0.7
          }))
        );
      
      if (skillError) logger.error('Error inserting skills', skillError);
    }

    // Insert hidden competencies
    const competencies = extracted.hiddenCompetencies || [];
    if (competencies.length > 0) {
      const { error: compError } = await supabase
        .from('vault_hidden_competencies')
        .insert(
          competencies.map((c: any) => ({
            vault_id: vaultId,
            competency_area: c.competencyArea,
            inferred_capability: c.inferredCapability,
            supporting_evidence: [c.evidence],
            quality_tier: c.qualityTier || 'bronze',
            confidence_score: c.confidenceScore || 0.6
          }))
        );
      
      if (compError) logger.error('Error inserting competencies', compError);
    }

    // Deduplicate and merge soft skills
    const softSkills = extracted.softSkills || [];
    if (softSkills.length > 0) {
      const deduped = deduplicateSkills(softSkills);
      const { error: softError } = await supabase
        .from('vault_soft_skills')
        .insert(
          deduped.map((s: any) => ({
            vault_id: vaultId,
            skill_name: s.skill,
            skill_type: s.type,
            behavioral_evidence: s.evidence,
            quality_tier: s.qualityTier || 'bronze',
            ai_confidence: s.confidenceScore || 0.6
          }))
        );
      
      if (softError) logger.error('Error inserting soft skills', softError);
    }

    // Insert career context
    const careerContext = extracted.careerContext || {};
    const { error: contextError } = await supabase
      .from('vault_career_context')
      .upsert({
        vault_id: vaultId,
        has_management_experience: careerContext.hasManagementExperience || false,
        management_scope: careerContext.managementDetails?.evidence || null,
        team_size: careerContext.managementDetails?.teamSize || null,
        budget_responsibility: careerContext.hasBudgetResponsibility || false,
        budget_amount: careerContext.budgetDetails?.amount || null,
        years_experience: careerContext.yearsExperience || null,
        education_level: careerContext.education?.level || null,
        education_field: careerContext.education?.field || null,
        certifications: careerContext.certifications || [],
        seniority_indicators: careerContext.seniorityIndicators || [],
        identified_gaps: careerContext.competencyGaps || [],
        framework_match_score: calculateFrameworkMatch(extracted, framework),
        updated_at: new Date().toISOString()
      });

    if (contextError) logger.error('Error inserting career context', contextError);

    const totalItems = powerPhrases.length + skills.length + competencies.length + softSkills.length;

    logger.info('Vault extraction complete', {
      vaultId,
      totalItems,
      gaps: careerContext.competencyGaps?.length || 0
    });

    return new Response(
      JSON.stringify({
        success: true,
        totalItems,
        breakdown: {
          powerPhrases: powerPhrases.length,
          transferableSkills: skills.length,
          hiddenCompetencies: competencies.length,
          softSkills: softSkills.length
        },
        careerContext: {
          hasManagementExperience: careerContext.hasManagementExperience,
          hasBudgetResponsibility: careerContext.hasBudgetResponsibility,
          educationVerified: careerContext.education?.verified || false,
          identifiedGaps: careerContext.competencyGaps || []
        },
        frameworkMatchScore: calculateFrameworkMatch(extracted, framework)
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    logger.error('Vault extraction failed', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function deduplicateSkills(skills: any[]): any[] {
  const grouped = new Map<string, any>();
  
  for (const skill of skills) {
    const key = skill.skill.toLowerCase().trim();
    
    if (grouped.has(key)) {
      const existing = grouped.get(key);
      // Merge evidence
      const combinedEvidence = `${existing.evidence}; ${skill.evidence}`;
      // Take highest confidence
      const maxConfidence = Math.max(existing.confidenceScore || 0, skill.confidenceScore || 0);
      // Take best quality tier
      const tierRank: Record<string, number> = { gold: 3, silver: 2, bronze: 1 };
      const existingRank = tierRank[existing.qualityTier as string] || 1;
      const skillRank = tierRank[skill.qualityTier as string] || 1;
      const bestTier = existingRank >= skillRank ? existing.qualityTier : skill.qualityTier;
      
      grouped.set(key, {
        ...existing,
        evidence: combinedEvidence,
        confidenceScore: maxConfidence,
        qualityTier: bestTier
      });
    } else {
      grouped.set(key, skill);
    }
  }
  
  return Array.from(grouped.values());
}

function calculateFrameworkMatch(extracted: any, framework: CompetencyFramework): number {
  let matchedCompetencies = 0;
  let totalCompetencies = 0;

  // Check technical competencies
  const extractedSkills = (extracted.transferableSkills || []).map((s: any) => s.skill.toLowerCase());
  for (const comp of framework.technicalCompetencies) {
    totalCompetencies++;
    if (extractedSkills.some(skill => 
      comp.keywords.some(kw => skill.includes(kw.toLowerCase()))
    )) {
      matchedCompetencies++;
    }
  }

  // Check management benchmarks
  const context = extracted.careerContext || {};
  for (const benchmark of framework.managementBenchmarks) {
    totalCompetencies++;
    if (benchmark.aspect === 'Team Size' && context.managementDetails?.verified) {
      matchedCompetencies++;
    } else if (benchmark.aspect === 'Budget Responsibility' && context.budgetDetails?.verified) {
      matchedCompetencies++;
    }
  }

  // Check education
  totalCompetencies++;
  if (context.education?.meetsRequirement) {
    matchedCompetencies++;
  }

  return totalCompetencies > 0 ? Math.round((matchedCompetencies / totalCompetencies) * 100) : 0;
}
