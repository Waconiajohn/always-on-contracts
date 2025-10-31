import { supabase } from '@/integrations/supabase/client';
import { TestSuite } from '../types';

export const resumeBuilderSuite: TestSuite = {
  id: 'resume-builder-suite',
  name: 'Resume Builder & Versions',
  description: 'Tests for resume generation, versions, analysis, and templates',
  category: 'resume-builder',
  tests: [
    {
      id: 'resume-001',
      name: 'Resume versions accessible',
      description: 'User should be able to access resume versions',
      category: 'resume-builder',
      priority: 'critical',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('resume_versions')
            .select('id, version_name, created_at')
            .eq('user_id', session.session.user.id)
            .limit(20);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              versionsCount: data?.length || 0,
              hasVersions: (data?.length || 0) > 0,
            },
          };
        } catch (error: any) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error.message,
          };
        }
      },
    },
    {
      id: 'resume-002',
      name: 'Resume uploads',
      description: 'Users can upload resumes',
      category: 'resume-builder',
      priority: 'critical',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('resumes')
            .select('id, file_name, created_at')
            .eq('user_id', session.session.user.id)
            .limit(10);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              uploadedResumes: data?.length || 0,
            },
          };
        } catch (error: any) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error.message,
          };
        }
      },
    },
    {
      id: 'resume-003',
      name: 'Resume analysis',
      description: 'Resume analysis data should be stored',
      category: 'resume-builder',
      priority: 'high',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('resume_analysis')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(10);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              analysesCount: data?.length || 0,
            },
          };
        } catch (error: any) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error.message,
          };
        }
      },
    },
    {
      id: 'resume-004',
      name: 'Resume templates',
      description: 'Resume templates should be available',
      category: 'resume-builder',
      priority: 'medium',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data, error } = await supabase
            .from('resume_templates')
            .select('id, name, category')
            .limit(20);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              templatesAvailable: data?.length || 0,
            },
          };
        } catch (error: any) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error.message,
          };
        }
      },
    },
    {
      id: 'resume-005',
      name: 'Resume cache',
      description: 'Resume cache should work for performance',
      category: 'resume-builder',
      priority: 'medium',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data, error } = await supabase
            .from('resume_cache')
            .select('*')
            .limit(10);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              cachedItems: data?.length || 0,
            },
          };
        } catch (error: any) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error.message,
          };
        }
      },
    },
    {
      id: 'resume-006',
      name: 'Resume processing queue',
      description: 'Resume processing should be queued',
      category: 'resume-builder',
      priority: 'medium',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('resume_processing_queue')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(10);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              queuedItems: data?.length || 0,
            },
          };
        } catch (error: any) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error.message,
          };
        }
      },
    },
    {
      id: 'resume-007',
      name: 'Resume generation analytics',
      description: 'Resume generation should be tracked',
      category: 'resume-builder',
      priority: 'low',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('resume_generation_analytics')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(10);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              analyticsRecords: data?.length || 0,
            },
          };
        } catch (error: any) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error.message,
          };
        }
      },
    },
    {
      id: 'resume-008',
      name: 'Vault resume milestones',
      description: 'Resume milestones should be extracted to vault',
      category: 'resume-builder',
      priority: 'high',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data: vault } = await supabase
            .from('career_vault')
            .select('id')
            .eq('user_id', session.session.user.id)
            .single();

          if (!vault) {
            return {
              passed: true,
              duration: Date.now() - startTime,
              metadata: { note: 'No vault' },
            };
          }

          const { data, error } = await supabase
            .from('vault_resume_milestones')
            .select('*')
            .eq('vault_id', vault.id)
            .limit(10);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              milestones: data?.length || 0,
            },
          };
        } catch (error: any) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error.message,
          };
        }
      },
    },
  ],
};
