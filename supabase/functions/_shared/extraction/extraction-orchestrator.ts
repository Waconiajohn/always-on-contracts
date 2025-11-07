/**
 * Extraction Orchestrator
 * Coordinates all phases of the extraction pipeline
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { ExtractionObservability } from '../observability/extraction-observability.ts';
import { analyzePreExtraction, PreExtractionContext } from './pre-extraction-analyzer.ts';
import { extractWithRetry } from './retry-orchestrator.ts';
import { runValidation } from '../validation/validation-engine.ts';
import { buildFrameworkPromptContext } from '../frameworks/framework-service.ts';

export interface OrchestrationConfig {
  resumeText: string;
  vaultId: string;
  userId: string;
  targetRoles?: string[];
  targetIndustries?: string[];
  supabaseUrl: string;
  supabaseKey: string;
  extractionFunctions: {
    extractPowerPhrases: (prompt: string, options?: any) => Promise<any>;
    extractSkills: (prompt: string, options?: any) => Promise<any>;
    extractCompetencies: (prompt: string, options?: any) => Promise<any>;
    extractSoftSkills: (prompt: string, options?: any) => Promise<any>;
  };
}

export interface OrchestrationResult {
  success: boolean;
  sessionId: string;
  extracted: {
    powerPhrases: any[];
    skills: any[];
    competencies: any[];
    softSkills: any[];
  };
  validation: {
    overallConfidence: number;
    passed: boolean;
    criticalIssues: number;
  };
  metadata: {
    duration: number;
    totalCost: number;
    retryCount: number;
  };
  preExtractionContext: PreExtractionContext;
  error?: string;
}

/**
 * Main orchestration function
 */
