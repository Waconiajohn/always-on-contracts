import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { getDocumentProxy } from "https://esm.sh/unpdf@0.11.0";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { callPerplexity, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

// Phase 1.3: Security Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block"
};

// Phase 1.3: Robust Text Cleanup
function robustTextCleanup(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/â€™/g, "'")
    .replace(/â€"/g, "—")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Phase 2.3: Generate Content Hash
async function generateContentHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Phase 2.2: Circuit Breaker
class AICircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private threshold: number = 3;
  private timeout: number = 60000; // 1 minute

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.failures >= this.threshold && Date.now() - this.lastFailureTime < this.timeout) {
      throw new Error('AI service temporarily unavailable. Please try again in a few moments.');
    }
    
    try {
      const result = await fn();
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      throw error;
    }
  }
}

const circuitBreaker = new AICircuitBreaker();

// Phase 3.1: Expanded Error Messages
const ERROR_MESSAGES: Record<string, string> = {
  'scanned_pdf': 'Unable to process this PDF file',
  'insufficient_content': 'Resume appears incomplete or too short',
  'parsing_failed': 'Unable to read document content',
  'not_a_resume': 'This document does not appear to be a resume',
  'ai_analysis_failed': 'AI analysis encountered an error - please try again',
  'rate_limit_exceeded': 'Upload limit reached - please try again shortly',
  // DOCX-specific errors
  'docx_corrupted': 'This Word document appears to be corrupted',
  'docx_password_protected': 'Password-protected documents are not supported',
  'docx_empty': 'This document appears to be empty',
  'docx_invalid_structure': 'Invalid Word document structure',
  // Validation errors
  'file_too_large': 'File size exceeds 10MB limit',
  'unsupported_format': 'Unsupported file format',
  'authentication_failed': 'Authentication required to upload resumes'
};

// Phase 3.3: Check Rate Limit
async function checkRateLimit(supabase: any, userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - 1);
  
  const { data: limits, error } = await supabase
    .from('rate_limits')
    .select('request_count')
    .eq('user_id', userId)
    .eq('endpoint', 'process-resume')
    .gte('window_start', windowStart.toISOString());

  if (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true, remaining: 100 }; // Fail open
  }

  const totalRequests = limits?.reduce((sum: number, l: any) => sum + l.request_count, 0) || 0;
  const maxRequests = 100; // TODO: Make this tier-based
  
  return {
    allowed: totalRequests < maxRequests,
    remaining: Math.max(0, maxRequests - totalRequests)
  };
}

// Phase 3.3: Record Rate Limit
async function recordRateLimit(supabase: any, userId: string) {
  const windowStart = new Date();
  windowStart.setMinutes(0, 0, 0);
  const windowEnd = new Date(windowStart);
  windowEnd.setHours(windowEnd.getHours() + 1);

  await supabase
    .from('rate_limits')
    .upsert({
      user_id: userId,
      endpoint: 'process-resume',
      window_start: windowStart.toISOString(),
      window_end: windowEnd.toISOString(),
      request_count: 1
    }, {
      onConflict: 'user_id,endpoint,window_start',
      ignoreDuplicates: false
    });
}

// Phase 4.1: Enhanced DOCX Text Extraction with Structure Preservation
function extractTextFromWordXml(xml: string, preserveStructure: boolean = true): string {
  const paragraphs: string[] = [];

  // Extract paragraphs to preserve document structure
  const paragraphPattern = /<w:p[^>]*>(.*?)<\/w:p>/gs;
  let paragraphMatch;

  while ((paragraphMatch = paragraphPattern.exec(xml)) !== null) {
    const paragraphXml = paragraphMatch[1];
    const textPattern = /<w:t(?:\s+[^>]*)?>(.*?)<\/w:t>/gs;
    let textMatch;
    const paragraphText: string[] = [];

    while ((textMatch = textPattern.exec(paragraphXml)) !== null) {
      const text = textMatch[1];
      if (text) {
        // Decode XML entities
        const decodedText = text
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'");
        paragraphText.push(decodedText);
      }
    }

    if (paragraphText.length > 0) {
      paragraphs.push(paragraphText.join(' ').trim());
    }
  }

  // Join paragraphs with double newline to preserve structure
  if (preserveStructure) {
    return paragraphs.join('\n\n').trim();
  } else {
    return paragraphs.join(' ').trim();
  }
}

