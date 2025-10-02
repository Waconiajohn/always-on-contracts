import { supabase } from "@/integrations/supabase/client";
import { z } from 'zod';

export interface ResumeOptimizationResult {
  success: boolean;
  optimizedResume: string;
  analysis: {
    skillsMatchScore: number;
    experienceMatchScore: number;
    achievementsScore: number;
    keywordDensityScore: number;
    formatScore: number;
    overallScore: number;
  };
  improvements: string[];
  missingKeywords: string[];
  recommendations: string[];
}

const optimizeResumeSchema = z.object({
  resumeText: z.string().min(100, 'Resume must be at least 100 characters'),
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
});

/**
 * Optimizes a resume to better match a job description using AI
 * @param resumeText - The original resume text
 * @param jobDescription - The target job description
 * @returns Promise<ResumeOptimizationResult> - The optimization results
 */
export async function optimizeResume(
  resumeText: string,
  jobDescription: string
): Promise<ResumeOptimizationResult> {
  // Validate input
  const validated = optimizeResumeSchema.parse({ resumeText, jobDescription });

  try {
    const { data, error } = await supabase.functions.invoke('optimize-resume-detailed', {
      body: {
        resumeText: validated.resumeText,
        jobDescription: validated.jobDescription
      }
    });

    if (error) {
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to optimize resume');
    }

    return data as ResumeOptimizationResult;

  } catch (error) {
    console.error('Resume optimization error:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to optimize resume. Please try again.'
    );
  }
}