export async function orchestrateExtraction(
  config: OrchestrationConfig
): Promise<OrchestrationResult> {
  const startTime = Date.now();

  // Initialize observability
  const observability = new ExtractionObservability(config.supabaseUrl, config.supabaseKey);
  const supabase = createClient(config.supabaseUrl, config.supabaseKey);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🚀 EXTRACTION ORCHESTRATOR V3');
  console.log('═══════════════════════════════════════════════════════════\n');

  let sessionId: string | null = null;

  try {
    // ========================================================================
    // PHASE 0: START SESSION & PRE-EXTRACTION ANALYSIS
    // ========================================================================
    console.log('📍 PHASE 0: Pre-Extraction Analysis');
    console.log('────────────────────────────────────────────────────────────\n');

    const session = await observability.startSession({
      vaultId: config.vaultId,
      userId: config.userId,
      extractionVersion: 'v3',
      metadata: {
        resumeLength: config.resumeText.length,
        targetRoles: config.targetRoles,
        targetIndustries: config.targetIndustries,
      },
    });
    sessionId = session.id;

    await observability.logEvent(sessionId, 'phase_started', { phase: 'pre_extraction' });

    // Analyze resume and build context
    const preExtractionContext = await analyzePreExtraction(
      config.resumeText,
      config.targetRoles,
      config.targetIndustries
    );

    await observability.logEvent(sessionId, 'pre_extraction_complete', {
      roleDetected: preExtractionContext.roleInfo?.primaryRole,
      industry: preExtractionContext.roleInfo?.industry,
      frameworkMatch: preExtractionContext.frameworkContext?.matchQuality,
      sections: preExtractionContext.resumeStructure.sections.length,
      wordCount: preExtractionContext.resumeStructure.totalWordCount,
    });

    await observability.saveCheckpoint(sessionId, 'pre_extraction', {
      context: preExtractionContext,
    });

    // ========================================================================
    // PHASE 1: GUIDED MULTI-PASS EXTRACTION
    // ========================================================================
    console.log('\n📍 PHASE 1: Guided Multi-Pass Extraction');
    console.log('────────────────────────────────────────────────────────────\n');

    await observability.logEvent(sessionId, 'phase_started', { phase: 'extraction' });

    const extractedData = {
      powerPhrases: [],
      skills: [],
      competencies: [],
      softSkills: [],
    };

    let totalRetries = 0;
    let totalCost = 0;

    // Extract each pass with framework context
    for (const passType of preExtractionContext.extractionStrategy.passOrder) {
      console.log(`\n🔄 PASS: ${passType.toUpperCase()}`);
      console.log('────────────────────────────────────────────────────────────');

      await observability.logEvent(sessionId, 'pass_started', { passType });

      // Build framework-aware prompt
      let frameworkContext = '';
      if (
        preExtractionContext.frameworkContext?.framework !== null &&
        preExtractionContext.frameworkContext?.framework !== undefined &&
        preExtractionContext.extractionStrategy.shouldUseFramework
      ) {
        frameworkContext = buildFrameworkPromptContext(
          preExtractionContext.frameworkContext.framework,
          passType as any
        );
      }

      // Get extraction function
      const extractFn = getExtractionFunction(config.extractionFunctions, passType);
      if (!extractFn) {
        console.error(`No extraction function for ${passType}`);
        continue;
      }

      // Create prompt with framework context
      const basePrompt = buildBasePrompt(passType, config.resumeText);
      const fullPrompt = frameworkContext + '\n\n' + basePrompt;

      // Extract with retry
      const passStartTime = Date.now();
      const result = await extractWithRetry({
        context: {
          resumeText: config.resumeText,
          framework: preExtractionContext.frameworkContext?.framework,
          roleInfo: preExtractionContext.roleInfo,
          originalPrompt: fullPrompt,
        } as any,
        maxAttempts: 3,
        minConfidence: 70,
        extractFn: (prompt: string, options?: any) => extractFn(prompt, options),
      });

      const passLatency = Date.now() - passStartTime;

      // Store extracted data
      const passData = result.data[passType as keyof typeof result.data] ||
                       result.data.powerPhrases ||
                       result.data;

      extractedData[passType as keyof typeof extractedData] = Array.isArray(passData) ? passData : [];

      // Track metrics
      totalRetries += result.metadata.attempts - 1;
      totalCost += result.metadata.totalCost;

      // Log to observability
      await observability.captureAIResponse(sessionId, passType, {
        raw: JSON.stringify(result.data),
        parsedData: passData,
        usage: { prompt: 1000, completion: 500, total: 1500 }, // Placeholder
      }, {
        promptVersion: 'v3.0',
        model: preExtractionContext.extractionStrategy.recommendedModel,
        latency: passLatency,
      });

      await observability.logValidation(sessionId, passType, {
        passed: result.validation.passed,
        confidence: result.validation.confidence,
        issues: result.validation.issues,
        recommendations: result.validation.recommendations,
      });

      await observability.logEvent(sessionId, 'pass_completed', {
        passType,
        itemsExtracted: extractedData[passType as keyof typeof extractedData].length,
        confidence: result.validation.confidence,
        retries: result.metadata.attempts - 1,
        latencyMs: passLatency,
      });

      await observability.saveCheckpoint(sessionId, `pass_${passType}`, {
        extracted: extractedData,
      });

      console.log(`✅ ${passType}: ${extractedData[passType as keyof typeof extractedData].length} items extracted (${result.validation.confidence}% confidence)`);
    }

    // ========================================================================
    // PHASE 2: CROSS-VALIDATION
    // ========================================================================
    console.log('\n📍 PHASE 2: Cross-Validation');
    console.log('────────────────────────────────────────────────────────────\n');

    await observability.logEvent(sessionId, 'phase_started', { phase: 'validation' });

    const overallValidation = await runValidation(extractedData, {
      resumeText: config.resumeText,
      framework: preExtractionContext.frameworkContext?.framework,
      roleInfo: preExtractionContext.roleInfo,
    } as any);

    await observability.logValidation(sessionId, 'overall', {
      passed: overallValidation.passed,
      confidence: overallValidation.confidence,
      issues: overallValidation.issues,
      recommendations: overallValidation.recommendations,
    });

    console.log(`${overallValidation.passed ? '✅' : '⚠️'} Overall validation: ${overallValidation.confidence}% confidence`);
    if (overallValidation.issues.length > 0) {
      console.log(`   Issues: ${overallValidation.issues.length} (${overallValidation.issues.filter(i => i.severity === 'critical').length} critical)`);
    }

    // ========================================================================
    // PHASE 3: STORE RESULTS
    // ========================================================================
    console.log('\n📍 PHASE 3: Storing Results');
    console.log('────────────────────────────────────────────────────────────\n');

    await observability.logEvent(sessionId, 'phase_started', { phase: 'storage' });

    // Store in database (actual storage will be done by calling function)
    // For now, just prepare the data with metadata

    const totalItems =
      extractedData.powerPhrases.length +
      extractedData.skills.length +
      extractedData.competencies.length +
      extractedData.softSkills.length;

    console.log(`📦 Prepared ${totalItems} items for storage`);

    // ========================================================================
    // PHASE 4: FINALIZE SESSION
    // ========================================================================
    const duration = Date.now() - startTime;

    await observability.endSession(sessionId, 'completed', {
      itemCounts: {
        powerPhrases: extractedData.powerPhrases.length,
        skills: extractedData.skills.length,
        competencies: extractedData.competencies.length,
        softSkills: extractedData.softSkills.length,
        total: totalItems,
      },
      overallConfidence: overallValidation.confidence,
      validationPassed: overallValidation.passed,
      duration,
      totalCost,
      retryCount: totalRetries,
    });

    // Update vault with extraction version
    await supabase
      .from('career_vault')
      .update({
        extraction_version: 'v3',
        last_extraction_session_id: sessionId,
      })
      .eq('id', config.vaultId);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ EXTRACTION COMPLETE');
    console.log(`   Duration: ${(duration / 1000).toFixed(1)}s | Cost: $${totalCost.toFixed(2)} | Confidence: ${overallValidation.confidence}%`);
    console.log('═══════════════════════════════════════════════════════════\n');

    return {
      success: true,
      sessionId,
      extracted: extractedData,
      validation: {
        overallConfidence: overallValidation.confidence,
        passed: overallValidation.passed,
        criticalIssues: overallValidation.issues.filter(i => i.severity === 'critical').length,
      },
      metadata: {
        duration,
        totalCost,
        retryCount: totalRetries,
      },
      preExtractionContext,
    };

  } catch (error) {
    console.error('\n❌ EXTRACTION FAILED:', error);

    if (sessionId) {
      await observability.logEvent(sessionId, 'extraction_failed', {
        error: error.message,
        stack: error.stack,
      });

      await observability.endSession(sessionId, 'failed', {
        error: error.message,
      });
    }

    throw error;
  }
}

