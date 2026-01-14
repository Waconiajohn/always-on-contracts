import {
  Zap,
  FileText,
  Package,
  Linkedin,
  Mic,
  type LucideIcon,
} from "lucide-react";

export type ModuleId = 
  | 'quick_score' 
  | 'resume_jobs_studio' 
  | 'master_resume' 
  | 'linkedin_pro' 
  | 'interview_mastery';

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  pages: string[];
  features: string[];
  price?: number; // Monthly price in USD, undefined = free
}

export const MODULES: Record<ModuleId, ModuleDefinition> = {
  quick_score: {
    id: 'quick_score',
    name: 'Quick Score',
    description: 'Free resume parsing and ATS scoring',
    icon: Zap,
    color: 'text-yellow-500',
    pages: ['/quick-score'],
    features: [
      'Resume upload & parsing',
      'ATS score check',
      'Basic skills analysis',
    ],
    price: undefined, // Free
  },
  resume_jobs_studio: {
    id: 'resume_jobs_studio',
    name: 'Resume & Jobs Studio',
    description: 'Build resumes, find jobs, and track applications',
    icon: FileText,
    color: 'text-blue-500',
    pages: [
      '/resume-builder',
      '/my-resumes',
      '/templates',
      '/resume-optimizer',
      '/job-search',
      '/boolean-search',
      '/active-applications',
      '/application-queue',
    ],
    features: [
      'AI-powered resume builder',
      'Executive templates',
      'Resume optimization',
      'Job search & matching',
      'Application tracking',
      'Boolean search builder',
    ],
    price: 29,
  },
  master_resume: {
    id: 'master_resume',
    name: 'Master Resume',
    description: 'Your comprehensive career document that grows over time',
    icon: Package,
    color: 'text-purple-500',
    pages: [
      '/master-resume',
      '/coaching',
    ],
    features: [
      'Master resume management',
      'AI career coaching',
      'Version history',
      'Resume enrichment',
      'Structured data parsing',
    ],
    price: 29,
  },
  linkedin_pro: {
    id: 'linkedin_pro',
    name: 'LinkedIn Pro',
    description: 'Complete LinkedIn presence - profile, networking, content',
    icon: Linkedin,
    color: 'text-sky-500',
    pages: [
      '/agents/linkedin-profile-builder',
      '/agents/linkedin-networking',
      '/agents/linkedin-blogging',
      '/agents/networking',
    ],
    features: [
      'Profile headline & about optimization',
      'Recruiter search simulator',
      'Networking message generator',
      'Content series planner',
      'Post composer & scheduler',
      'Engagement analytics',
    ],
    price: 19,
  },
  interview_mastery: {
    id: 'interview_mastery',
    name: 'Interview Mastery',
    description: 'Complete interview preparation and success',
    icon: Mic,
    color: 'text-green-500',
    pages: [
      '/agents/interview-prep',
      '/salary-negotiation',
    ],
    features: [
      'AI interview prep agent',
      'Question practice & validation',
      'STAR story generator',
      'Elevator pitch builder',
      'Company research panel',
      '30-60-90 day plan builder',
      'Follow-up email generator',
      'Salary negotiation tools',
    ],
    price: 19,
  },
};

// Map page paths to modules
export function getModuleForPage(path: string): ModuleId | null {
  for (const [moduleId, module] of Object.entries(MODULES)) {
    if (module.pages.some(p => path.startsWith(p))) {
      return moduleId as ModuleId;
    }
  }
  return null;
}

// Tier to modules mapping
export type SubscriptionTier = 'free' | 'career_starter' | 'always_ready' | 'concierge_elite';

export const TIER_MODULES: Record<SubscriptionTier, ModuleId[]> = {
  free: ['quick_score'],
  career_starter: ['quick_score', 'resume_jobs_studio', 'master_resume'],
  always_ready: ['quick_score', 'resume_jobs_studio', 'master_resume', 'linkedin_pro', 'interview_mastery'],
  concierge_elite: ['quick_score', 'resume_jobs_studio', 'master_resume', 'linkedin_pro', 'interview_mastery'],
};

// Get all modules a tier has access to
export function getModulesForTier(tier: SubscriptionTier): ModuleId[] {
  return TIER_MODULES[tier] || TIER_MODULES.free;
}
