// src/lib/resumeModel.ts

export type CanonicalSectionType =
  | "summary"
  | "experience"
  | "skills"
  | "achievements"
  | "leadership"
  | "projects"
  | "education"
  | "certifications"
  | "other";

export interface ResumeBulletMetadata {
  requirementId?: string;
  requirementText?: string;
  requirementCategory?: 'required' | 'preferred' | 'nice_to_have';
  evidenceId?: string;
  milestoneId?: string;
  originalBullet?: string;
  originalSource?: {
    jobTitle: string;
    company: string;
    dateRange: string;
  };
  matchScore?: number;
  matchStrength?: 'Gold' | 'Silver' | 'Bronze';
  atsKeywordsAdded?: string[];
  userEdited?: boolean;
}

export interface ResumeBullet {
  id: string;
  content: string;
  meta?: ResumeBulletMetadata;
}

export interface CanonicalResumeSection {
  id: string;
  type: CanonicalSectionType;
  heading: string;
  /**
   * Plain-text bullets only – no HTML.
   * This makes ATS parsing and export much simpler.
   */
  bullets: string[] | ResumeBullet[];
  /**
   * Optional free-form block for sections like Summary
   * that may be paragraph-style instead of bullets.
   */
  paragraph?: string;
  order: number;
  /**
   * Optional metadata for the entire section
   */
  sectionMetadata?: {
    evidenceMatrixId?: string;
    coverageScore?: number;
    totalRequirements?: number;
    matchedRequirements?: number;
  };
}

export interface CanonicalResumeHeader {
  fullName: string;
  headline?: string;
  // e.g. "Minneapolis, MN • 612-555-1234 • email@domain.com • LinkedIn.com/in/..."
  contactLine?: string;
}

export interface CanonicalResume {
  header: CanonicalResumeHeader;
  sections: CanonicalResumeSection[];
}

/**
 * This is the shape we expect from the resume builder UI.
 * It mirrors your existing builder types but is kept loose enough
 * to avoid breaking changes.
 */
export interface BuilderResumeItem {
  id: string;
  content: string;
  order?: number;
}

export interface BuilderResumeSection {
  id: string;
  type: string;
  title: string;
  items: BuilderResumeItem[];
  order: number;
}

/**
 * Minimal job / user context we might want to embed in exports.
 */
export interface ResumeContext {
  jobTitle?: string;
  companyName?: string;
  location?: string;
}
