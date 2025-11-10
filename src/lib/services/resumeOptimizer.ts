import { 
  OptimizeResumeSchema, 
  validateInput,
  invokeEdgeFunction
} from "@/lib/edgeFunction";

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
  // Validate input with Zod schema
  const validated = validateInput(OptimizeResumeSchema, { resumeText, jobDescription });

  const { data, error } = await invokeEdgeFunction<ResumeOptimizationResult>(
    'optimize-resume-with-audit',
    {
      resumeText: validated.resumeText,
      jobDescription: validated.jobDescription
    }
  );

  if (error || !data) {
    throw new Error(
      error?.message || 'Failed to optimize resume. Please try again.'
    );
  }

  return data;
}