// Phase 4.2: Section Header Detection
function detectSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const sectionHeaders = [
    { name: 'summary', patterns: [/professional summary|executive summary|profile|summary/i] },
    { name: 'experience', patterns: [/work experience|professional experience|employment history|experience/i] },
    { name: 'education', patterns: [/education|academic background|qualifications/i] },
    { name: 'skills', patterns: [/skills|technical skills|core competencies/i] },
    { name: 'achievements', patterns: [/achievements|accomplishments|awards/i] }
  ];

  const lines = text.split('\n');
  let currentSection = 'other';
  let currentText: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check if line is a section header
    let foundSection = false;
    for (const section of sectionHeaders) {
      if (section.patterns.some(pattern => pattern.test(trimmed))) {
        // Save previous section
        if (currentText.length > 0) {
          sections[currentSection] = currentText.join('\n').trim();
        }
        currentSection = section.name;
        currentText = [];
        foundSection = true;
        break;
      }
    }

    if (!foundSection && trimmed) {
      currentText.push(trimmed);
    }
  }

  // Save last section
  if (currentText.length > 0) {
    sections[currentSection] = currentText.join('\n').trim();
  }

  return sections;
}

// Phase 1.2: File Validation
function validateFile(file: any, fileSize: number): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
  ];

  // Check file size
  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: ERROR_MESSAGES['file_too_large']
    };
  }

  // Check MIME type if available
  const fileType = file.type || file.mime_type || '';
  if (fileType && !ALLOWED_MIME_TYPES.includes(fileType)) {
    return {
      valid: false,
      error: ERROR_MESSAGES['unsupported_format']
    };
  }

  // Check file extension matches MIME type
  const fileName = (file.name || '').toLowerCase();
  if (fileName) {
    if (fileType.includes('pdf') && !fileName.endsWith('.pdf')) {
      return { valid: false, error: 'File extension does not match content type' };
    }
    if (fileType.includes('word') && !fileName.endsWith('.docx') && !fileName.endsWith('.doc')) {
      return { valid: false, error: 'File extension does not match content type' };
    }
  }

  return { valid: true };
}

// Phase 2.3: Processing Metrics
interface ProcessingMetrics {
  startTime: number;
  parseTime?: number;
  validationTime?: number;
  analysisTime?: number;
  cacheTime?: number;
}

function createMetrics(): ProcessingMetrics {
  return { startTime: Date.now() };
}

function logMetrics(metrics: ProcessingMetrics, stage: string) {
  const elapsed = Date.now() - metrics.startTime;
  console.log(`[METRICS] ${stage}: ${elapsed}ms`);
}

