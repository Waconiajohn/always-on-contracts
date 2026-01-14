/**
 * Resume quality helpers - provides strength level and action prompts
 */

export interface StrengthLevel {
  level: string;
  textColor: string;
  bgColor: string;
  description: string;
}

export function getStrengthLevel(completion: number): StrengthLevel {
  if (completion >= 80) {
    return {
      level: "Interview Ready",
      textColor: "text-green-600",
      bgColor: "bg-green-100",
      description: "Your resume is fully optimized and ready for applications"
    };
  }
  if (completion >= 60) {
    return {
      level: "Strong",
      textColor: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "Your resume has solid content, consider adding more details"
    };
  }
  if (completion >= 40) {
    return {
      level: "Building",
      textColor: "text-amber-600",
      bgColor: "bg-amber-100",
      description: "Good progress! Continue adding experiences and skills"
    };
  }
  if (completion >= 20) {
    return {
      level: "Getting Started",
      textColor: "text-orange-600",
      bgColor: "bg-orange-100",
      description: "Upload your resume or add more content"
    };
  }
  return {
    level: "New",
    textColor: "text-gray-600",
    bgColor: "bg-gray-100",
    description: "Upload your resume to get started"
  };
}

export function getNextActionPrompt(
  completion: number,
  _activeApplications: string[] = []
): string {
  if (completion < 20) {
    return "Upload your resume to unlock AI-powered career insights";
  }
  if (completion < 40) {
    return "Add more work experience to strengthen your profile";
  }
  if (completion < 60) {
    return "Complete your skills section for better job matching";
  }
  if (completion < 80) {
    return "Fine-tune your resume for maximum impact";
  }
  return "Your resume is ready - start applying to jobs!";
}
