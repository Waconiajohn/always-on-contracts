import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GenerateAnswerParams {
  question: string;
  purpose: string;
  gapAddressed: string;
  resumeText: string;
  jobDescription: string;
}

interface GenerateAnswerResult {
  suggestedAnswer: string;
  confidence: "high" | "medium" | "low";
  extractedEvidence: string[];
  note?: string;
}

export function useInterviewAIAssist() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAnswer = async (params: GenerateAnswerParams): Promise<GenerateAnswerResult | null> => {
    if (!params.resumeText) {
      toast.error("Resume text is required to generate an answer");
      return null;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-interview-answer", {
        body: {
          question: params.question,
          purpose: params.purpose,
          gapAddressed: params.gapAddressed,
          resumeText: params.resumeText,
          jobDescription: params.jobDescription,
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        
        // Handle specific error codes
        if (error.message?.includes("429") || error.message?.includes("rate limit")) {
          toast.error("Rate limit reached. Please wait a moment and try again.");
        } else if (error.message?.includes("402") || error.message?.includes("credits")) {
          toast.error("AI credits exhausted. Please add credits to continue.");
        } else {
          toast.error("Failed to generate answer. Please try again.");
        }
        return null;
      }

      if (data?.error) {
        toast.error(data.error);
        return null;
      }

      // Show confidence-based feedback
      if (data?.confidence === "low") {
        toast.info(data.note || "Generated with low confidence - your resume may lack specific details for this question.");
      }

      return data as GenerateAnswerResult;
    } catch (err) {
      console.error("Error generating answer:", err);
      toast.error("Something went wrong. Please try again.");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateAnswer, isGenerating };
}