// Phase 1.1: Document Parser with pdf-parse and smart fallback
async function parseFile(base64Data: string, fileType: string): Promise<string> {
  console.log(`[parseFile] Starting to parse file of type: ${fileType}`);
  
  try {
    // For plain text files, decode directly (no AI needed - faster and free)
    if (fileType === 'text/plain' || fileType.includes('txt')) {
      console.log('[parseFile] Plain text file detected, decoding directly');
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    }

    // For PDF files - use unpdf library with smart fallback to AI vision for scanned PDFs
    if (fileType.includes('pdf')) {
      console.log('[parseFile] PDF detected, attempting direct text extraction');
      
      try {
        // Convert base64 to Uint8Array
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Parse PDF with unpdf
        const pdf = await getDocumentProxy(bytes);
        const numPages = pdf.numPages;
        
        console.log(`[parseFile] PDF has ${numPages} pages, extracting text...`);
        
        // Extract text from all pages
        let fullText = '';
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str || '')
            .join(' ');
          fullText += pageText + '\n';
        }
        
        const extractedText = fullText.trim();
        
        // Smart fallback: if we extracted very little text, it's likely a scanned PDF
        if (extractedText.length < 100) {
          console.log('[parseFile] Extracted minimal text from PDF, likely scanned');
          throw new Error('This appears to be a scanned PDF. Please convert it to a text-based PDF or use a Word document instead.');
        }
        
        console.log(`[parseFile] Successfully extracted ${extractedText.length} characters from PDF using unpdf`);
        return extractedText;
        
      } catch (pdfError: any) {
        console.error('[parseFile] unpdf failed:', pdfError);
        throw new Error('Unable to extract text from PDF. Please ensure it is a text-based PDF (not scanned) or convert to Word document.');
      }
    }

    // For DOCX files - parse XML structure with comprehensive extraction
    if (fileType.includes('word') || fileType.includes('docx') || fileType.includes('doc')) {
      console.log('[parseFile] Word document detected, parsing XML structure');

      try {
        // Convert base64 to buffer
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const zip = await JSZip.loadAsync(bytes);
        const allText: string[] = [];

        // Extract from main document
        const documentXml = await zip.file('word/document.xml')?.async('string');
        if (!documentXml) {
          throw new Error('Invalid DOCX file: missing document.xml');
        }

        // Extract text from main document
        const mainText = extractTextFromWordXml(documentXml);
        if (mainText) allText.push(mainText);

        // Extract from headers
        const headerFiles = Object.keys(zip.files).filter(name =>
          name.startsWith('word/header') && name.endsWith('.xml')
        );
        for (const headerFile of headerFiles) {
          const headerXml = await zip.file(headerFile)?.async('string');
          if (headerXml) {
            const headerText = extractTextFromWordXml(headerXml);
            if (headerText) allText.push(headerText);
          }
        }

        // Extract from footers
        const footerFiles = Object.keys(zip.files).filter(name =>
          name.startsWith('word/footer') && name.endsWith('.xml')
        );
        for (const footerFile of footerFiles) {
          const footerXml = await zip.file(footerFile)?.async('string');
          if (footerXml) {
            const footerText = extractTextFromWordXml(footerXml);
            if (footerText) allText.push(footerText);
          }
        }

        const extractedText = allText.join('\n\n').trim();

        if (!extractedText || extractedText.length < 20) {
          throw new Error('Document appears to be empty or contains no extractable text');
        }

        console.log(`[parseFile] Successfully extracted ${extractedText.length} characters from DOCX`);
        return extractedText;

      } catch (docxError: any) {
        console.error('[parseFile] DOCX parsing failed:', docxError);
        // Phase 3.2: Map DOCX errors to user-friendly messages
        let errorType = 'docx_invalid_structure';
        if (docxError.message.includes('password')) {
          errorType = 'docx_password_protected';
        } else if (docxError.message.includes('corrupted') || docxError.message.includes('invalid')) {
          errorType = 'docx_corrupted';
        } else if (docxError.message.includes('empty')) {
          errorType = 'docx_empty';
        }
        throw new Error(ERROR_MESSAGES[errorType]);
      }
    }

    // Unsupported file type
    throw new Error(`Unsupported file type: ${fileType}. Please upload PDF, Word (.docx), or text files.`);
    
  } catch (error: any) {
    console.error('[parseFile] Error during file parsing:', error);
    throw error;
  }
}

// Phase 1.2: Detect binary data in text field (for backward compatibility)
function detectBinaryData(text: string): { isBinary: boolean; type?: string } {
  if (text.startsWith('%PDF-')) {
    return { isBinary: true, type: 'pdf' };
  }
  if (text.startsWith('PK\x03\x04') || text.includes('word/')) {
    return { isBinary: true, type: 'docx' };
  }
  // Check for high percentage of non-printable characters
  const nonPrintable = text.split('').filter(c => {
    const code = c.charCodeAt(0);
    return code < 32 && code !== 9 && code !== 10 && code !== 13;
  }).length;
  
  if (nonPrintable > text.length * 0.1) {
    return { isBinary: true, type: 'unknown' };
  }
  
  return { isBinary: false };
}

// Phase 1.3: AI-Powered Resume Validation
async function validateIsResume(text: string, userId?: string): Promise<{
  isResume: boolean;
  confidence: number;
  reason: string;
}> {
  try {
    const { response: data, metrics } = await circuitBreaker.call(() => 
      callPerplexity({
        messages: [
          {
            role: "system",
            content: "You are a resume classifier. Respond with structured JSON only."
          },
          {
            role: "user",
            content: `Analyze if this is a professional resume/CV. Look for: contact info, work history, education, skills.

TEXT (first 5000 chars):
${text.substring(0, 5000)}

Respond with confidence 0.0-1.0 and brief reason.`
          }
        ],
        model: PERPLEXITY_MODELS.SMALL,
        max_tokens: 1024,
      }, 'validate-resume', userId)
    );

    await logAIUsage(metrics);
    
    // Parse structured output from tool call
    const content = data.choices?.[0]?.message?.content;
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      // If not JSON, try to extract from text
      const isResumeMatch = /isResume["\s:]+(?:true|false)/i.exec(content);
      const confidenceMatch = /confidence["\s:]+([0-9.]+)/i.exec(content);
      result = {
        isResume: isResumeMatch ? isResumeMatch[0].includes('true') : false,
        confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5,
        reason: 'Parsed from text response'
      };
    }
    return result;
  } catch (error) {
    // Fallback to keyword-based validation
    const resumeIndicators = [
      /experience|employment|work history|professional background|career/i,
      /education|degree|university|college|academic/i,
      /skills|proficiencies|expertise|competencies/i,
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}/i,
      /\b(manager|engineer|developer|analyst|specialist|coordinator|director|consultant)/i
    ];
    
    const matches = resumeIndicators.filter(r => r.test(text)).length;
    return {
      isResume: matches >= 2,
      confidence: matches / resumeIndicators.length,
      reason: matches >= 2 ? 'Contains resume indicators' : 'Missing key resume sections'
    };
  }
}

