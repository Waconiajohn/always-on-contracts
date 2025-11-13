// =====================================================
// AUTO-POPULATE VAULT V3-HYBRID - Section-by-Section Enhancement
// =====================================================
// Complete overhaul implementing:
// ✅ Phase 1: Enhanced prompts with calculations and transformations
// ✅ Phase 2: Section-by-section processing with context
// ✅ Phase 3: Quality tier progression (draft → needs_review → verified → gold)
// ✅ Phase 4: Industry context and benchmarks
// ✅ Phase 5: Retry strategies for low-confidence extractions
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { parseResumeStructure, detectRoleAndIndustry, type ResumeSection, type RoleInfo } from '../_shared/extraction/pre-extraction-analyzer.ts';
import { extractWithRetry } from '../_shared/extraction/retry-orchestrator.ts';
import { callPerplexity } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';
import { extractStructuredResumeData, analyzeGapsWithAI, type StructuredResumeData } from '../_shared/extraction/ai-structured-extractor.ts';

interface AutoPopulateRequest {
  resumeText: string;
  vaultId: string;
  targetRoles?: string[];
  targetIndustries?: string[];
  mode?: 'full' | 'incremental';
}

interface EducationData {
  level: string | null;
  field: string | null;
  institution?: string;
  graduationYear?: number;
  certifications: string[];
}

interface CareerContextData {
  hasManagementExperience: boolean;
  managementDetails: string;
  teamSizesManaged: number[];
  hasBudgetOwnership: boolean;
  budgetDetails: string;
  budgetSizesManaged: number[];
  hasExecutiveExposure: boolean;
  executiveDetails: string;
  yearsOfExperience: number;
  seniorityLevel: string;
}

interface IndustryBenchmark {
  jobTitle: string;
  industry: string;
  seniorityLevel: string;
  
  // Management expectations
  typicalManagementScope: {
    hasManagement: boolean;
    typicalTeamSize: string;
    managementLevel: string;
  };
  
  // Budget expectations
  typicalBudgetOwnership: {
    hasBudget: boolean;
    typicalBudgetRange: string;
    budgetType: string;
  };
  
  // Executive exposure expectations
  typicalExecutiveExposure: {
    hasExposure: boolean;
    interactionLevel: string;
    strategicScope: string;
  };
  
  // Experience expectations
  typicalYearsExperience: {
    minimum: number;
    typical: number;
    maximum: number;
  };
  
  // Key competencies expected
  expectedCompetencies: string[];
  
  // Education expectations
  typicalEducation: {
    level: string;
    fields: string[];
    certifications: string[];
  };
}

interface ComparisonResult {
  // High-confidence extracted data
  confirmed: {
    hasManagementExperience?: boolean;
    managementDetails?: string;
    teamSizesManaged?: number[];
    hasBudgetOwnership?: boolean;
    budgetDetails?: string;
    budgetSizesManaged?: number[];
    hasExecutiveExposure?: boolean;
    executiveDetails?: string;
    yearsOfExperience?: number;
    seniorityLevel?: string;
    // EDUCATION FIELDS (CRITICAL FIX)
    educationLevel?: string;
    educationField?: string;
    certifications?: string[];
  };
  
  // Likely inferences (80%+ confidence)
  likely: {
    hasManagementExperience?: boolean;
    hasBudgetOwnership?: boolean;
    hasExecutiveExposure?: boolean;
  };
  
  // Gaps requiring targeted questions
  gaps_requiring_questions: Array<{
    field: string;
    question: string;
    context: string;
    expectedAnswer: string;
  }>;
  
  // Evidence summary
  evidence: {
    managementEvidence: string[];
    budgetEvidence: string[];
    executiveEvidence: string[];
    educationEvidence: string[];
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, vaultId, targetRoles, targetIndustries, mode = 'full' } =
      await req.json() as AutoPopulateRequest;

