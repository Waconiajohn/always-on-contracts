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
    // For PDF and DOC files, use Lovable AI for parsing
    else if (fileName.endsWith('.pdf') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'AI service not configured. Please contact support.',
            needsConfig: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log('Using Lovable AI to parse document...');

      // Determine MIME type
      const mimeType = fileName.endsWith('.pdf') 
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      // Use Lovable AI to extract text from document
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
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Please extract ALL text content from this resume document. Return only the raw text content, preserving formatting where possible. Do not add any commentary or explanations.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${fileData}`
                  }
                }
              ]
            }
          ],
          max_tokens: 4000
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('Lovable AI error:', aiResponse.status, errorText);
        
        if (aiResponse.status === 429) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'AI service rate limit exceeded. Please try again in a moment.' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
          );
        }
        
        if (aiResponse.status === 402) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'AI service requires additional credits. Please contact support.' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
          );
        }

        // Check if it's an image extraction error (common with certain PDF formats)
        if (errorText.includes('Failed to extract') || errorText.includes('image')) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'This PDF format cannot be parsed automatically. Please copy and paste your resume text directly into the text area instead.' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to parse document. Please try copying and pasting your resume text instead.' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      const aiResult = await aiResponse.json();
      extractedText = aiResult.choices?.[0]?.message?.content || '';

      if (!extractedText) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Could not extract text from document. Please ensure the file contains readable text.' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      console.log('Successfully extracted text using AI, length:', extractedText.length);
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unsupported file type. Please use .txt, .pdf, .doc, or .docx files.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not extract meaningful text from the file. Please ensure the file contains text content.' 
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