// Phase 5.3: Smart Default Handling
function estimateYearsFromText(text: string): number {
  const datePattern = /\b(19|20)\d{2}\b/g;
  const years = text.match(datePattern)?.map(y => parseInt(y)).sort() || [];
  if (years.length >= 2) {
    return new Date().getFullYear() - Math.min(...years);
  }
  return 0;
}

function estimateHourlyRate(text: string, years: number): { min: number; max: number } {
  // Base rate estimation from experience
  const baseRate = 50 + (years * 5);
  const min = Math.max(50, baseRate - 20);
  const max = Math.min(250, baseRate + 30);
  
  // Adjust for seniority indicators
  if (/(senior|lead|principal|architect|director)/i.test(text)) {
    return { min: Math.max(100, min + 25), max: max + 50 };
  }
  if (/(manager|head of|vp|chief)/i.test(text)) {
    return { min: Math.max(125, min + 50), max: max + 75 };
  }
  
  return { min, max };
}

// Phase 5.1: Multi-Pass Analysis with Confidence Scoring
async function multiPassAnalysis(
  text: string,
  userId: string,
  maxRetries = 2
): Promise<any> {
  let lastError: Error | null = null;
  
  // First pass: Basic extraction (fast)
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { response: data, metrics } = await circuitBreaker.call(() =>
        callPerplexity({
          messages: [
            {
              role: "system",
              content: "You are an expert resume analyzer. Always respond with valid JSON and provide confidence scores."
            },
            {
              role: "user",
              content: `Analyze this resume comprehensively. Extract all data with confidence scores.

CRITICAL INSTRUCTIONS:
1. Extract the candidate's CURRENT OR MOST RECENT job title as "current_role"
2. Identify the PRIMARY INDUSTRY from their work history as "primary_industry"
3. Extract EXACT employment dates in YYYY-MM format
4. Calculate total years_experience by summing all employment periods
5. Quantify ALL achievements with numbers, percentages, or metrics
6. Identify contract/freelance indicators
7. For each field, provide confidence: "high" (>80%), "medium" (50-80%), "low" (<50%)

RESUME TEXT:
${text}

Focus on: current_role (REQUIRED), primary_industry (REQUIRED), years_experience, key_achievements (quantified), industry_expertise, management_capabilities, skills, target_hourly_rate_min, target_hourly_rate_max, recommended_positions, analysis_summary.

Provide confidence_scores object with confidence level for each major field.

Return ONLY valid JSON in this exact structure:
{
  "current_role": "string",
  "primary_industry": "string",
  "years_experience": number,
  "key_achievements": ["string"],
  "industry_expertise": ["string"],
  "management_capabilities": ["string"],
  "skills": ["string"],
  "target_hourly_rate_min": number,
  "target_hourly_rate_max": number,
  "recommended_positions": ["string"],
  "analysis_summary": "string",
  "confidence_scores": {
    "current_role": "high|medium|low",
    "primary_industry": "high|medium|low",
    "years_experience": "high|medium|low",
    "skills": "high|medium|low",
    "achievements": "high|medium|low",
    "rates": "high|medium|low",
    "overall": "high|medium|low"
  },
  "data_quality_issues": ["string"]
}`
            }
          ],
          model: PERPLEXITY_MODELS.DEFAULT,
          max_tokens: 4096,
          temperature: 0.2,
        }, 'multipass-analysis', userId)
      );

      await logAIUsage(metrics);

      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error("No analysis returned from AI");
      }

      // Log what we received from AI for debugging
      console.log('[multiPassAnalysis] Response received, length:', content.length);

      let analysis;
      
      try {
        // Try to parse as-is
        analysis = JSON.parse(content);
        console.log('[multiPassAnalysis] Successfully parsed JSON on first attempt');
      } catch (parseError: any) {
        console.error('[multiPassAnalysis] Initial parse failed:', parseError.message);
        
        // Aggressive cleanup for malformed JSON
        try {
          let cleaned = content;
          
          // Remove markdown code blocks if present
          cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          
          // Remove any leading garbage (anything before first {)
          const firstBrace = cleaned.indexOf('{');
          if (firstBrace > 0) {
            console.log(`[multiPassAnalysis] Removing ${firstBrace} leading chars`);
            cleaned = cleaned.substring(firstBrace);
          }
          
          // Remove any trailing garbage (anything after last })
          const lastBrace = cleaned.lastIndexOf('}');
          if (lastBrace !== -1 && lastBrace < cleaned.length - 1) {
            console.log(`[multiPassAnalysis] Removing ${cleaned.length - lastBrace - 1} trailing chars`);
            cleaned = cleaned.substring(0, lastBrace + 1);
          }
          
          // Fix common JSON issues
          cleaned = cleaned
            .replace(/,(\s*[}\]])/g, '$1')    // Remove trailing commas
            .replace(/\n/g, ' ')               // Remove newlines
            .replace(/\r/g, '')                // Remove carriage returns
            .replace(/\t/g, ' ')               // Replace tabs with spaces
            .replace(/\s+/g, ' ')              // Collapse multiple spaces
            .trim();
          
          analysis = JSON.parse(cleaned);
          console.log('[multiPassAnalysis] Successfully parsed after cleanup');
        } catch (cleanError: any) {
          console.error('[multiPassAnalysis] Cleanup also failed:', cleanError.message);
          
          // If not last attempt, retry
          if (attempt < maxRetries) {
            const delay = attempt * 2000;
            console.log(`[multiPassAnalysis] Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            throw new Error(`Retrying after JSON parse failure (attempt ${attempt}/${maxRetries})`);
          }
          
          // Last attempt failed
          throw new Error('Unable to process resume format. Please try converting to PDF or pasting text directly.');
        }
      }
      
      // Phase 5.3: Apply smart defaults for missing data
      const yearsEstimate = estimateYearsFromText(text);
      const rateEstimate = estimateHourlyRate(text, analysis.years_experience || yearsEstimate);
      
      return {
        ...analysis,
        years_experience: analysis.years_experience || yearsEstimate,
        target_hourly_rate_min: analysis.target_hourly_rate_min || rateEstimate.min,
        target_hourly_rate_max: analysis.target_hourly_rate_max || rateEstimate.max,
        skills: analysis.skills?.length > 0 ? analysis.skills : extractBasicSkills(text),
        confidence_scores: analysis.confidence_scores || {
          overall: 'medium'
        }
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`[multiPassAnalysis] Attempt ${attempt + 1}/${maxRetries + 1} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`[multiPassAnalysis] Waiting ${waitTime}ms before retry ${attempt + 2}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error('Analysis failed after retries');
}

// Phase 5.3: Basic skills extraction fallback
function extractBasicSkills(text: string): string[] {
  const commonSkills = [
    'Leadership', 'Project Management', 'Team Management', 'Strategic Planning',
    'Communication', 'Problem Solving', 'Analysis', 'Planning', 'Budgeting',
    'Microsoft Office', 'Excel', 'PowerPoint', 'Data Analysis'
  ];
  
  return commonSkills.filter(skill => 
    new RegExp(skill, 'i').test(text)
  ).slice(0, 10);
}

// Phase 4: Regex-based fallback for role and industry extraction
function extractRoleAndIndustryFallback(text: string): { role: string | null; industry: string | null } {
  // Common job titles to search for
  const jobTitlePatterns = [
    /\b(Senior|Lead|Principal|Staff|Chief)\s+([\w\s]+?)\s+Engineer\b/i,
    /\b(VP|Vice President|Director|Manager|Head)\s+of\s+([\w\s]+)\b/i,
    /\b(Senior|Lead|Principal)\s+([\w\s]+?)\s+(Manager|Developer|Designer|Analyst|Architect)\b/i,
    /\b([\w\s]+?)\s+(Engineer|Manager|Director|Developer|Designer|Analyst|Architect|Specialist)\b/i,
    /\b(CTO|CEO|COO|CMO|CFO|CIO)\b/i
  ];

  // Common industries to search for
  const industryKeywords: Record<string, RegExp[]> = {
    "Oil & Gas": [/\b(oil|gas|petroleum|drilling|exploration|energy|upstream|downstream|oilfield)\b/i, /\b(halliburton|schlumberger|baker hughes|weatherford|chevron|exxon|shell|bp)\b/i],
    "Technology": [/\b(software|technology|tech|saas|cloud|platform|digital)\b/i, /\b(google|microsoft|amazon|facebook|apple|meta|netflix)\b/i],
    "FinTech": [/\b(fintech|payments|banking|financial services|crypto|blockchain|trading)\b/i, /\b(stripe|paypal|square|coinbase|robinhood)\b/i],
    "Healthcare": [/\b(healthcare|medical|hospital|pharma|biotech|clinical|patient)\b/i, /\b(kaiser|mayo|pfizer|moderna|medtronic)\b/i],
    "E-commerce": [/\b(e-commerce|ecommerce|retail|marketplace|shopping)\b/i, /\b(amazon|shopify|ebay|etsy|walmart)\b/i],
    "Manufacturing": [/\b(manufacturing|production|industrial|factory|automotive)\b/i, /\b(tesla|ford|gm|boeing|caterpillar)\b/i],
    "Consulting": [/\b(consulting|advisory|strategy|professional services)\b/i, /\b(mckinsey|bain|bcg|deloitte|accenture|pwc)\b/i],
    "Finance": [/\b(finance|investment|banking|asset management|private equity|venture capital)\b/i, /\b(goldman|morgan|jpmorgan|blackrock|vanguard)\b/i]
  };

  let detectedRole: string | null = null;
  let detectedIndustry: string | null = null;

  // Try to find job title
  for (const pattern of jobTitlePatterns) {
    const match = text.match(pattern);
    if (match) {
      detectedRole = match[0].trim();
      break;
    }
  }

  // Try to find industry (count matches for each industry)
  const industryScores: Record<string, number> = {};
  for (const [industry, patterns] of Object.entries(industryKeywords)) {
    let score = 0;
    for (const pattern of patterns) {
      const matches = text.match(new RegExp(pattern, 'gi'));
      if (matches) {
        score += matches.length;
      }
    }
    if (score > 0) {
      industryScores[industry] = score;
    }
  }

  // Pick the industry with the highest score
  if (Object.keys(industryScores).length > 0) {
    detectedIndustry = Object.entries(industryScores)
      .sort(([, a], [, b]) => b - a)[0][0];
  }

  return { role: detectedRole, industry: detectedIndustry };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let queueId: string | null = null;
  let userId: string | null = null;

  try {
    console.log('[PROCESS-RESUME] Starting - content-type:', req.headers.get('content-type'));
    
    // Phase 3.3: Enhanced Structured Logging
    console.log('[PROCESS-RESUME] === REQUEST START ===');
    console.log('[PROCESS-RESUME] User-Agent:', req.headers.get('user-agent'));
    
    // Phase 2.3: Initialize metrics
    const metrics = createMetrics();
    
    const contentType = req.headers.get('content-type') || '';
    console.log('[PROCESS-RESUME] Content-Type:', contentType);
    
    let fileText: string | undefined = undefined;
    let fileData: string | undefined = undefined;
    let fileName: string = '';
    let fileSize: number = 0;
    let fileType: string = '';
    let reqUserId: string = '';

    // Handle FormData (from file upload)
    if (contentType.includes('multipart/form-data')) {
      console.log('[PROCESS-RESUME] Parsing FormData');
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        throw new Error('No file found in FormData');
      }
      
      fileName = file.name;
      fileSize = file.size;
      fileType = file.type || 'application/octet-stream';
      
      // Phase 1.2: Validate file before processing
      const validation = validateFile(file, fileSize);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      // Phase 2.1: Convert to base64 in chunks to avoid stack overflow
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const CHUNK_SIZE = 8192;
      let binary = '';
      for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
        const chunk = uint8Array.subarray(i, Math.min(i + CHUNK_SIZE, uint8Array.length));
        binary += String.fromCharCode(...chunk);
      }
      fileData = btoa(binary);
      console.log('[PROCESS-RESUME] Converted file to base64:', fileData.length, 'chars');
      
      // Phase 1.1: Replace manual JWT parsing with Supabase auth
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        throw new Error(ERROR_MESSAGES['authentication_failed']);
      }
      
      // Create a Supabase client with the user's auth header
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        {
          global: { headers: { Authorization: authHeader } }
        }
      );

      // Validate and extract user
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !user) {
        throw new Error(ERROR_MESSAGES['authentication_failed']);
      }
      reqUserId = user.id;
      console.log('[PROCESS-RESUME] User authenticated:', user.id);
      
      console.log('[PROCESS-RESUME] FormData parsed - file:', fileName, 'size:', fileSize, 'type:', fileType);
    } else {
      // Handle JSON (backward compatibility)
      console.log('[PROCESS-RESUME] Parsing JSON');
      const body = await req.json();
      ({ fileText, fileData, fileName, fileSize, fileType, userId: reqUserId } = body);
      console.log('[PROCESS-RESUME] JSON parsed - file:', fileName);
    }
    
    userId = reqUserId;
    logMetrics(metrics, 'Request parsing');

    if (!fileName || !userId) {
      throw new Error("Missing required fields: fileName and userId are required");
    }

    if (!fileText && !fileData) {
      throw new Error("Missing required fields: either fileText or fileData must be provided");
    }

    let extractedText = '';

    // Phase 3.3: Check rate limit
    const rateLimit = await checkRateLimit(supabase, userId);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({
        success: false,
        error: ERROR_MESSAGES['rate_limit_exceeded'],
        errorType: 'rate_limit_exceeded',
        remaining: 0
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Phase 2.2: Consolidate queue entry creation (single point)
    console.log('[PROCESS-RESUME] Creating queue entry');
    const { data: queueEntry, error: queueError } = await supabase
      .from('resume_processing_queue')
      .insert({
        user_id: userId,
        file_name: fileName,
        file_size: fileSize || 0,
        file_type: fileType || 'unknown',
        status: 'processing',
        progress: 5
      })
      .select()
      .single();

    if (queueError) {
      console.error('[PROCESS-RESUME] Queue creation failed:', queueError);
      throw new Error('Failed to initialize processing queue');
    }
    queueId = queueEntry.id;
    console.log('[PROCESS-RESUME] Queue entry created:', queueId);

    // Phase 1: Handle file parsing based on what was provided
    let extractedText = '';
    
    if (fileData) {
      // New method: Parse file from base64 data
      await supabase.from('resume_processing_queue')
        .update({ progress: 15 })
        .eq('id', queueId);

      // Parse the file
      try {
        const parseStart = Date.now();
        extractedText = await parseFile(fileData, fileType || '');
        metrics.parseTime = Date.now() - parseStart;
        logMetrics(metrics, 'File parsing');
      } catch (error: any) {
        throw new Error(ERROR_MESSAGES['parsing_failed'] || 'Unable to read document content');
      }
    } else if (fileText) {
      // Legacy method: Check if text is actually binary data
      const binaryCheck = detectBinaryData(fileText);
      if (binaryCheck.isBinary) {
        throw new Error(ERROR_MESSAGES['parsing_failed'] || 'Unable to read document content');
      }
      extractedText = fileText;
    }
    
    // Phase 3.3: Enhanced extraction logging
    console.log('[PROCESS-RESUME] === EXTRACTION COMPLETE ===');
    console.log('[PROCESS-RESUME] Extracted text length:', extractedText.length);
    console.log('[PROCESS-RESUME] First 200 chars:', extractedText.substring(0, 200));
    console.log('[PROCESS-RESUME] Last 200 chars:', extractedText.substring(Math.max(0, extractedText.length - 200)));

    // Phase 1.4: Clean text
    const cleanedText = robustTextCleanup(extractedText);
    
    await supabase.from('resume_processing_queue')
      .update({ progress: 25 })
      .eq('id', queueId);

    // Phase 2.3: Generate content hash
    const contentHash = await generateContentHash(cleanedText);

    // Check cache
    const { data: cachedResult } = await supabase
      .from('resume_cache')
      .select('*')
      .eq('content_hash', contentHash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedResult) {
      // Update cache hit count
      await supabase
        .from('resume_cache')
        .update({ 
          hit_count: cachedResult.hit_count + 1,
          last_accessed: new Date().toISOString()
        })
        .eq('id', cachedResult.id);

      await supabase.from('resume_processing_queue')
        .update({ 
          status: 'completed',
          progress: 100,
          completed_at: new Date().toISOString()
        })
        .eq('id', queueId);

      // Log success
      await supabase.from('processing_logs').insert({
        user_id: userId,
        queue_id: queueId,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        processing_time_ms: Date.now() - startTime,
        extracted_text_length: cleanedText.length,
        success: true,
        was_cached: true,
        confidence_level: 'high'
      });

      return new Response(JSON.stringify({
        success: true,
        analysis: cachedResult.analysis_result,
        extractedText: cachedResult.extracted_text,
        cached: true,
        confidence: 'high'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    await supabase.from('resume_processing_queue')
      .update({ progress: 40 })
      .eq('id', queueId);

    // Phase 1.4: Validate document
    const validation = await validateIsResume(cleanedText, userId);

    if (!validation.isResume || validation.confidence < 0.5) {
      throw new Error(ERROR_MESSAGES['not_a_resume']);
    }

    await supabase.from('resume_processing_queue')
      .update({ progress: 60 })
      .eq('id', queueId);

    // Phase 5.1: Multi-pass analysis with confidence scoring
    const analysisStart = Date.now();
    const analysis = await multiPassAnalysis(cleanedText, userId);
    metrics.analysisTime = Date.now() - analysisStart;
    logMetrics(metrics, 'AI analysis');

    // Phase 3.3: Enhanced analysis logging
    console.log('[PROCESS-RESUME] === ANALYSIS COMPLETE ===');
    console.log('[PROCESS-RESUME] Confidence:', analysis.confidence_scores);
    console.log('[PROCESS-RESUME] Data quality issues:', analysis.data_quality_issues);

    await supabase.from('resume_processing_queue')
      .update({ progress: 85 })
      .eq('id', queueId);

    // Store in cache
    await supabase.from('resume_cache').insert({
      content_hash: contentHash,
      extracted_text: cleanedText,
      analysis_result: analysis,
      file_type: fileType
    });

    // Store analysis
    const { work_history, ...analysisForDb } = analysis;
    await supabase.from('resume_analysis').insert({
      user_id: userId,
      ...analysisForDb,
      years_experience: Math.round(Number(analysisForDb.years_experience || 0)),
      target_hourly_rate_min: Number(analysisForDb.target_hourly_rate_min) || null,
      target_hourly_rate_max: Number(analysisForDb.target_hourly_rate_max) || null
    });

    // Record rate limit
    await recordRateLimit(supabase, userId);

    await supabase.from('resume_processing_queue')
      .update({ 
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString()
      })
      .eq('id', queueId);

    // Log success
    await supabase.from('processing_logs').insert({
      user_id: userId,
      queue_id: queueId,
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
      processing_time_ms: Date.now() - startTime,
      extracted_text_length: cleanedText.length,
      success: true,
      validation_score: validation.confidence,
      confidence_level: validation.confidence > 0.8 ? 'high' : validation.confidence > 0.6 ? 'medium' : 'low'
    });

    // Extract role and industry for Career Vault redesign
    // Priority: AI extracted current_role > recommended_positions > regex fallback
    let detectedRole = analysis.current_role || analysis.recommended_positions?.[0] || null;
    let detectedIndustry = analysis.primary_industry || analysis.industry_expertise?.[0] || null;

    // Phase 4: Use regex fallback if AI didn't find role or industry
    if (!detectedRole || !detectedIndustry) {
      console.log('[PROCESS-RESUME] AI extraction incomplete, using regex fallback');
      const fallback = extractRoleAndIndustryFallback(cleanedText);
      detectedRole = detectedRole || fallback.role;
      detectedIndustry = detectedIndustry || fallback.industry;
      console.log('[PROCESS-RESUME] Fallback results:', { role: fallback.role, industry: fallback.industry });
    }

    console.log('[PROCESS-RESUME] Final detected role/industry:', { detectedRole, detectedIndustry });

    return new Response(JSON.stringify({
      success: true,
      analysis,
      extractedText: cleanedText,
      confidence: analysis.confidence_scores?.overall || 
        (validation.confidence > 0.8 ? 'high' : validation.confidence > 0.6 ? 'medium' : 'low'),
      validationReason: validation.reason,
      dataQualityIssues: analysis.data_quality_issues || [],
      confidenceBreakdown: analysis.confidence_scores,
      role: detectedRole,
      industry: detectedIndustry
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorType = Object.keys(ERROR_MESSAGES).find(key =>
      errorMessage.toLowerCase().includes(key.replace(/_/g, ' '))
    ) || 'parsing_failed';

    // Update queue status
    if (queueId) {
      await supabase.from('resume_processing_queue')
        .update({
          status: 'failed',
          error_message: errorMessage,
          error_type: errorType,
          completed_at: new Date().toISOString()
        })
        .eq('id', queueId);
    }

    // Log failure
    if (userId) {
      await supabase.from('processing_logs').insert({
        user_id: userId,
        queue_id: queueId,
        file_name: 'unknown',
        file_size: 0,
        file_type: 'unknown',
        processing_time_ms: Date.now() - startTime,
        success: false,
        error_type: errorType,
        error_message: errorMessage
      });
    }

    const errorMsg = ERROR_MESSAGES[errorType] || ERROR_MESSAGES['parsing_failed'] || 'Unable to process resume';

    return new Response(JSON.stringify({
      success: false,
      error: errorMsg,
      errorType,
      details: errorMessage
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});