    if (!resumeText || !vaultId) {
      return new Response(
        JSON.stringify({ error: 'resumeText and vaultId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: vault, error: vaultError } = await supabase
      .from('career_vault')
      .select('user_id')
      .eq('id', vaultId)
      .single();

    if (vaultError || !vault) {
      throw new Error('Vault not found');
    }

    const userId = vault.user_id;

    console.log('\n🚀 AUTO-POPULATE VAULT V3-HYBRID (Section-by-Section Enhancement)');
    console.log(`User: ${userId}`);
    console.log(`Vault: ${vaultId}`);
    console.log(`Resume length: ${resumeText.length} chars`);

    // ========================================================================
    // PHASE 2: Parse Resume Structure (Section-by-Section)
    // ========================================================================
    console.log('\n📄 PHASE 2: Parsing resume structure...');
    const resumeStructure = parseResumeStructure(resumeText);
    
    console.log(`✅ Parsed ${resumeStructure.sections.length} sections:`);
    resumeStructure.sections.forEach(section => {
      console.log(`   - ${section.type}: ${section.wordCount} words`);
    });

    // ========================================================================
    // 🤖 PHASE 3: AI-FIRST STRUCTURED EXTRACTION (PRODUCTION)
    // ========================================================================
    // Optimized AI extraction with:
    // - Compact prompt (reduced from 183 to 44 lines)
    // - sonar-reasoning-pro model (best for structured JSON)
    // - 2 minute timeout (vs default 45s)
    // - 6000 max_tokens (down from 8000)
    console.log('\n🤖 PHASE 3: AI-first structured extraction (optimized)...');

    let structuredData: StructuredResumeData | null = null;

    try {
      console.log('⏱️  Starting extraction with 2min timeout...');
      const startTime = Date.now();

      structuredData = await extractStructuredResumeData(resumeText, userId);

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ Extraction complete in ${duration}s`);
      console.log(`   📊 Overall confidence: ${structuredData.extractionMetadata.overallConfidence}%`);
      console.log(`   🎓 Degrees: ${structuredData.education.degrees.length}`);
      console.log(`   💼 Roles: ${structuredData.experience.roles.length}`);
    } catch (error) {
      console.error('❌ AI-first extraction failed:', error);
      console.error('⚠️  PRODUCTION ERROR: This should not happen - needs investigation');
      // Fail fast - don't silently fall back to broken regex
      throw new Error(`Resume extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    // ========================================================================
    // PHASE 4: Detect Role and Industry for Context (NOW WITH GUARANTEED SUCCESS)
    // ========================================================================
    console.log('\n🎯 PHASE 4: Detecting role and industry...');
    const detectedRoleInfo = detectRoleAndIndustry(resumeText, resumeStructure); // Now always returns RoleInfo
    const roleInfo = targetRoles && targetRoles.length > 0
      ? {
          primaryRole: targetRoles[0],
          industry: targetIndustries?.[0] || detectedRoleInfo.industry || 'General',
          seniority: detectedRoleInfo.seniority || 'mid',
          confidence: 90,
          alternativeRoles: targetRoles.slice(1),
        }
      : detectedRoleInfo;

    console.log(`✅ Role: ${roleInfo.primaryRole} | Industry: ${roleInfo.industry} | Seniority: ${roleInfo.seniority} (${roleInfo.confidence}% confidence)`);

    // ========================================================================
    // PHASE 4.5: REMOVED - Now using AI-first extraction (Phase 3)
    // ========================================================================
    // Old regex-based extraction removed - replaced with AI-first structured extraction

    // Clear existing data if mode = 'full'
    if (mode === 'full') {
      console.log('\n🧹 CLEARING EXISTING VAULT DATA');
      await clearVaultData(supabase, vaultId);
    }

    // ========================================================================
    // PHASE 1 & 2 & 5: Extract with Enhanced Prompts, Section-by-Section, with Retry
    // ========================================================================
    console.log('\n🔄 PHASE 1+2+5: Extracting with enhanced prompts, section-by-section, with retry strategies...');

    const allExtracted = {
      powerPhrases: [] as any[],
      skills: [] as any[],
      competencies: [] as any[],
      softSkills: [] as any[],
    };

    // Process Experience section with enhanced power phrase extraction
    const experienceSection = resumeStructure.sections.find(s => s.type === 'experience');
    if (experienceSection) {
      console.log('\n📦 Processing EXPERIENCE section...');
      const experienceResult = await extractWithEnhancement({
        sectionContent: experienceSection.content,
        sectionType: 'experience',
        extractionType: 'power_phrases',
        roleInfo,
        userId,
      });

      experienceResult.powerPhrases.forEach((pp: any) => {
        pp.section_source = 'experience';
        pp.extraction_version = 'v3-hybrid';
      });

      allExtracted.powerPhrases.push(...experienceResult.powerPhrases);
      console.log(`✅ Extracted ${experienceResult.powerPhrases.length} enhanced power phrases`);
    }

    // Process Skills section
    const skillsSection = resumeStructure.sections.find(s => s.type === 'skills');
    if (skillsSection) {
      console.log('\n📦 Processing SKILLS section...');
      const skillsResult = await extractWithEnhancement({
        sectionContent: skillsSection.content,
        sectionType: 'skills',
        extractionType: 'skills',
        roleInfo,
        userId,
      });

      skillsResult.skills.forEach((s: any) => {
        s.section_source = 'skills';
        s.extraction_version = 'v3-hybrid';
      });

      allExtracted.skills.push(...skillsResult.skills);
      console.log(`✅ Extracted ${skillsResult.skills.length} enhanced skills`);
    }

    // Extract competencies from experience (hidden capabilities)
    if (experienceSection) {
      console.log('\n📦 Extracting HIDDEN COMPETENCIES from experience...');
      const competenciesResult = await extractWithEnhancement({
        sectionContent: experienceSection.content,
        sectionType: 'experience',
        extractionType: 'competencies',
        roleInfo,
        userId,
      });

      competenciesResult.competencies.forEach((c: any) => {
        c.section_source = 'experience';
        c.extraction_version = 'v3-hybrid';
      });

      allExtracted.competencies.push(...competenciesResult.competencies);
      console.log(`✅ Extracted ${competenciesResult.competencies.length} hidden competencies`);
    }

    // Extract soft skills with behavioral evidence
    if (experienceSection) {
      console.log('\n📦 Extracting SOFT SKILLS with behavioral evidence...');
      const softSkillsResult = await extractWithEnhancement({
        sectionContent: experienceSection.content,
        sectionType: 'experience',
        extractionType: 'soft_skills',
        roleInfo,
        userId,
      });

      softSkillsResult.softSkills.forEach((ss: any) => {
        ss.section_source = 'experience';
        ss.extraction_version = 'v3-hybrid';
      });

      allExtracted.softSkills.push(...softSkillsResult.softSkills);
      console.log(`✅ Extracted ${softSkillsResult.softSkills.length} soft skills`);
    }

    // Education and career context already extracted in Phase 3 AI-first extraction
    // Data is available in structuredData.education and structuredData.experience

    // ========================================================================
    // PHASE 3: Assign Quality Tiers and Review Priority
    // ========================================================================
    console.log('\n🏆 PHASE 3: Assigning quality tiers and review priorities...');

    allExtracted.powerPhrases.forEach((pp, index) => {
      const hasMetrics = pp.impact_metrics && Object.keys(pp.impact_metrics).length > 0;
      const hasCalculations = pp.enhancement_notes && pp.enhancement_notes.includes('calculated');
      const confidenceScore = pp.confidence_score || 0.7;

      // Quality tier logic
      if (hasMetrics && hasCalculations && confidenceScore > 0.85) {
        pp.quality_tier = 'verified'; // High confidence with enhancements
        pp.review_priority = index < 5 ? 80 : 50; // Top 5 get priority
      } else if (hasMetrics || hasCalculations) {
        pp.quality_tier = 'needs_review'; // Has some enhancements, needs verification
        pp.review_priority = index < 10 ? 60 : 30;
      } else {
        pp.quality_tier = 'draft'; // Needs enhancement
        pp.review_priority = 20;
      }
    });

    allExtracted.skills.forEach((s, index) => {
      const hasEquivalents = s.equivalent_skills && s.equivalent_skills.length > 0;
      const confidenceScore = s.confidence_score || 0.7;

      if (hasEquivalents && confidenceScore > 0.8) {
        s.quality_tier = 'verified';
        s.review_priority = index < 5 ? 70 : 40;
      } else {
        s.quality_tier = 'draft';
        s.review_priority = 20;
      }
    });

    allExtracted.competencies.forEach((c) => {
      c.quality_tier = 'needs_review'; // Hidden competencies always need review
      c.review_priority = 60;
    });

    allExtracted.softSkills.forEach((ss) => {
      const hasEvidence = ss.examples && ss.examples.length > 50;
      ss.quality_tier = hasEvidence ? 'needs_review' : 'draft';
      ss.review_priority = hasEvidence ? 50 : 20;
    });

    // ========================================================================
    // 🔍 PHASE 6: AI-POWERED GAP ANALYSIS (PRODUCTION)
    // ========================================================================
    console.log('\n🔍 PHASE 6: AI-powered gap analysis with confidence-based filtering...');

    try {
      // Define benchmark expectations based on role
      const benchmarkExpectations = {
        jobTitle: roleInfo.primaryRole,
        industry: roleInfo.industry,
        seniorityLevel: structuredData!.professionalIdentity.seniorityLevel,
        expectedEducation: `Bachelor's degree or higher in relevant field`,
        expectedManagement: roleInfo.seniority.includes('Manager') || roleInfo.seniority.includes('Director') || roleInfo.seniority.includes('VP') || roleInfo.seniority.includes('C-Level')
          ? 'Management experience required'
          : 'Management experience preferred',
        expectedBudget: roleInfo.seniority.includes('Manager') || roleInfo.seniority.includes('Director') || roleInfo.seniority.includes('VP') || roleInfo.seniority.includes('C-Level')
          ? 'Budget ownership expected'
          : 'Budget ownership optional',
        expectedCompetencies: [
          `${roleInfo.industry} expertise`,
          'Strategic thinking',
          'Cross-functional collaboration',
          'Problem-solving',
        ],
      };

      const gapAnalysis = await analyzeGapsWithAI(
        structuredData!,
        benchmarkExpectations,
        userId
      );

      console.log('✅ Gap analysis complete!');
      console.log(`   🎯 Critical gaps: ${gapAnalysis.criticalGaps.length}`);
      console.log(`   ✓  Verification questions: ${gapAnalysis.verificationQuestions.length}`);
      console.log(`   ✅ No questions needed: ${gapAnalysis.noQuestionsNeeded.length}`);
      console.log(`   📊 Data completeness: ${gapAnalysis.overallAssessment.dataCompleteness}%`);
      console.log(`   📊 Data quality: ${gapAnalysis.overallAssessment.dataQuality}%`);

      // Store gap analysis in vault_benchmark_comparison table
      const { error: benchmarkError } = await supabase
        .from('vault_benchmark_comparison')
        .upsert({
          vault_id: vaultId,
          user_id: userId,
          job_title: benchmarkExpectations.jobTitle,
          industry: benchmarkExpectations.industry,
          seniority_level: benchmarkExpectations.seniorityLevel,
          benchmark_data: benchmarkExpectations,
          confirmed_data: {
            // Map structuredData to old format for compatibility with gap question generator
            educationLevel: structuredData!.education.degrees[0]?.level,
            educationField: structuredData!.education.degrees[0]?.field,
            certifications: structuredData!.education.certifications.map(c => c.name),
            hasManagementExperience: structuredData!.experience.management.hasExperience,
            managementDetails: structuredData!.experience.management.details,
            teamSizesManaged: structuredData!.experience.management.teamSizes,
            hasBudgetOwnership: structuredData!.experience.budget.hasExperience,
            budgetDetails: structuredData!.experience.budget.details,
            budgetSizesManaged: structuredData!.experience.budget.amounts,
            hasExecutiveExposure: structuredData!.experience.executive.hasExposure,
            executiveDetails: structuredData!.experience.executive.details,
            yearsOfExperience: structuredData!.experience.totalYears,
            seniorityLevel: structuredData!.professionalIdentity.seniorityLevel,
          },
          likely_data: {
            // Empty - we use confidence scores now instead of likely/confirmed split
          },
          gaps_requiring_questions: gapAnalysis.criticalGaps.map(gap => ({
            field: gap.field,
            question: gap.question,
            context: gap.reason,
            expectedAnswer: gap.expectedAnswer,
            priority: gap.priority,
            currentConfidence: gap.currentConfidence,
          })),
          evidence_summary: {
            managementEvidence: structuredData!.experience.management.evidence,
            budgetEvidence: structuredData!.experience.budget.evidence,
            executiveEvidence: structuredData!.experience.executive.evidence,
            educationEvidence: structuredData!.education.degrees.map(d => d.evidence),
          },
          comparison_confidence: gapAnalysis.overallAssessment.dataQuality / 100,
        }, {
          onConflict: 'vault_id'
        });

      if (benchmarkError) {
        console.error('❌ Error storing gap analysis:', benchmarkError);
      } else {
        console.log('✅ Stored AI-powered gap analysis with confirmed data mapping');
      }

    } catch (error) {
      console.error('⚠️ Gap analysis failed:', error);
      console.log('   Continuing without gap analysis...');
    }

    // ========================================================================
    // PHASE 4: Add Industry Context
    // ========================================================================
    console.log('\n🌐 PHASE 4: Adding industry context...');

    if (roleInfo) {
      allExtracted.powerPhrases.forEach((pp) => {
        pp.industry_context = {
          industry: roleInfo.industry,
          role: roleInfo.primaryRole,
          seniority: roleInfo.seniority,
          // Add benchmarks if available from metrics
          benchmarks: pp.impact_metrics ? getBenchmarkContext(pp.impact_metrics, roleInfo) : {}
        };
      });

      allExtracted.skills.forEach((s) => {
        s.industry_context = {
          industry: roleInfo.industry,
          role: roleInfo.primaryRole,
          demandLevel: 'high', // Could be enhanced with external API
        };
      });
    }

    // ========================================================================
    // STORE EXTRACTED DATA
    // ========================================================================
    console.log('\n💾 Storing extracted data...');

    // Store power phrases
    if (allExtracted.powerPhrases.length > 0) {
      const powerPhrasesInserts = allExtracted.powerPhrases.map((pp) => ({
        vault_id: vaultId,
        user_id: userId,
        power_phrase: pp.phrase || pp.power_phrase,
        category: pp.category || 'General',
        confidence_score: pp.confidence_score || 0.8,
        quality_tier: pp.quality_tier,
        impact_metrics: pp.impact_metrics || {},
        keywords: pp.keywords || [],
        section_source: pp.section_source,
        extraction_version: pp.extraction_version,
        review_priority: pp.review_priority,
        industry_context: pp.industry_context || {},
        enhancement_notes: pp.enhancement_notes,
      }));

      const { error: ppError } = await supabase
        .from('vault_power_phrases')
        .insert(powerPhrasesInserts);

      if (ppError) {
        console.error('❌ Error inserting power phrases:', ppError);
      } else {
        console.log(`✅ Stored ${powerPhrasesInserts.length} power phrases`);
        console.log(`   - Verified: ${powerPhrasesInserts.filter(p => p.quality_tier === 'verified').length}`);
        console.log(`   - Needs Review: ${powerPhrasesInserts.filter(p => p.quality_tier === 'needs_review').length}`);
        console.log(`   - Draft: ${powerPhrasesInserts.filter(p => p.quality_tier === 'draft').length}`);
      }
    }

    // Store skills
    if (allExtracted.skills.length > 0) {
      const skillsInserts = allExtracted.skills.map((s) => ({
        vault_id: vaultId,
        user_id: userId,
        stated_skill: s.stated_skill || s.skill_name || s.skill,
        equivalent_skills: s.equivalent_skills || [],
        evidence: s.evidence || 'Extracted from resume analysis',
        confidence_score: Math.round((s.confidence_score || 0.8) * 100),
        quality_tier: s.quality_tier,
        section_source: s.section_source,
        extraction_version: s.extraction_version,
        review_priority: s.review_priority,
        industry_context: s.industry_context || {},
        enhancement_notes: s.enhancement_notes,
      }));

      const { error: skillsError } = await supabase
        .from('vault_transferable_skills')
        .insert(skillsInserts);

      if (skillsError) {
        console.error('❌ Error inserting skills:', skillsError);
      } else {
        console.log(`✅ Stored ${skillsInserts.length} skills`);
      }
    }

    // Store competencies
    if (allExtracted.competencies.length > 0) {
      const competenciesInserts = allExtracted.competencies.map((c) => ({
        vault_id: vaultId,
        user_id: userId,
        competency_area: c.competency_area || c.area,
        inferred_capability: c.inferred_capability || c.capability,
        supporting_evidence: c.supporting_evidence || ['Resume analysis'],
        confidence_score: Math.round((c.confidence_score || 0.75) * 100),
        quality_tier: c.quality_tier,
        section_source: c.section_source,
        extraction_version: c.extraction_version,
        review_priority: c.review_priority,
        enhancement_notes: c.enhancement_notes,
      }));

      const { error: compError } = await supabase
        .from('vault_hidden_competencies')
        .insert(competenciesInserts);

      if (compError) {
        console.error('❌ Error inserting competencies:', compError);
      } else {
        console.log(`✅ Stored ${competenciesInserts.length} competencies`);
      }
    }

    // Store soft skills
    if (allExtracted.softSkills.length > 0) {
      const softSkillsInserts = allExtracted.softSkills.map((ss) => ({
        vault_id: vaultId,
        user_id: userId,
        skill_name: ss.soft_skill || ss.skill_name || ss.skill,
        examples: ss.examples || ss.behavioral_evidence || 'Demonstrated through professional experience',
        confidence_score: Math.round((ss.confidence_score || 0.75) * 100),
        quality_tier: ss.quality_tier,
        section_source: ss.section_source,
        extraction_version: ss.extraction_version,
        review_priority: ss.review_priority,
      }));

      const { error: ssError } = await supabase
        .from('vault_soft_skills')
        .insert(softSkillsInserts);

      if (ssError) {
        console.error('❌ Error inserting soft skills:', ssError);
      } else {
        console.log(`✅ Stored ${softSkillsInserts.length} soft skills`);
      }
    }

    // ========================================================================
    // 💾 STORE AI-FIRST STRUCTURED DATA (PRODUCTION)
    // ========================================================================
    console.log('\n💾 STORING AI-FIRST STRUCTURED DATA...');

    // Store career context from AI-first extraction
    const contextPayload: any = {
      vault_id: vaultId,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    // Education (from AI-first extraction with confidence scores)
    if (structuredData!.education.degrees.length > 0) {
      const primaryDegree = structuredData!.education.degrees[0]; // Highest/most recent degree
      contextPayload.education_level = primaryDegree.level;
      contextPayload.education_field = primaryDegree.field;
      console.log(`  🎓 Education: ${primaryDegree.level} in ${primaryDegree.field} (confidence: ${primaryDegree.confidence}%)`);
    }

    // Certifications
    if (structuredData!.education.certifications.length > 0) {
      contextPayload.certifications = structuredData!.education.certifications.map(c => c.name);
      console.log(`  📜 Certifications: ${contextPayload.certifications.join(', ')}`);
    }

    // Experience
    contextPayload.years_of_experience = structuredData!.experience.totalYears;
    contextPayload.inferred_seniority = structuredData!.professionalIdentity.seniorityLevel;

    // Management
    contextPayload.has_management_experience = structuredData!.experience.management.hasExperience;
    contextPayload.management_details = structuredData!.experience.management.details;
    contextPayload.team_sizes_managed = structuredData!.experience.management.teamSizes;
    console.log(`  👔 Management: ${contextPayload.has_management_experience ? 'YES' : 'NO'} (confidence: ${structuredData!.experience.management.confidence}%)`);

    // Budget
    contextPayload.has_budget_ownership = structuredData!.experience.budget.hasExperience;
    contextPayload.budget_details = structuredData!.experience.budget.details;
    contextPayload.budget_sizes_managed = structuredData!.experience.budget.amounts;
    console.log(`  💰 Budget: ${contextPayload.has_budget_ownership ? 'YES' : 'NO'} (confidence: ${structuredData!.experience.budget.confidence}%)`);

    // Executive
    contextPayload.has_executive_exposure = structuredData!.experience.executive.hasExposure;
    contextPayload.executive_details = structuredData!.experience.executive.details;
    console.log(`  📈 Executive: ${contextPayload.has_executive_exposure ? 'YES' : 'NO'} (confidence: ${structuredData!.experience.executive.confidence}%)`);

    const { error: contextError } = await supabase
      .from('vault_career_context')
      .upsert(contextPayload, {
        onConflict: 'vault_id'
      });

    if (contextError) {
      console.error('❌ Error storing career context:', contextError);
    } else {
      console.log('✅ Stored AI-first career context successfully!');
    }

    // Update vault metadata
    const totalItems = 
      allExtracted.powerPhrases.length +
      allExtracted.skills.length +
      allExtracted.competencies.length +
      allExtracted.softSkills.length;

    await supabase
      .from('career_vault')
      .update({
        auto_populated: true,
        extraction_item_count: totalItems,
        last_updated_at: new Date().toISOString(),
      })
      .eq('id', vaultId);

    // ========================================================================
    // TIER 1: FAST QUALITY CHECK (Auto-run after extraction)
    // ========================================================================
    console.log('\n🔍 TIER 1: Running fast quality check...');

    try {
      const qualityCheckResponse = await fetch(`${supabaseUrl}/functions/v1/vault-quality-check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vaultId,
          resumeText,
        }),
      });

      if (qualityCheckResponse.ok) {
        const qualityResult = await qualityCheckResponse.json();
        console.log('✅ TIER 1 Creative Enhancement complete:', {
          enhancementsApplied: qualityResult.data?.enhancementsApplied || 0,
          enhancementsSkipped: qualityResult.data?.enhancementsSkipped || 0,
          vaultStrengthBefore: qualityResult.data?.vaultStrengthBefore || 0,
          vaultStrengthAfter: qualityResult.data?.vaultStrengthAfter || 0,
          improvement: (qualityResult.data?.vaultStrengthAfter || 0) - (qualityResult.data?.vaultStrengthBefore || 0),
          summary: qualityResult.data?.summary || 'No summary',
        });
      } else {
        console.warn('⚠️ Quality check failed (non-critical):', await qualityCheckResponse.text());
      }
    } catch (qualityError) {
      console.warn('⚠️ Quality check error (non-critical):', qualityError);
      // Don't fail the entire extraction if quality check fails
    }

    // ========================================================================
    // RETURN RESPONSE
    // ========================================================================

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          extracted: {
            powerPhrasesCount: allExtracted.powerPhrases.length,
            skillsCount: allExtracted.skills.length,
            competenciesCount: allExtracted.competencies.length,
            softSkillsCount: allExtracted.softSkills.length,
            total: totalItems,
          },
          qualityBreakdown: {
            verified: allExtracted.powerPhrases.filter(p => p.quality_tier === 'verified').length,
            needsReview: allExtracted.powerPhrases.filter(p => p.quality_tier === 'needs_review').length,
            draft: allExtracted.powerPhrases.filter(p => p.quality_tier === 'draft').length,
          },
          preExtractionContext: {
            role: roleInfo?.primaryRole,
            industry: roleInfo?.industry,
            seniority: roleInfo?.seniority,
            sectionsProcessed: resumeStructure.sections.length,
          },
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Auto-populate error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown extraction error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ========================================================================
// EXTRACTION WITH ENHANCEMENT (PHASE 1)
// ========================================================================

interface ExtractionParams {
  sectionContent: string;
  sectionType: 'experience' | 'skills' | 'education' | 'certifications' | 'other';
  extractionType: 'power_phrases' | 'skills' | 'competencies' | 'soft_skills';
  roleInfo: RoleInfo | null;
  userId: string;
}

async function extractWithEnhancement(params: ExtractionParams): Promise<any> {
  const { sectionContent, sectionType, extractionType, roleInfo, userId } = params;

  // Build enhanced prompt
  const prompt = buildEnhancedPrompt(sectionContent, sectionType, extractionType, roleInfo);

  // Call AI with retry logic (Phase 5)
  const result = await callPerplexity(
    {
      messages: [{ role: 'user', content: prompt }],
      model: 'sonar-pro',
      max_tokens: 4000,
    },
    `extract_${extractionType}`,
    userId
  );

  await logAIUsage({
    model: 'sonar-pro',
    tokens: result.response.usage?.total_tokens || 2000,
    task: extractionType,
    userId,
  });

  const content = result.response.choices[0].message.content;
  const parseResult = extractJSON(content);

  if (!parseResult.success || !parseResult.data) {
    console.error(`Failed to parse ${extractionType}:`, parseResult.error);
    return {
      [extractionType === 'power_phrases' ? 'powerPhrases' : extractionType]: [],
    };
  }

  // Return parsed data
  const key = extractionType === 'power_phrases' ? 'powerPhrases' :
               extractionType === 'soft_skills' ? 'softSkills' :
               extractionType;

  return {
    [key]: parseResult.data,
  };
}

// ========================================================================
// ENHANCED PROMPT BUILDING (PHASE 1)
// ========================================================================

function buildEnhancedPrompt(
  sectionContent: string,
  sectionType: string,
  extractionType: string,
  roleInfo: RoleInfo | null
): string {
  const contextPrefix = roleInfo
    ? `Role: ${roleInfo.primaryRole}\nIndustry: ${roleInfo.industry}\nSeniority: ${roleInfo.seniority}\n\n`
    : '';

  switch (extractionType) {
    case 'power_phrases':
      return `${contextPrefix}You are analyzing a RESUME'S ${sectionType.toUpperCase()} SECTION to extract and ENHANCE achievements.

CRITICAL RULES - DO NOT JUST COPY:
1. CALCULATE metrics from context:
   - "Led team of engineers on 13 wells" → Calculate: Team size × wells × typical payroll = "$3M+ payroll responsibility"
   - "Reduced rig mobility time from 5.5 to 3.0 days" → Calculate: (5.5-3.0)/5.5 = "45% improvement"
   - "17% cost reduction" → Estimate: 17% of well costs = "$X saved per well × Y wells = $Z total"

2. EXPAND abbreviated terms:
   - "AFE" → "AFE (Authorization for Expenditure)"
   - "BHA" → "BHA (Bottom Hole Assembly)"
   - "Managed P&A" → "Managed Plug & Abandonment operations"

3. ADD context and scale:
   - "Led drilling operations" → "Led drilling operations for $50M annual program (Z wells)"
   - "Improved efficiency" → "Improved efficiency by X%, generating $Y in cost savings"

Resume section:
${sectionContent}

Extract achievements as JSON array:
[{
  "phrase": "Enhanced achievement with calculations",
  "category": "Technical|Leadership|Financial|Safety|Other",
  "confidence_score": 0.0-1.0,
  "impact_metrics": {
    "teamSize": number,
    "budget": number,
    "percentage": number,
    "timeframe": "string"
  },
  "keywords": ["key", "terms"],
  "enhancement_notes": "How this was calculated/enhanced from raw resume"
}]`;

    case 'skills':
      return `${contextPrefix}Extract skills from this ${sectionType} section and provide CROSS-FUNCTIONAL EQUIVALENTS.

RULES:
1. For each technical skill, identify equivalent skills in other industries
   - "Drilling Operations" → ["Project Execution", "Complex Systems Management", "Field Operations"]
   - "AFE Generation" → ["Budget Planning", "Financial Forecasting", "Capital Project Management"]

2. Extract both stated skills AND implied skills
   - If they mention "Led team" but don't list "Team Management", extract it as implied

Resume section:
${sectionContent}

Return JSON array:
[{
  "stated_skill": "Exact skill from resume",
  "equivalent_skills": ["Cross-functional equivalent 1", "Equivalent 2"],
  "evidence": "Where this skill was demonstrated",
  "confidence_score": 0.0-1.0,
  "enhancement_notes": "Why these equivalents were chosen"
}]`;

    case 'competencies':
      return `${contextPrefix}Extract HIDDEN COMPETENCIES - capabilities NOT explicitly stated but clearly demonstrated.

RULES:
1. Look for evidence of capabilities they DIDN'T name:
   - Delivered 13 wells under budget → HIDDEN: Financial Acumen, Risk Management
   - Led adoption of new technology → HIDDEN: Change Management, Innovation Leadership
   - Coordinated with multiple departments → HIDDEN: Stakeholder Management, Cross-functional Leadership

2. Infer from actions, not titles

Resume section:
${sectionContent}

Return JSON array:
[{
  "competency_area": "Financial|Technical|Strategic|People|Business",
  "inferred_capability": "Specific hidden capability",
  "supporting_evidence": ["Quote from resume showing this"],
  "confidence_score": 0.0-1.0,
  "enhancement_notes": "Why this competency was inferred"
}]`;

    case 'soft_skills':
      return `${contextPrefix}Extract soft skills with BEHAVIORAL EVIDENCE.

RULES:
1. Only extract soft skills with clear behavioral indicators:
   - "Led pre-tour safety meetings" → Leadership, Communication
   - "Overcame high temperature challenges through well redesign" → Problem-Solving, Adaptability
   - "Coordinated with BU on rig schedules" → Collaboration, Planning

2. Provide specific examples, not generic statements

Resume section:
${sectionContent}

Return JSON array:
[{
  "soft_skill": "Specific soft skill name",
  "examples": "Behavioral evidence from resume showing this skill",
  "confidence_score": 0.0-1.0,
  "enhancement_notes": "How this behavioral evidence demonstrates the skill"
}]`;

    default:
      return '';
  }
}

// ========================================================================
// INDUSTRY CONTEXT (PHASE 4)
// ========================================================================

function getBenchmarkContext(metrics: any, roleInfo: RoleInfo): any {
  const benchmarks: any = {};

  // Add team size context
  if (metrics.teamSize) {
    if (roleInfo.industry === 'Oil & Gas') {
      if (metrics.teamSize < 5) {
        benchmarks.teamSizeContext = 'Small team (typical for field operations)';
      } else if (metrics.teamSize < 15) {
        benchmarks.teamSizeContext = 'Mid-size team (typical for multi-well programs)';
      } else {
        benchmarks.teamSizeContext = 'Large team (top 10% in industry)';
      }
    }
  }

  // Add percentage improvement context
  if (metrics.percentage) {
    if (metrics.percentage > 40) {
      benchmarks.improvementContext = 'Exceptional improvement (top 5% performance)';
    } else if (metrics.percentage > 20) {
      benchmarks.improvementContext = 'Strong improvement (above industry average)';
    } else {
      benchmarks.improvementContext = 'Solid improvement';
    }
  }

  return benchmarks;
}

// ========================================================================
// VAULT CLEANUP HELPER
// ========================================================================

// ========================================================================
// EDUCATION EXTRACTION (DEPRECATED - DO NOT USE)
// ========================================================================
/**
 * @deprecated DO NOT USE - Replaced by extractStructuredResumeData()
 * This function makes redundant AI calls and should NOT be called.
 * Keep for backward compatibility only.
 */
async function extractEducation(params: {
  sectionContent: string;
  userId: string;
}): Promise<EducationData> {
  const prompt = `Extract education information from this resume section.

Resume Section:
${params.sectionContent}

Return JSON:
{
  "level": "High School|Associate|Bachelor|Master|PhD|None",
  "field": "Primary major/field of study",
  "institution": "School name",
  "graduationYear": 2020,
  "certifications": ["Cert 1", "Cert 2"]
}

Rules:
- For "Bachelor of Science in Mechanical Engineering" → level: "Bachelor", field: "Mechanical Engineering"
- For "MBA" → level: "Master", field: "Business Administration"
- Extract ALL certifications and licenses
`;

  try {
    const result = await callPerplexity({
      messages: [{ role: 'user', content: prompt }],
      model: 'sonar-pro',
      max_tokens: 1000,
    }, 'extract_education', params.userId);

    await logAIUsage({
      model: 'sonar-pro',
      tokens: result.response.usage?.total_tokens || 1000,
      task: 'extract_education',
      userId: params.userId,
    });

    const content = result.response.choices[0].message.content;
    const parseResult = extractJSON(content);
    
    return {
      level: parseResult.data?.level || null,
      field: parseResult.data?.field || null,
      institution: parseResult.data?.institution,
      graduationYear: parseResult.data?.graduationYear,
      certifications: parseResult.data?.certifications || [],
    };
  } catch (error) {
    console.error('[EDUCATION-EXTRACTION] Error:', error);
    return {
      level: null,
      field: null,
      certifications: [],
    };
  }
}

// ========================================================================
// 🎯 INDUSTRY BENCHMARK FETCHING
// ========================================================================

async function fetchIndustryBenchmarks(params: {
  jobTitle: string;
  industry: string;
  seniorityLevel: string;
  userId: string;
}): Promise<IndustryBenchmark> {
  const prompt = `You are an expert career analyst. Provide industry benchmarks for this role:

Job Title: ${params.jobTitle}
Industry: ${params.industry}
Seniority: ${params.seniorityLevel}

Return STRICT JSON with this structure:
{
  "jobTitle": "${params.jobTitle}",
  "industry": "${params.industry}",
  "seniorityLevel": "${params.seniorityLevel}",
  "typicalManagementScope": {
    "hasManagement": true/false,
    "typicalTeamSize": "e.g., 5-10 direct reports",
    "managementLevel": "e.g., Direct reports, Multiple teams, Department-level"
  },
  "typicalBudgetOwnership": {
    "hasBudget": true/false,
    "typicalBudgetRange": "e.g., $500K-$2M annually",
    "budgetType": "e.g., Project budgets, Operational budget, P&L ownership"
  },
  "typicalExecutiveExposure": {
    "hasExposure": true/false,
    "interactionLevel": "e.g., Regular C-suite presentations, Occasional executive briefings",
    "strategicScope": "e.g., Influences departmental strategy, Drives company-wide initiatives"
  },
  "typicalYearsExperience": {
    "minimum": 5,
    "typical": 8,
    "maximum": 15
  },
  "expectedCompetencies": ["Competency 1", "Competency 2", "Competency 3"],
  "typicalEducation": {
    "level": "Bachelor|Master|PhD|None",
    "fields": ["Engineering", "Business"],
    "certifications": ["PMP", "Six Sigma"]
  }
}`;

  try {
    const { response } = await callPerplexity({
      messages: [{ role: 'user', content: prompt }],
      model: 'sonar-pro',
      max_tokens: 2000,
      temperature: 0.3,
    }, 'fetch_industry_benchmarks', params.userId);

    await logAIUsage({
      model: 'sonar-pro',
      tokens: response.usage?.total_tokens || 2000,
      task: 'fetch_industry_benchmarks',
      userId: params.userId,
    });

    const content = response.choices[0].message.content;
    const parseResult = extractJSON(content);
    
    return parseResult.data as IndustryBenchmark;
  } catch (error) {
    console.error('[BENCHMARK-FETCH] Error:', error);
    throw error;
  }
}

// ========================================================================
// 🎯 RESUME-TO-BENCHMARK COMPARISON
// ========================================================================

async function compareResumeAgainstBenchmark(params: {
  resumeText: string;
  benchmark: IndustryBenchmark;
  userId: string;
}): Promise<ComparisonResult> {
  const prompt = `Compare this resume against industry benchmarks and identify gaps.

RESUME:
${params.resumeText}

INDUSTRY BENCHMARKS:
- Job Title: ${params.benchmark.jobTitle}
- Industry: ${params.benchmark.industry}
- Seniority: ${params.benchmark.seniorityLevel}

Expected for this role:
- Management: ${params.benchmark.typicalManagementScope.hasManagement ? `Yes (${params.benchmark.typicalManagementScope.typicalTeamSize})` : 'No'}
- Budget: ${params.benchmark.typicalBudgetOwnership.hasBudget ? `Yes (${params.benchmark.typicalBudgetOwnership.typicalBudgetRange})` : 'No'}
- Executive Exposure: ${params.benchmark.typicalExecutiveExposure.hasExposure ? `Yes (${params.benchmark.typicalExecutiveExposure.interactionLevel})` : 'No'}
- Years Experience: ${params.benchmark.typicalYearsExperience.typical}
- Education: ${params.benchmark.typicalEducation.level} in ${params.benchmark.typicalEducation.fields.join(' or ')}, Certifications: ${params.benchmark.typicalEducation.certifications.join(', ')}
- Key Competencies: ${params.benchmark.expectedCompetencies.join(', ')}

YOUR TASK:
1. Extract CONFIRMED data (explicitly stated in resume) - INCLUDING EDUCATION
2. Identify LIKELY inferences (80%+ confidence based on context)
3. Generate TARGETED questions ONLY for gaps where benchmark expects data but resume doesn't show it

Return STRICT JSON:
{
  "confirmed": {
    "hasManagementExperience": true/false,
    "managementDetails": "Specific quote from resume",
    "teamSizesManaged": [5, 10],
    "hasBudgetOwnership": true/false,
    "budgetDetails": "Specific quote from resume",
    "budgetSizesManaged": [500000, 2000000],
    "hasExecutiveExposure": true/false,
    "executiveDetails": "Specific quote from resume",
    "yearsOfExperience": 10,
    "seniorityLevel": "Mid-Level|Senior|Executive",
    "educationLevel": "Bachelor|Master|PhD|Associate|High School|None",
    "educationField": "Mechanical Engineering",
    "certifications": ["PMP", "PE"]
  },
  "likely": {
    "hasManagementExperience": true/false,
    "hasBudgetOwnership": true/false,
    "hasExecutiveExposure": true/false
  },
  "gaps_requiring_questions": [
    {
      "field": "budget_ownership",
      "question": "What was the typical budget size you managed for drilling operations?",
      "context": "Resume mentions cost management but no specific budget amounts",
      "expectedAnswer": "Dollar amount range"
    }
  ],
  "evidence": {
    "managementEvidence": ["Quote 1 from resume", "Quote 2"],
    "budgetEvidence": ["Quote 1", "Quote 2"],
    "executiveEvidence": ["Quote 1", "Quote 2"],
    "educationEvidence": ["Degree quote", "Certification quote"]
  }
}

CRITICAL RULES:
- Only mark as "confirmed" if explicitly stated in resume
- For EDUCATION: Extract degree type (Bachelor/Master/PhD), field of study, and certifications from resume
- DO NOT generate education questions if degree and field are confirmed in resume
- Use "likely" for strong contextual inferences (80%+ confidence)
- Generate targeted questions ONLY for missing data that the benchmark expects for this role
- Extract specific quotes as evidence`;

  try {
    const { response } = await callPerplexity({
      messages: [{ role: 'user', content: prompt }],
      model: 'sonar-pro',
      max_tokens: 3000,
      temperature: 0.4,
    }, 'compare_resume_benchmark', params.userId);

    await logAIUsage({
      model: 'sonar-pro',
      tokens: response.usage?.total_tokens || 3000,
      task: 'compare_resume_benchmark',
      userId: params.userId,
    });

    const content = response.choices[0].message.content;
    const parseResult = extractJSON(content);
    
    return parseResult.data as ComparisonResult;
  } catch (error) {
    console.error('[BENCHMARK-COMPARISON] Error:', error);
    throw error;
  }
}

// ========================================================================
// 🎯 CAREER CONTEXT EXTRACTION (DEPRECATED - DO NOT USE)
// ========================================================================
/**
 * @deprecated DO NOT USE - Replaced by extractStructuredResumeData()
 * This function makes redundant AI calls and should NOT be called.
 * Keep for backward compatibility only.
 */
async function extractCareerContext(params: {
  resumeText: string;
  userId: string;
}): Promise<CareerContextData> {
  const prompt = `Analyze this resume and extract career context indicators.

Resume:
${params.resumeText}

**MANAGEMENT EXPERIENCE INDICATORS:**
Look for:
- Job titles: Manager, Supervisor, Lead, Director, VP, Chief, Head, Team Lead
- Action verbs: supervised, managed, led, guided, directed, oversaw, coordinated
- Team scope: "team of X", "X engineers", "X reports", "X rigs", "managed X people"
- Organizational structure: "reporting to X", "direct reports", "led a team"

**BUDGET OWNERSHIP INDICATORS:**
Look for:
- Dollar amounts: "$350MM", "$1.5M", "multi-million", "$500K budget"
- Financial terms: "budget responsibility", "P&L ownership", "cost center", "spending authority"
- Budget actions: "managed budget", "oversaw expenditures", "approved spending", "fiscal responsibility"

**EXECUTIVE EXPOSURE INDICATORS:**
Look for:
- C-suite interactions: "presented to CEO", "advised board", "executive briefings"
- Strategic scope: "company-wide initiative", "organizational transformation", "enterprise strategy"
- External representation: "industry speaker", "partnership negotiations", "executive committee"

**SENIORITY INFERENCE:**
Based on years of experience, job titles, and scope:
- Entry-Level: 0-2 years, Junior, Associate titles
- Mid-Level: 3-5 years, no management, specialist roles
- Senior: 6-10 years, small team lead, expert roles
- Senior Manager: 10-15 years, manages multiple teams/projects, significant budget
- Executive: 15+ years, VP/Director/C-suite, strategic decision-making

Return ONLY valid JSON (no markdown):
{
  "hasManagementExperience": boolean,
  "managementDetails": "Detailed description of management scope (empty string if none)",
  "teamSizesManaged": [array of numbers extracted from resume, empty array if none],
  "hasBudgetOwnership": boolean,
  "budgetDetails": "Detailed description of budget responsibility (empty string if none)",
  "budgetSizesManaged": [array of budget amounts in dollars, empty array if none],
  "hasExecutiveExposure": boolean,
  "executiveDetails": "Detailed description of executive interactions (empty string if none)",
  "yearsOfExperience": number (estimate from resume),
  "seniorityLevel": "Entry-Level" | "Mid-Level" | "Senior" | "Senior Manager" | "Executive"
}

**CRITICAL RULES:**
- If NO management indicators found, return hasManagementExperience: false
- If NO budget indicators found, return hasBudgetOwnership: false
- If NO executive indicators found, return hasExecutiveExposure: false
- Extract ALL team sizes and budget amounts you find
- Be generous with inference (e.g., "Supervisor" title = management experience)
- Return valid JSON only, no markdown code blocks`;

  try {
    const result = await callPerplexity({
      messages: [{ role: 'user', content: prompt }],
      model: 'sonar-pro',
      max_tokens: 1500,
    }, 'extract_career_context', params.userId);

    await logAIUsage({
      model: 'sonar-pro',
      tokens: result.response.usage?.total_tokens || 1500,
      task: 'extract_career_context',
      userId: params.userId,
    });

    const content = result.response.choices[0].message.content;
    const parseResult = extractJSON(content);
    
    return {
      hasManagementExperience: parseResult.data?.hasManagementExperience || false,
      managementDetails: parseResult.data?.managementDetails || '',
      teamSizesManaged: parseResult.data?.teamSizesManaged || [],
      hasBudgetOwnership: parseResult.data?.hasBudgetOwnership || false,
      budgetDetails: parseResult.data?.budgetDetails || '',
      budgetSizesManaged: parseResult.data?.budgetSizesManaged || [],
      hasExecutiveExposure: parseResult.data?.hasExecutiveExposure || false,
      executiveDetails: parseResult.data?.executiveDetails || '',
      yearsOfExperience: parseResult.data?.yearsOfExperience || 0,
      seniorityLevel: parseResult.data?.seniorityLevel || 'Mid-Level',
    };
  } catch (error) {
    console.error('[CAREER-CONTEXT-EXTRACTION] Error:', error);
    return {
      hasManagementExperience: false,
      managementDetails: '',
      teamSizesManaged: [],
      hasBudgetOwnership: false,
      budgetDetails: '',
      budgetSizesManaged: [],
      hasExecutiveExposure: false,
      executiveDetails: '',
      yearsOfExperience: 0,
      seniorityLevel: 'Mid-Level',
    };
  }
}

// ========================================================================
// VAULT CLEANUP HELPER
// ========================================================================

async function clearVaultData(supabase: any, vaultId: string): Promise<void> {
  await supabase.from('vault_power_phrases').delete().eq('vault_id', vaultId);
  await supabase.from('vault_transferable_skills').delete().eq('vault_id', vaultId);
  await supabase.from('vault_hidden_competencies').delete().eq('vault_id', vaultId);
  await supabase.from('vault_soft_skills').delete().eq('vault_id', vaultId);
  await supabase.from('vault_leadership_philosophy').delete().eq('vault_id', vaultId);
  await supabase.from('vault_executive_presence').delete().eq('vault_id', vaultId);

  await supabase
    .from('career_vault')
    .update({
      auto_populated: false,
      extraction_item_count: 0,
    })
    .eq('id', vaultId);

  console.log('✅ Vault data cleared');
}
