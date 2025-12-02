/**
 * Elite Resume Generation Hook
 * Handles AI generation of complete resume with confidence tagging
 */

import { useState } from 'react';
import { invokeEdgeFunction } from '@/lib/edgeFunction';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import type { EliteResumeData, ResumeSection } from '../types';

interface GenerationOptions {
  jobDescription: string;
  jobTitle?: string;
  industry?: string;
  resumeText?: string;
  vaultData?: any;
  userId?: string;
}

export function useEliteResumeGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateEliteResume = async (
    options: GenerationOptions
  ): Promise<EliteResumeData | null> => {
    setIsGenerating(true);
    setProgress(10);

    try {
      logger.info('Starting elite resume generation', { options });

      // Call edge function to generate complete resume
      const { data, error } = await invokeEdgeFunction<{
        resumeData: EliteResumeData;
        analysis: any;
      }>('generate-elite-resume', {
        jobDescription: options.jobDescription,
        jobTitle: options.jobTitle,
        industry: options.industry,
        resumeText: options.resumeText,
        vaultData: options.vaultData,
        userId: options.userId
      });

      setProgress(90);

      if (error || !data) {
        throw new Error(error?.message || 'Failed to generate resume');
      }

      setProgress(100);
      logger.info('Elite resume generated successfully');
      
      return data.resumeData;
    } catch (error) {
      logger.error('Error generating elite resume', error instanceof Error ? error : undefined);
      toast.error('Failed to generate resume. Please try again.');
      return null;
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const regenerateBullet = async (
    bulletId: string,
    context: { section: ResumeSection; jobDescription: string }
  ): Promise<string | null> => {
    try {
      logger.info('Regenerating bullet', { bulletId });

      const { data, error } = await invokeEdgeFunction<{ newText: string }>(
        'regenerate-bullet',
        {
          bulletId,
          sectionType: context.section.type,
          jobDescription: context.jobDescription
        }
      );

      if (error || !data) {
        throw new Error('Failed to regenerate');
      }

      return data.newText;
    } catch (error) {
      logger.error('Error regenerating bullet', error instanceof Error ? error : undefined);
      toast.error('Failed to regenerate. Please try again.');
      return null;
    }
  };

  return {
    generateEliteResume,
    regenerateBullet,
    isGenerating,
    progress
  };
}
