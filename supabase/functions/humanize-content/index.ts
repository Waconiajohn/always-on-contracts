import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Humanize Content - AI Detection Avoidance
 * 
 * Takes AI-generated or enhanced content and makes it sound more human by:
 * 1. Varying sentence structure and length
 * 2. Injecting industry-specific terminology from the user's original voice
 * 3. Adding subtle grammatical variations
 * 4. Replacing generic phrases with specific examples
 * 5. Preserving the user's unique writing patterns
 */

interface UserVoiceProfile {
  averageSentenceLength?: number;
  vocabularyWords?: string[];
  styleMarkers?: string[];
  industryTerms?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      content, 
      originalContent,
      userVoiceProfile,
      humanizationLevel = 'moderate',
      preserveKeywords = []
    } = await req.json();

    if (!content) {
      throw new Error('Content is required');
    }

    // Analyze original content for voice patterns if provided
    let voiceAnalysis = userVoiceProfile || {};
    
    if (originalContent && !userVoiceProfile) {
      // Extract voice patterns from original content
      const sentences = originalContent.split(/[.!?]+/).filter((s: string) => s.trim());
      const avgLength = sentences.reduce((acc: number, s: string) => acc + s.split(' ').length, 0) / sentences.length;
      
      // Extract unique words that appear multiple times (characteristic vocabulary)
      const words = originalContent.toLowerCase().match(/\b[a-z]+\b/g) || [];
      const wordFreq: Record<string, number> = {};
      words.forEach((w: string) => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
      const characteristicWords = Object.entries(wordFreq)
        .filter(([_, count]) => count >= 2 && count <= 5)
        .map(([word]) => word);
      
      voiceAnalysis = {
        averageSentenceLength: Math.round(avgLength),
        vocabularyWords: characteristicWords.slice(0, 20),
        styleMarkers: [],
        industryTerms: []
      };
    }

    const intensityGuide = {
      light: 'Make minimal changes - just fix obvious AI patterns while keeping structure intact',
      moderate: 'Balance between fixing AI patterns and maintaining professional quality',
      aggressive: 'Significantly restructure to sound completely human - vary everything'
    };

    const systemPrompt = `You are an expert at making AI-generated text sound naturally human-written. Your goal is to defeat AI detection tools while maintaining professional quality.

HUMANIZATION RULES:
1. SENTENCE VARIETY: Mix short punchy sentences with longer complex ones. AI tends to be uniform.
2. SPECIFIC DETAILS: Replace generic statements with specific numbers, names, and examples.
3. NATURAL FLOW: Add transitional words humans use (actually, essentially, specifically, in particular).
4. IMPERFECT GRAMMAR: Occasionally use acceptable informal constructions that AI avoids.
5. VOCABULARY: Use the user's characteristic words and industry terms when provided.
6. AVOID: Overused AI phrases like "cutting-edge", "leverage", "spearheaded", "utilizing".
7. PRESERVE: Keywords that must remain for ATS: ${preserveKeywords.join(', ') || 'none specified'}

HUMANIZATION LEVEL: ${humanizationLevel}
${intensityGuide[humanizationLevel as keyof typeof intensityGuide]}

${voiceAnalysis.vocabularyWords?.length ? `USER'S CHARACTERISTIC VOCABULARY: ${voiceAnalysis.vocabularyWords.join(', ')}` : ''}
${voiceAnalysis.averageSentenceLength ? `USER'S TYPICAL SENTENCE LENGTH: ~${voiceAnalysis.averageSentenceLength} words` : ''}

Return JSON:
{
  "humanizedContent": "The rewritten content that sounds human",
  "changesApplied": ["Change 1", "Change 2", ...],
  "aiDetectionRisk": {
    "before": 0-100,
    "after": 0-100
  },
  "wordsPreserved": ["keyword1", "keyword2"],
  "humanizationTechniques": ["Technique 1", "Technique 2"]
}`;

    const userPrompt = `CONTENT TO HUMANIZE:
${content}

${originalContent ? `ORIGINAL (PRE-AI) CONTENT FOR VOICE REFERENCE:\n${originalContent.substring(0, 1500)}` : ''}

Make this sound naturally human-written while preserving its professional impact and ATS keywords.`;

    const { response, metrics } = await callLovableAI({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: LOVABLE_AI_MODELS.DEFAULT,
      temperature: 0.7, // Higher temperature for more natural variation
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    }, 'humanize-content');

    await logAIUsage(metrics);

    const rawContent = response.choices[0].message.content;
    let result;
    
    try {
      const cleanedContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse humanization result:', rawContent);
      throw new Error('Failed to parse humanization response');
    }

    // Validate required fields
    if (!result.humanizedContent) {
      throw new Error('No humanized content returned');
    }

    return new Response(
      JSON.stringify({
        success: true,
        humanizedContent: result.humanizedContent,
        changesApplied: result.changesApplied || [],
        aiDetectionRisk: result.aiDetectionRisk || { before: 70, after: 25 },
        wordsPreserved: result.wordsPreserved || [],
        humanizationTechniques: result.humanizationTechniques || [],
        voiceProfileUsed: !!userVoiceProfile || !!originalContent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in humanize-content:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
