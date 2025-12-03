/**
 * useResumePreviewData - Combines vault data for live resume preview
 */

import { useMemo } from 'react';
import { useVaultData } from './useVaultData';

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  location?: string;
  milestones: string[];
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  graduationYear: number | null;
  honors?: string;
}

export interface ResumePreviewData {
  contactInfo: ContactInfo;
  workExperience: WorkExperience[];
  education: EducationEntry[];
  skills: string[];
  powerPhrases: string[];
  isLoading: boolean;
  hasData: boolean;
}

export function useResumePreviewData(userId: string | undefined): ResumePreviewData {
  const { data: vaultData, isLoading } = useVaultData(userId);

  const previewData = useMemo<ResumePreviewData>(() => {
    if (!vaultData) {
      return {
        contactInfo: {
          name: '',
          email: '',
          phone: '',
          location: '',
          linkedin: ''
        },
        workExperience: [],
        education: [],
        skills: [],
        powerPhrases: [],
        isLoading,
        hasData: false
      };
    }

    // Extract contact info from profiles
    const profile = vaultData.userProfile || {};
    const careerContext = vaultData.careerContext || {};
    
    const contactInfo: ContactInfo = {
      name: profile.full_name || profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      location: careerContext.location || profile.location || '',
      linkedin: profile.linkedin_url || ''
    };

    // Map work positions with their milestones
    const workExperience: WorkExperience[] = (vaultData.workPositions || []).map((pos: any) => {
      const positionMilestones = (vaultData.milestones || [])
        .filter((m: any) => m.work_position_id === pos.id)
        .map((m: any) => m.achievement_text || m.milestone_text || '');
      
      return {
        id: pos.id,
        company: pos.company_name || '',
        title: pos.job_title || '',
        startDate: pos.start_date || '',
        endDate: pos.end_date,
        isCurrent: pos.is_current || false,
        location: pos.location,
        milestones: positionMilestones.filter(Boolean)
      };
    });

    // Map education
    const education: EducationEntry[] = (vaultData.education || []).map((edu: any) => ({
      id: edu.id,
      institution: edu.institution_name || '',
      degree: edu.degree_type || edu.degree_name || '',
      field: edu.field_of_study || '',
      graduationYear: edu.graduation_year,
      honors: edu.honors
    }));

    // Combine skills from multiple sources
    const skills: string[] = [
      ...(vaultData.transferableSkills || []).map((s: any) => s.skill_name),
      ...(vaultData.hiddenCompetencies || []).map((c: any) => c.competency_name),
      ...(vaultData.softSkills || []).map((s: any) => s.skill_name)
    ].filter(Boolean).slice(0, 20);

    // Get top power phrases
    const powerPhrases: string[] = (vaultData.powerPhrases || [])
      .slice(0, 10)
      .map((p: any) => p.phrase_text)
      .filter(Boolean);

    return {
      contactInfo,
      workExperience,
      education,
      skills,
      powerPhrases,
      isLoading,
      hasData: workExperience.length > 0 || education.length > 0 || skills.length > 0
    };
  }, [vaultData, isLoading]);

  return previewData;
}
