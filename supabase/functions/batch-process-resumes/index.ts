import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BatchResume {
  fileName: string;
  fileData: string;
  fileSize: number;
  fileType: string;
}

interface BatchResult {
  fileName: string;
  success: boolean;
  analysis?: any;
  error?: string;
  errorType?: string;
  solutions?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { resumes, userId } = await req.json() as { resumes: BatchResume[], userId: string };

    if (!resumes || !Array.isArray(resumes) || resumes.length === 0) {
      throw new Error("No resumes provided");
    }

    if (!userId) {
      throw new Error("User ID is required");
    }

    // Limit batch size
    const MAX_BATCH_SIZE = 10;
    if (resumes.length > MAX_BATCH_SIZE) {
      throw new Error(`Batch size exceeds maximum of ${MAX_BATCH_SIZE} resumes`);
    }

    const results: BatchResult[] = [];

    // Process resumes sequentially to avoid overwhelming the system
    for (const resume of resumes) {
      try {
        const { data, error } = await supabase.functions.invoke('process-resume', {
          body: {
            fileText: resume.fileData,
            fileName: resume.fileName,
            fileSize: resume.fileSize,
            fileType: resume.fileType,
            userId
          }
        });

        if (error) {
          results.push({
            fileName: resume.fileName,
            success: false,
            error: error.message || "Processing failed",
            errorType: "processing_failed"
          });
        } else if (!data.success) {
          results.push({
            fileName: resume.fileName,
            success: false,
            error: data.error || "Processing failed",
            errorType: data.errorType,
            solutions: data.solutions
          });
        } else {
          results.push({
            fileName: resume.fileName,
            success: true,
            analysis: data.analysis
          });
        }
      } catch (error) {
        results.push({
          fileName: resume.fileName,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          errorType: "unknown_error"
        });
      }

      // Small delay between resumes to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return new Response(JSON.stringify({
      success: true,
      totalProcessed: resumes.length,
      successCount,
      failureCount,
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Batch processing error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Batch processing failed"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});