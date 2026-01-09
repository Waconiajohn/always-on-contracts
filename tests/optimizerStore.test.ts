import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';

// Mock crypto.randomUUID before importing the store
vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-1234'
});

// We need to reset the store between tests
// Import the store factory to create fresh instances
import { useOptimizerStore } from '@/stores/optimizerStore';
import { STEP_ORDER } from '@/components/resume-optimizer/types';

describe('optimizerStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    const store = useOptimizerStore.getState();
    store.reset();
    
    // Clear localStorage to prevent persistence interference
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useOptimizerStore.getState();
      
      expect(state.resumeText).toBe('');
      expect(state.jobDescription).toBe('');
      expect(state.currentStep).toBe('gap-analysis');
      expect(state.isProcessing).toBe(false);
      expect(state.error).toBeNull();
      expect(state.sessionId).toBeNull();
      expect(state.lastSaved).toBeNull();
    });
  });

  describe('setInput', () => {
    it('should set resume text and job description', () => {
      const store = useOptimizerStore.getState();
      
      act(() => {
        store.setInput('My resume content', 'Job description here', 'Software Engineer', 'Acme Corp');
      });
      
      const state = useOptimizerStore.getState();
      expect(state.resumeText).toBe('My resume content');
      expect(state.jobDescription).toBe('Job description here');
      expect(state.jobTitle).toBe('Software Engineer');
      expect(state.company).toBe('Acme Corp');
      expect(state.sessionId).toBe('test-uuid-1234');
      expect(state.lastSaved).toBeTypeOf('number');
    });

    it('should preserve existing sessionId on subsequent calls', () => {
      const store = useOptimizerStore.getState();
      
      act(() => {
        store.setInput('Resume 1', 'JD 1');
      });
      
      const firstSessionId = useOptimizerStore.getState().sessionId;
      
      act(() => {
        store.setInput('Resume 2', 'JD 2');
      });
      
      expect(useOptimizerStore.getState().sessionId).toBe(firstSessionId);
    });
  });

  describe('step navigation', () => {
    it('should navigate to next step', () => {
      const store = useOptimizerStore.getState();
      expect(store.currentStep).toBe('gap-analysis');
      
      act(() => {
        store.goToNextStep();
      });
      
      expect(useOptimizerStore.getState().currentStep).toBe('proof-collector');
    });

    it('should navigate to previous step', () => {
      const store = useOptimizerStore.getState();
      
      act(() => {
        store.setStep('customization');
      });
      
      act(() => {
        store.goToPrevStep();
      });
      
      expect(useOptimizerStore.getState().currentStep).toBe('proof-collector');
    });

    it('should not go past first step', () => {
      const store = useOptimizerStore.getState();
      expect(store.currentStep).toBe('gap-analysis');
      
      act(() => {
        store.goToPrevStep();
      });
      
      expect(useOptimizerStore.getState().currentStep).toBe('gap-analysis');
    });

    it('should not go past last step', () => {
      const store = useOptimizerStore.getState();
      
      // Go to last step
      act(() => {
        store.setStep('hiring-manager');
      });
      
      act(() => {
        store.goToNextStep();
      });
      
      expect(useOptimizerStore.getState().currentStep).toBe('hiring-manager');
    });

    it('should allow direct navigation to any step', () => {
      const store = useOptimizerStore.getState();
      
      act(() => {
        store.goToStep('strategic-versions');
      });
      
      expect(useOptimizerStore.getState().currentStep).toBe('strategic-versions');
    });
  });

  describe('missing bullet responses', () => {
    it('should add missing bullet response', () => {
      const store = useOptimizerStore.getState();
      
      act(() => {
        store.addMissingBulletResponse('bullet-1', 'My response about leadership');
      });
      
      const state = useOptimizerStore.getState();
      expect(state.missingBulletResponses['bullet-1']).toBe('My response about leadership');
    });

    it('should accumulate multiple responses', () => {
      const store = useOptimizerStore.getState();
      
      act(() => {
        store.addMissingBulletResponse('bullet-1', 'Response 1');
        store.addMissingBulletResponse('bullet-2', 'Response 2');
      });
      
      const state = useOptimizerStore.getState();
      expect(Object.keys(state.missingBulletResponses)).toHaveLength(2);
    });

    it('should clear all responses', () => {
      const store = useOptimizerStore.getState();
      
      act(() => {
        store.addMissingBulletResponse('bullet-1', 'Response 1');
        store.clearMissingBulletResponses();
      });
      
      expect(useOptimizerStore.getState().missingBulletResponses).toEqual({});
    });
  });

  describe('processing state', () => {
    it('should set processing state with message', () => {
      const store = useOptimizerStore.getState();
      
      act(() => {
        store.setProcessing(true, 'Analyzing resume...');
      });
      
      const state = useOptimizerStore.getState();
      expect(state.isProcessing).toBe(true);
      expect(state.processingMessage).toBe('Analyzing resume...');
    });

    it('should clear processing state', () => {
      const store = useOptimizerStore.getState();
      
      act(() => {
        store.setProcessing(true, 'Working...');
        store.setProcessing(false);
      });
      
      const state = useOptimizerStore.getState();
      expect(state.isProcessing).toBe(false);
      expect(state.processingMessage).toBe('');
    });
  });

  describe('error handling', () => {
    it('should set and clear errors', () => {
      const store = useOptimizerStore.getState();
      
      act(() => {
        store.setError('Something went wrong');
      });
      
      expect(useOptimizerStore.getState().error).toBe('Something went wrong');
      
      act(() => {
        store.setError(null);
      });
      
      expect(useOptimizerStore.getState().error).toBeNull();
    });
  });

  describe('version history', () => {
    it('should add version history entry', () => {
      const store = useOptimizerStore.getState();
      
      act(() => {
        store.addVersionHistory({
          stepCompleted: 'gap-analysis',
          label: 'Completed fit analysis'
        });
      });
      
      const state = useOptimizerStore.getState();
      expect(state.versionHistory).toHaveLength(1);
      expect(state.versionHistory[0].label).toBe('Completed fit analysis');
      expect(state.versionHistory[0].id).toBe('test-uuid-1234');
    });

    it('should limit history to MAX_VERSION_HISTORY entries', () => {
      const store = useOptimizerStore.getState();
      
      // Add 25 entries (more than the 20 limit)
      act(() => {
        for (let i = 0; i < 25; i++) {
          store.addVersionHistory({
            stepCompleted: 'gap-analysis',
            label: `Entry ${i}`
          });
        }
      });
      
      const state = useOptimizerStore.getState();
      // Should be capped at 20
      expect(state.versionHistory.length).toBeLessThanOrEqual(20);
    });
  });

  describe('session management', () => {
    it('should report no active session when empty', () => {
      const store = useOptimizerStore.getState();
      expect(store.hasActiveSession()).toBe(false);
    });

    it('should report active session after input', () => {
      const store = useOptimizerStore.getState();
      
      act(() => {
        store.setInput('Resume', 'Job Description');
      });
      
      expect(useOptimizerStore.getState().hasActiveSession()).toBe(true);
    });

    it('should clear session', () => {
      const store = useOptimizerStore.getState();
      
      act(() => {
        store.setInput('Resume', 'Job Description');
        store.clearSession();
      });
      
      const state = useOptimizerStore.getState();
      expect(state.resumeText).toBe('');
      expect(state.sessionId).toBeNull();
      expect(state.hasActiveSession()).toBe(false);
    });

    it('should format session age correctly', () => {
      const store = useOptimizerStore.getState();
      
      act(() => {
        store.setInput('Resume', 'JD');
      });
      
      const age = useOptimizerStore.getState().getSessionAge();
      expect(age).toMatch(/\d+m ago/); // Should be something like "0m ago"
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const store = useOptimizerStore.getState();
      
      act(() => {
        store.setInput('Resume', 'JD', 'Title', 'Company');
        store.setStep('customization');
        store.setProcessing(true, 'Working');
        store.setError('Error');
      });
      
      act(() => {
        store.reset();
      });
      
      const state = useOptimizerStore.getState();
      expect(state.resumeText).toBe('');
      expect(state.jobDescription).toBe('');
      expect(state.currentStep).toBe('gap-analysis');
      expect(state.isProcessing).toBe(false);
      expect(state.error).toBeNull();
      expect(state.sessionId).toBeNull();
    });
  });

  describe('customization', () => {
    it('should set customization settings', () => {
      const store = useOptimizerStore.getState();
      
      const customization = {
        intensity: 'aggressive' as const,
        tone: 'executive' as const,
        preserveVoice: true,
        targetLength: 'two-page' as const
      };
      
      act(() => {
        store.setCustomization(customization);
      });
      
      expect(useOptimizerStore.getState().customization).toEqual(customization);
    });
  });

  describe('benchmark resume', () => {
    it('should set benchmark resume', () => {
      const store = useOptimizerStore.getState();
      
      const benchmarkResume = {
        headerInfo: {
          name: 'John Doe',
          title: 'Software Engineer'
        },
        sections: [
          {
            id: 'summary',
            title: 'Professional Summary',
            type: 'summary' as const,
            content: ['Experienced engineer...'],
            evidenceIds: ['E1'],
            requirementIds: ['R1']
          }
        ],
        atsScore: 85,
        fitScore: 90,
        competitivenessScore: 88
      };
      
      act(() => {
        store.setBenchmarkResume(benchmarkResume);
      });
      
      expect(useOptimizerStore.getState().benchmarkResume).toEqual(benchmarkResume);
    });

    it('should update benchmark section', () => {
      const store = useOptimizerStore.getState();
      
      act(() => {
        store.setBenchmarkResume({
          headerInfo: { name: 'Test' },
          sections: [
            { id: 'sec-1', title: 'Summary', type: 'summary', content: ['Original'], evidenceIds: [], requirementIds: [] }
          ],
          atsScore: 80,
          fitScore: 80,
          competitivenessScore: 80
        });
      });
      
      act(() => {
        store.updateBenchmarkSection('sec-1', ['Updated content']);
      });
      
      const state = useOptimizerStore.getState();
      expect(state.benchmarkResume?.sections[0].content).toEqual(['Updated content']);
      expect(state.benchmarkResume?.sections[0].isEdited).toBe(true);
    });
  });
});
