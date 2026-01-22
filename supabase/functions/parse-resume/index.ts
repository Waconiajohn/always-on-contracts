import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getDocumentProxy } from "https://esm.sh/unpdf@0.11.0";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Robust text cleanup - fixes PDF/DOCX extraction artifacts
function robustTextCleanup(text: string): string {
  return text
    .normalize('NFKC')
    // Fix encoding issues
    .replace(/â€™/g, "'")
    .replace(/â€"/g, "—")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    // Fix phone numbers: "( 713 ) 397 . 3368" → "(713) 397-3368"
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\(\s*(\d{3})\s*\)\s*(\d{3})\s*[.-]?\s*(\d{4})/g, '($1) $2-$3')
    // Fix email addresses: "name@ gmail .com" → "name@gmail.com"
    .replace(/([a-z0-9])@\s+([a-z])/gi, '$1@$2')
    .replace(/\.\s+(com|org|net|edu|gov)\b/gi, '.$1')
    .replace(/([a-z0-9])\s+\.([a-z])/gi, '$1.$2')
    // Fix numbers with decimals: "3 . 14" → "3.14"
    .replace(/(\d)\s+\.\s+(\d)/g, '$1.$2')
    // Fix plus signs in numbers: "17 +" → "17+"
    .replace(/(\d)\s+\+/g, '$1+')
    // Fix hyphens in words: "luke - bibler" → "luke-bibler"
    .replace(/([a-z])\s+-\s+([a-z])/gi, '$1-$2')
    // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract text from Word XML structure
function extractTextFromWordXml(xml: string): string {
  const paragraphs: string[] = [];
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

  return paragraphs.join('\n\n').trim();
}

// Parse file based on type - supports PDF, DOCX, TXT
async function parseFile(base64Data: string, fileName: string): Promise<string> {
  const fileNameLower = fileName.toLowerCase();
  console.log(`[parse-resume] Parsing file: ${fileName}`);

  try {
    // Plain text files - decode directly
    if (fileNameLower.endsWith('.txt')) {
      console.log('[parse-resume] TXT file detected, decoding directly');
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    }

    // PDF files - use unpdf library
    if (fileNameLower.endsWith('.pdf')) {
      console.log('[parse-resume] PDF detected, extracting text with unpdf');
      
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const pdf = await getDocumentProxy(bytes);
      const numPages = pdf.numPages;
      console.log(`[parse-resume] PDF has ${numPages} pages`);
      
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
      
      if (extractedText.length < 100) {
        throw new Error('This appears to be a scanned PDF. Please use a text-based PDF or Word document.');
      }
      
      console.log(`[parse-resume] Extracted ${extractedText.length} chars from PDF`);
      return extractedText;
    }

    // Word documents - parse XML structure with JSZip
    if (fileNameLower.endsWith('.docx') || fileNameLower.endsWith('.doc')) {
      console.log('[parse-resume] Word document detected, parsing XML structure');
      
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
        throw new Error('Invalid Word document: missing document.xml');
      }

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

      console.log(`[parse-resume] Extracted ${extractedText.length} chars from DOCX`);
      return extractedText;
    }

    throw new Error('Unsupported file type. Please use PDF, DOCX, or TXT files.');
    
  } catch (error: any) {
    console.error('[parse-resume] Parsing error:', error);
    throw error;
  }
}

// Validate if document is likely a resume
function isLikelyResume(text: string): boolean {
  const resumeIndicators = [
    /experience|employment|work history|professional background|career|positions?/i,
    /education|degree|university|college|academic|certifications?/i,
    /skills|proficiencies|expertise|competencies|technical|technologies/i,
    /objective|summary|profile|about|background/i,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}/i,
    /\b(manager|engineer|developer|analyst|specialist|coordinator|director|consultant)/i
  ];
  
  const contractIndicators = [
    /agreement|contract|terms and conditions/i,
    /whereas|parties|witnesseth/i,
    /confidential|non-disclosure/i
  ];
  
  const resumeMatches = resumeIndicators.filter(r => r.test(text)).length;
  const contractMatches = contractIndicators.filter(r => r.test(text)).length;
  
  return contractMatches === 0 ? resumeMatches >= 1 : resumeMatches > contractMatches;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[parse-resume] Missing or invalid auth header');
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('[parse-resume] Invalid token:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`[parse-resume] Authenticated user: ${userId}`);

    // Parse request body
    const contentType = req.headers.get('content-type') || '';
    let fileData = '';
    let fileName = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return new Response(
          JSON.stringify({ success: false, error: 'No file provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      fileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      fileData = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    } else {
      const body = await req.json();
      fileData = body.fileData;
      fileName = body.fileName || '';
    }

    if (!fileData || !fileName) {
      return new Response(
        JSON.stringify({ success: false, error: 'File data and filename required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[parse-resume] Processing file: ${fileName}, base64 length: ${fileData.length}`);

    // Extract text using robust parser
    const rawText = await parseFile(fileData, fileName);
    
    // Apply text cleanup
    const cleanedText = robustTextCleanup(rawText);
    
    console.log(`[parse-resume] Cleaned text length: ${cleanedText.length}`);

    // Validate minimum content
    if (cleanedText.length < 50) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not extract meaningful text from the file. Please ensure it contains text content.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate it's actually a resume
    if (!isLikelyResume(cleanedText)) {
      console.log('[parse-resume] Document rejected: not a resume');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'The uploaded document does not appear to be a resume. Please upload a proper resume document.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return successfully parsed text
    return new Response(
      JSON.stringify({
        success: true,
        text: cleanedText
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[parse-resume] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to parse resume file'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
