import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    let jobData: { url?: string; text?: string; fileData?: string; fileName?: string } = {};

    if (contentType.includes('application/json')) {
      jobData = await req.json();
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        jobData.fileData = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        jobData.fileName = file.name;
      }
    }

    console.log('Parse job document request:', { hasUrl: !!jobData.url, hasText: !!jobData.text, hasFile: !!jobData.fileData });

    let parsedText = '';

    // Handle URL scraping
    if (jobData.url) {
      console.log('Fetching URL:', jobData.url);
      const urlResponse = await fetch(jobData.url);
      const html = await urlResponse.text();
      
      // Basic HTML to text conversion (remove tags, clean up)
      parsedText = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    // Handle direct text paste
    else if (jobData.text) {
      parsedText = jobData.text;
    }
    // Handle file upload (PDF, DOCX, TXT)
    else if (jobData.fileData && jobData.fileName) {
      const fileName = jobData.fileName.toLowerCase();
      
      if (fileName.endsWith('.txt')) {
        // Decode base64 text file
        parsedText = atob(jobData.fileData);
      } else if (fileName.endsWith('.pdf') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        // For PDF/DOCX, we'd need specialized parsing libraries
        // For now, return error suggesting copy/paste
        return new Response(
          JSON.stringify({
            success: false,
            error: 'PDF and DOCX parsing requires copy/paste. Please copy the job description text and use the Paste tab.',
            suggestion: 'Open the file, select all text (Ctrl+A / Cmd+A), and paste into the text area.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    if (!parsedText) {
      return new Response(
        JSON.stringify({ success: false, error: 'No content provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Extract job details using simple pattern matching
    const jobTitle = extractJobTitle(parsedText);
    const companyName = extractCompanyName(parsedText);

    console.log('Parsed job document:', { 
      textLength: parsedText.length, 
      jobTitle, 
      companyName 
    });

    return new Response(
      JSON.stringify({
        success: true,
        jobDescription: parsedText,
        jobTitle,
        companyName
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error parsing job document:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse job document'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function extractJobTitle(text: string): string | null {
  // Look for common job title patterns
  const patterns = [
    /job title[:\s]+([^\n]+)/i,
    /position[:\s]+([^\n]+)/i,
    /role[:\s]+([^\n]+)/i,
    /^([^\n]{10,60})\n/m, // First line if reasonable length
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function extractCompanyName(text: string): string | null {
  // Look for common company name patterns
  const patterns = [
    /company[:\s]+([^\n]+)/i,
    /employer[:\s]+([^\n]+)/i,
    /organization[:\s]+([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}