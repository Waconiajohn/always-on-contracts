import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resume Builder Critical Path Tests
 *
 * These tests verify the integrity of the resume builder pipeline:
 * 1. Required files exist
 * 2. Edge functions are properly configured
 * 3. Type definitions are consistent
 */

describe('Resume Builder Infrastructure', () => {
  const projectRoot = path.join(__dirname, '..');
  const srcDir = path.join(projectRoot, 'src');
  const functionsDir = path.join(projectRoot, 'supabase', 'functions');

  describe('Required Files Exist', () => {
    const requiredFiles = [
      'src/pages/resume-builder/ResumeBuilderIndex.tsx',
      'src/pages/resume-builder/UploadPage.tsx',
      'src/pages/resume-builder/JDPage.tsx',
      'src/pages/resume-builder/TargetPage.tsx',
      'src/pages/resume-builder/ProcessingPage.tsx',
      'src/pages/resume-builder/ReportPage.tsx',
      'src/pages/resume-builder/FixPage.tsx',
      'src/pages/resume-builder/ReviewPage.tsx',
      'src/pages/resume-builder/ExportPage.tsx',
      'src/pages/resume-builder/InterviewPage.tsx',
      'src/hooks/useMasterResume.ts',
      'src/components/resume-builder/ResumeBuilderShell.tsx',
    ];

    requiredFiles.forEach(file => {
      it(`should have ${file}`, () => {
        const fullPath = path.join(projectRoot, file);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    });
  });

  describe('Resume Builder Edge Functions', () => {
    const requiredFunctions = [
      'rb-analyze-gaps',
      'rb-classify-jd',
      'rb-extract-jd-requirements',
      'rb-extract-resume-claims',
      'rb-generate-benchmark',
      'rb-generate-ideal-section',
      'rb-generate-personalized-section',
      'rb-interview-practice',
    ];

    requiredFunctions.forEach(funcName => {
      it(`should have edge function: ${funcName}`, () => {
        const funcDir = path.join(functionsDir, funcName);
        expect(fs.existsSync(funcDir)).toBe(true);

        const indexFile = path.join(funcDir, 'index.ts');
        expect(fs.existsSync(indexFile)).toBe(true);
      });
    });
  });

  describe('Edge Function Structure', () => {
    it('should have _shared directory with common utilities', () => {
      const sharedDir = path.join(functionsDir, '_shared');
      expect(fs.existsSync(sharedDir)).toBe(true);

      const requiredSharedFiles = [
        'ai-function-wrapper.ts',
        'lovable-ai-config.ts',
        'cost-tracking.ts',
        'logger.ts',
      ];

      requiredSharedFiles.forEach(file => {
        const filePath = path.join(sharedDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Hook Exports', () => {
    it('useMasterResume should export required functions', () => {
      const hookPath = path.join(srcDir, 'hooks', 'useMasterResume.ts');
      const content = fs.readFileSync(hookPath, 'utf-8');

      // Check for required exports
      expect(content).toContain('export function useMasterResume');
      expect(content).toContain('export function useMasterResumeHistory');

      // Check for required return values
      expect(content).toContain('masterResume');
      expect(content).toContain('isLoading');
      expect(content).toContain('createMasterResume');
      expect(content).toContain('updateMasterResume');
    });

    it('useMasterResume should have optimistic updates', () => {
      const hookPath = path.join(srcDir, 'hooks', 'useMasterResume.ts');
      const content = fs.readFileSync(hookPath, 'utf-8');

      // Check for optimistic update pattern
      expect(content).toContain('onMutate');
      expect(content).toContain('previousResume');
      expect(content).toContain('setQueryData');
    });
  });
});

describe('Resume Builder Types', () => {
  const projectRoot = path.join(__dirname, '..');
  const typesDir = path.join(projectRoot, 'src', 'types');

  it('should have master-resume types', () => {
    const typesPath = path.join(typesDir, 'master-resume.ts');

    if (fs.existsSync(typesPath)) {
      const content = fs.readFileSync(typesPath, 'utf-8');
      expect(content).toContain('MasterResume');
    }
  });
});

describe('Resume Builder Components', () => {
  const projectRoot = path.join(__dirname, '..');
  const componentsDir = path.join(projectRoot, 'src', 'components', 'resume-builder');

  it('should have ResumeBuilderShell component', () => {
    const shellPath = path.join(componentsDir, 'ResumeBuilderShell.tsx');
    expect(fs.existsSync(shellPath)).toBe(true);

    const content = fs.readFileSync(shellPath, 'utf-8');
    expect(content).toContain('ResumeBuilderShell');
  });

  it('should have InterviewPractice component with feedback', () => {
    const interviewPath = path.join(componentsDir, 'InterviewPractice.tsx');
    expect(fs.existsSync(interviewPath)).toBe(true);

    const content = fs.readFileSync(interviewPath, 'utf-8');
    // Check for feedback functionality
    expect(content).toContain('feedback');
    expect(content).toContain('evaluateAnswer');
    expect(content).toContain('validate-interview-response');
  });
});

describe('Error Handling', () => {
  const projectRoot = path.join(__dirname, '..');
  const srcDir = path.join(projectRoot, 'src');

  it('should have ErrorBoundary component', () => {
    const boundaryPath = path.join(srcDir, 'components', 'ErrorBoundary.tsx');
    expect(fs.existsSync(boundaryPath)).toBe(true);

    const content = fs.readFileSync(boundaryPath, 'utf-8');
    expect(content).toContain('ErrorBoundary');
    expect(content).toContain('componentDidCatch');
  });

  it('should have Sentry integration', () => {
    const sentryPath = path.join(srcDir, 'lib', 'sentry.ts');
    expect(fs.existsSync(sentryPath)).toBe(true);

    const content = fs.readFileSync(sentryPath, 'utf-8');
    expect(content).toContain('@sentry/react');
    expect(content).toContain('initSentry');
    expect(content).toContain('captureError');
  });

  it('ErrorBoundary should use Sentry', () => {
    const boundaryPath = path.join(srcDir, 'components', 'ErrorBoundary.tsx');
    const content = fs.readFileSync(boundaryPath, 'utf-8');

    expect(content).toContain('captureError');
  });
});

describe('Route Configuration', () => {
  const projectRoot = path.join(__dirname, '..');
  const appPath = path.join(projectRoot, 'src', 'App.tsx');

  it('should have resume builder routes', () => {
    const content = fs.readFileSync(appPath, 'utf-8');

    const requiredRoutes = [
      '/resume-builder',
      ':projectId/upload',
      ':projectId/jd',
      ':projectId/target',
      ':projectId/processing',
      ':projectId/report',
      ':projectId/fix',
      ':projectId/review',
      ':projectId/export',
      ':projectId/interview',
    ];

    requiredRoutes.forEach(route => {
      expect(content).toContain(route);
    });
  });

  it('should have protected routes for resume builder', () => {
    const content = fs.readFileSync(appPath, 'utf-8');

    // Check that resume builder routes use ProtectedRoute
    expect(content).toMatch(/ProtectedRoute.*ResumeBuilderIndex/s);
  });
});

describe('Performance Configuration', () => {
  const projectRoot = path.join(__dirname, '..');

  it('should have code splitting configuration', () => {
    const vitePath = path.join(projectRoot, 'vite.config.ts');
    const content = fs.readFileSync(vitePath, 'utf-8');

    expect(content).toContain('manualChunks');
    expect(content).toContain('react-vendor');
    expect(content).toContain('export');
  });

  it('should lazy load resume builder pages', () => {
    const appPath = path.join(projectRoot, 'src', 'App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');

    expect(content).toContain('lazy(() => import');
    expect(content).toContain('ResumeBuilderIndex');
  });
});
