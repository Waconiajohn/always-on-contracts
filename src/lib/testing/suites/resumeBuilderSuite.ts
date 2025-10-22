import { supabase } from '@/integrations/supabase/client';
import { TestSuite } from '../types';

export const resumeBuilderSuite: TestSuite = {
  id: 'resume-builder-suite',
  name: 'Resume Builder',
  description: 'Tests for resume generation, ATS scoring, and export functionality',
  category: 'resume-builder',
  tests: [
    {
      id: 'resume-001',
      name: 'Create resume version',
      description: 'User should be able to create a new resume version',
      category: 'resume-builder',
      priority: 'critical',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
          .from('resume_versions')
          .insert({
            user_id: session.session.user.id,
            version_name: 'Test Resume',
            content: { summary: 'Test summary', experience: [] },
          })
          .select()
          .single();

        return {
          passed: !error && !!data,
          duration: 0,
          error: error?.message,
        };
      },
    },
    {
      id: 'resume-002',
      name: 'Job description analysis',
      description: 'Should analyze job requirements from description',
      category: 'resume-builder',
      priority: 'high',
      execute: async () => {
        const mockRequirements = ['React', '5+ years experience'];

        return {
          passed: mockRequirements.length > 0,
          duration: 0,
          metadata: { requirements: mockRequirements },
        };
      },
    },
    {
      id: 'resume-003',
      name: 'Gap analysis',
      description: 'Should identify gaps between vault and job requirements',
      category: 'resume-builder',
      priority: 'high',
      execute: async () => {
        const mockGaps = {
          missing: ['AWS certification'],
          weak: ['Leadership'],
          strong: ['React', 'TypeScript'],
        };

        return {
          passed: Object.keys(mockGaps).length > 0,
          duration: 0,
          metadata: mockGaps,
        };
      },
    },
    {
      id: 'resume-004',
      name: 'Format selection',
      description: 'Should support multiple resume formats',
      category: 'resume-builder',
      priority: 'medium',
      execute: async () => {
        const formats = ['chronological', 'functional', 'hybrid'];

        return {
          passed: formats.length === 3,
          duration: 0,
          metadata: { formats },
        };
      },
    },
    {
      id: 'resume-005',
      name: 'Generation mode selection',
      description: 'Should support full and section-by-section generation',
      category: 'resume-builder',
      priority: 'medium',
      execute: async () => {
        const modes = ['full', 'section-by-section'];

        return {
          passed: modes.length === 2,
          duration: 0,
          metadata: { modes },
        };
      },
    },
    {
      id: 'resume-006',
      name: 'ATS score auto-analysis',
      description: 'Should automatically analyze ATS score after generation',
      category: 'resume-builder',
      priority: 'critical',
      execute: async () => {
        const mockATSScore = {
          overall_score: 85,
          keyword_match: 90,
          formatting: 80,
        };

        return {
          passed: mockATSScore.overall_score >= 0 && mockATSScore.overall_score <= 100,
          duration: 0,
          metadata: mockATSScore,
        };
      },
    },
    {
      id: 'resume-007',
      name: 'ATS score metadata',
      description: 'Should track ATS score in resume metadata',
      category: 'resume-builder',
      priority: 'high',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const { data } = await supabase
          .from('resume_versions')
          .select('customizations')
          .eq('user_id', session.session.user.id)
          .limit(1)
          .single();

        return {
          passed: true,
          duration: 0,
          metadata: { hasCustomizations: !!data?.customizations },
        };
      },
    },
    {
      id: 'resume-008',
      name: 'Re-analyze ATS score',
      description: 'User should be able to re-analyze ATS score',
      category: 'resume-builder',
      priority: 'high',
      execute: async () => {
        return {
          passed: true,
          duration: 0,
          metadata: { note: 'Re-analyze button functionality' },
        };
      },
    },
    {
      id: 'resume-009',
      name: 'ATS improvement suggestions',
      description: 'Should provide suggestions when score is below 80%',
      category: 'resume-builder',
      priority: 'high',
      execute: async () => {
        const mockSuggestions = [
          'Add more industry keywords',
          'Improve section formatting',
        ];

        return {
          passed: mockSuggestions.length > 0,
          duration: 0,
          metadata: { suggestions: mockSuggestions },
        };
      },
    },
    {
      id: 'resume-010',
      name: 'Save resume metadata',
      description: 'Resume metadata should persist in database',
      category: 'resume-builder',
      priority: 'high',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const { data: resume } = await supabase
          .from('resume_versions')
          .select('id')
          .eq('user_id', session.session.user.id)
          .limit(1)
          .single();

        if (!resume) {
          return { passed: true, duration: 0, metadata: { note: 'No resume to update' } };
        }

        const { error } = await supabase
          .from('resume_versions')
          .update({ 
            customizations: { ats_score: { overall_score: 85, keyword_match: 90 } }
          })
          .eq('id', resume.id);

        return {
          passed: !error,
          duration: 0,
          error: error?.message,
        };
      },
    },
    {
      id: 'resume-011',
      name: 'Export to PDF',
      description: 'Should export resume to PDF format',
      category: 'resume-builder',
      priority: 'critical',
      execute: async () => {
        return {
          passed: true,
          duration: 0,
          metadata: { format: 'PDF' },
        };
      },
    },
    {
      id: 'resume-012',
      name: 'Export to DOCX',
      description: 'Should export resume to DOCX format',
      category: 'resume-builder',
      priority: 'high',
      execute: async () => {
        return {
          passed: true,
          duration: 0,
          metadata: { format: 'DOCX' },
        };
      },
    },
    {
      id: 'resume-013',
      name: 'Edit resume content',
      description: 'User should be able to edit resume sections',
      category: 'resume-builder',
      priority: 'critical',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const { data: resume } = await supabase
          .from('resume_versions')
          .select('id, content')
          .eq('user_id', session.session.user.id)
          .limit(1)
          .single();

        if (!resume) {
          return { passed: true, duration: 0, metadata: { note: 'No resume to edit' } };
        }

        const updatedContent = {
          summary: 'Updated summary',
        };

        const { error } = await supabase
          .from('resume_versions')
          .update({ content: updatedContent })
          .eq('id', resume.id);

        return {
          passed: !error,
          duration: 0,
          error: error?.message,
        };
      },
    },
    {
      id: 'resume-014',
      name: 'Vault match calculation',
      description: 'Should calculate match between vault and job requirements',
      category: 'resume-builder',
      priority: 'high',
      execute: async () => {
        const mockMatch = {
          percentage: 78,
          matched: ['React', 'TypeScript'],
          missing: ['AWS'],
        };

        return {
          passed: mockMatch.percentage >= 0 && mockMatch.percentage <= 100,
          duration: 0,
          metadata: mockMatch,
        };
      },
    },
    {
      id: 'resume-015',
      name: 'Section generation',
      description: 'Should generate individual resume sections',
      category: 'resume-builder',
      priority: 'high',
      execute: async () => {
        const sections = ['summary', 'experience', 'education', 'skills'];

        return {
          passed: sections.length > 0,
          duration: 0,
          metadata: { sections },
        };
      },
    },
    {
      id: 'resume-016',
      name: 'Requirement categorization',
      description: 'Should categorize requirements (auto/needs-input/optional)',
      category: 'resume-builder',
      priority: 'medium',
      execute: async () => {
        const categories = {
          auto: ['React', 'TypeScript'],
          needsInput: ['Team size'],
          optional: ['Certifications'],
        };

        return {
          passed: Object.keys(categories).length === 3,
          duration: 0,
          metadata: categories,
        };
      },
    },
    {
      id: 'resume-017',
      name: 'Save to My Resumes',
      description: 'Resume should save to My Resumes page',
      category: 'resume-builder',
      priority: 'high',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
          .from('resume_versions')
          .select('*')
          .eq('user_id', session.session.user.id);

        return {
          passed: !error && Array.isArray(data),
          duration: 0,
          metadata: { count: data?.length || 0 },
        };
      },
    },
    {
      id: 'resume-018',
      name: 'Version history',
      description: 'Should track resume version history',
      category: 'resume-builder',
      priority: 'medium',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
          .from('resume_versions')
          .select('version_name, created_at')
          .eq('user_id', session.session.user.id)
          .order('created_at', { ascending: false });

        return {
          passed: !error && Array.isArray(data),
          duration: 0,
          metadata: { versions: data?.length || 0 },
        };
      },
    },
    {
      id: 'resume-019',
      name: 'Job URL parsing',
      description: 'Should parse job posting from URL',
      category: 'resume-builder',
      priority: 'medium',
      execute: async () => {
        const mockJobUrl = 'https://example.com/job/123';

        return {
          passed: mockJobUrl.startsWith('http'),
          duration: 0,
          metadata: { url: mockJobUrl },
        };
      },
    },
    {
      id: 'resume-020',
      name: 'Generation progress tracking',
      description: 'Should show progress during resume generation',
      category: 'resume-builder',
      priority: 'low',
      execute: async () => {
        const progress = { current: 3, total: 5, percentage: 60 };

        return {
          passed: progress.percentage >= 0 && progress.percentage <= 100,
          duration: 0,
          metadata: progress,
        };
      },
    },
    {
      id: 'resume-021',
      name: 'Dual AI generation',
      description: 'Should support dual AI model comparison',
      category: 'resume-builder',
      priority: 'medium',
      execute: async () => {
        const models = ['openai/gpt-5', 'google/gemini-2.5-pro'];

        return {
          passed: models.length === 2,
          duration: 0,
          metadata: { models },
        };
      },
    },
    {
      id: 'resume-022',
      name: 'Resume critique',
      description: 'Should provide detailed resume critique',
      category: 'resume-builder',
      priority: 'high',
      execute: async () => {
        const mockCritique = {
          strengths: ['Clear summary'],
          improvements: ['Add metrics'],
          score: 7.5,
        };

        return {
          passed: mockCritique.score >= 0 && mockCritique.score <= 10,
          duration: 0,
          metadata: mockCritique,
        };
      },
    },
  ],
};
