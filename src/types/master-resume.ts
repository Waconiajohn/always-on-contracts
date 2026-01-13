export interface MasterResume {
  id: string;
  user_id: string;
  content: string;
  structured_data: StructuredResumeData;
  version: number;
  word_count: number | null;
  last_enriched_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MasterResumeHistory {
  id: string;
  master_resume_id: string;
  user_id: string;
  content: string;
  structured_data: StructuredResumeData;
  version: number;
  change_summary: string | null;
  created_at: string;
}

export interface StructuredResumeData {
  header?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
  };
  summary?: string;
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  skills?: string[];
  certifications?: string[];
  achievements?: string[];
}

export interface ExperienceEntry {
  id?: string;
  company: string;
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  bullets: string[];
}

export interface EducationEntry {
  id?: string;
  institution: string;
  degree: string;
  field?: string;
  graduationDate?: string;
  gpa?: string;
  honors?: string[];
}

export interface EnrichmentSuggestion {
  type: 'bullet' | 'skill' | 'achievement';
  content: string;
  sourceContext?: string;
  confidence: number;
}