/**
 * Get extraction function for pass type
 */
function getExtractionFunction(
  functions: OrchestrationConfig['extractionFunctions'],
  passType: string
): ((prompt: string, options?: any) => Promise<any>) | null {
  switch (passType) {
    case 'power_phrases':
      return functions.extractPowerPhrases;
    case 'skills':
      return functions.extractSkills;
    case 'competencies':
      return functions.extractCompetencies;
    case 'soft_skills':
      return functions.extractSoftSkills;
    default:
      return null;
  }
}

/**
 * Build base prompt for extraction pass
 */
function buildBasePrompt(passType: string, resumeText: string): string {
  switch (passType) {
    case 'power_phrases':
      return `Extract quantified achievements and management scope from this resume.

CRITICAL: Return ONLY a valid JSON array with NO markdown, NO explanations, NO code blocks.

Required structure for each power phrase:
{
  "phrase": "Full achievement statement with quantified metrics",
  "category": "Leadership|Management|Technical|Business|Process",
  "impact_metrics": {
    "metric_name": "value with units",
    "metric_name2": "value2"
  },
  "keywords": ["keyword1", "keyword2"],
  "confidence_score": 0.8
}

Example output:
[
  {
    "phrase": "Directed drilling engineering team managing $350M annual budget and overseeing operations of 3-4 rigs",
    "category": "Leadership",
    "impact_metrics": {
      "budget": "$350M",
      "team_scope": "3-4 rigs"
    },
    "keywords": ["directed", "managing", "overseeing", "leadership"],
    "confidence_score": 0.9
  }
]

Resume:
${resumeText}`;

    case 'skills':
      return `Extract technical and transferable skills from this resume.

CRITICAL: Return ONLY a valid JSON array with NO markdown, NO explanations, NO code blocks.

Required structure:
{
  "stated_skill": "Skill name as stated in resume",
  "skill_category": "Technical|Functional|Industry|Tool",
  "cross_functional_equivalent": "How this skill applies across industries",
  "confidence_score": 0.8
}

Resume:
${resumeText}`;

    case 'competencies':
      return `Extract hidden competencies and capabilities from this resume.

CRITICAL: Return ONLY a valid JSON array with NO markdown, NO explanations, NO code blocks.

Required structure:
{
  "competency_area": "Category of competency",
  "inferred_capability": "What capability this demonstrates",
  "evidence_source": "Where in resume this is shown",
  "confidence_score": 0.75
}

Resume:
${resumeText}`;

    case 'soft_skills':
      return `Extract soft skills with behavioral evidence from this resume.

CRITICAL: Return ONLY a valid JSON array with NO markdown, NO explanations, NO code blocks.

Required structure:
{
  "soft_skill": "Name of the soft skill",
  "behavioral_evidence": "Specific example from resume demonstrating this",
  "confidence_score": 0.75
}

Resume:
${resumeText}`;

    default:
      return resumeText;
  }
}
