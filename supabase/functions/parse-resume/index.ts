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
    let fileData = '';
    let fileName = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return new Response(
          JSON.stringify({ success: false, error: 'No file provided' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      fileName = file.name.toLowerCase();
      const arrayBuffer = await file.arrayBuffer();
      fileData = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    } else {
      const body = await req.json();
      fileData = body.fileData;
      fileName = body.fileName?.toLowerCase() || '';
    }

    console.log('Parsing resume file:', fileName);

    let extractedText = '';

    // Handle text files
    if (fileName.endsWith('.txt')) {
      extractedText = atob(fileData);
    } 
    // For PDF and DOC files, use Lovable AI to extract text
    else if (fileName.endsWith('.pdf') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'PDF parsing not configured. Please copy and paste your resume text instead.' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Use AI to extract text from PDF
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'Extract all text content from the provided document. Return only the raw text without any formatting, explanations, or additional comments. Preserve the original structure and line breaks where appropriate.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Please extract all text from this ${fileName.split('.').pop()?.toUpperCase()} resume file:`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:application/${fileName.endsWith('.pdf') ? 'pdf' : 'vnd.openxmlformats-officedocument.wordprocessingml.document'};base64,${fileData}`
                  }
                }
              ]
            }
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI extraction error:', errorText);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to extract text from document. Please try copying and pasting the text instead.' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      const aiResult = await aiResponse.json();
      extractedText = aiResult.choices?.[0]?.message?.content || '';
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unsupported file type. Please use .txt, .pdf, .doc, or .docx files, or paste your resume text directly.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not extract meaningful text from the file. Please try pasting your resume text directly.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Sanitize the text to remove problematic characters
    const sanitizedText = extractedText
      .replace(/\u0000/g, '') // Remove null bytes
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove other control characters
      .trim();

    console.log('Successfully extracted text, length:', sanitizedText.length);

    return new Response(
      JSON.stringify({
        success: true,
        text: sanitizedText
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error parsing resume:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse resume file'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
