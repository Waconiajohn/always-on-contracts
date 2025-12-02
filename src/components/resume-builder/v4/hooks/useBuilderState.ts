/**
 * useBuilderState - Central State Management Hook
 * 
 * Single source of truth for the entire resume builder.
 * Features:
 * - Pure view components (receive state + callbacks)
 * - Job isolation (reset when JD changes)
 * - LocalStorage persistence
 * - Final resume reconstruction
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { 
  BulletSuggestion, 
  RoleData, 
  GapAnalysis, 
  JobBlueprint,
  BuilderStep,
  BulletStatus
} from '../types/builderV2Types';
import type { FinalResume, FinalResumeRole } from '../config/resumeExport';

// ============================================================================
// STATE TYPES
// ============================================================================

export interface BulletStoreEntry {
  bulletId: string;
  status: BulletStatus;
  finalText: string;          // What goes in export
  originalText?: string;      // User's original (if exists)
  aiSuggestedText: string;    // AI version
  sectionId: string;          // 'highlights' | 'role_[id]'
  gapId?: string;             // Which gap this addresses
}

export interface BuilderStateData {
  // Step management
  currentStep: BuilderStep;
  
  // Job context
  jobId: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  
  // AI analysis results
  jobBlueprint: JobBlueprint | null;
  gaps: GapAnalysis[];
  
  // Scores
  initialScore: number;
  currentScore: number;
  projectedScore: number;
  scoreBreakdown: {
    atsMatch: number;
    requirementsCoverage: number;
    competitiveStrength: number;
  };
  
  // Content sections
  summary: {
    originalText: string;
    suggestedText: string;
    finalText: string;
    status: BulletStatus;
  } | null;
  
  // Central bullet store
  bulletStore: Map<string, BulletStoreEntry>;
  
  // Role order (for experience section)
  roleOrder: string[];
  roleData: Map<string, RoleData>;
  
  // Skills
  existingSkills: string[];
  suggestedSkills: Array<{
    skill: string;
    reason: string;
    source: string;
    status: 'pending' | 'accepted' | 'rejected';
  }>;
  
  // Metadata
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

export interface UseBuilderStateOptions {
  jobDescription: string;
  jobTitle: string;
  companyName?: string;
  initialData?: Partial<BuilderStateData>;
  persistKey?: string;
  onAutoSave?: (state: BuilderStateData) => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Storage version for migration management
 * Increment this when the data format changes
 */
const STORAGE_VERSION = 2;

/**
 * Valid gap types according to GAP_TYPE_INFO mapping
 */
const VALID_GAP_TYPES = new Set([
  'missing_skill_or_tool',
  'weak_achievement_story',
  'missing_metrics_or_scope',
  'missing_domain_experience',
  'unclear_level_or_seniority',
  'positioning_issue'
]);

/**
 * Generate a hash for job description to detect changes
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * Create initial state
 */
function createInitialState(options: UseBuilderStateOptions): BuilderStateData {
  return {
    currentStep: 1,
    jobId: hashString(options.jobDescription),
    jobTitle: options.jobTitle,
    companyName: options.companyName || '',
    jobDescription: options.jobDescription,
    jobBlueprint: null,
    gaps: [],
    initialScore: 0,
    currentScore: 0,
    projectedScore: 0,
    scoreBreakdown: {
      atsMatch: 0,
      requirementsCoverage: 0,
      competitiveStrength: 0,
    },
    summary: null,
    bulletStore: new Map(),
    roleOrder: [],
    roleData: new Map(),
    existingSkills: [],
    suggestedSkills: [],
    lastSaved: null,
    hasUnsavedChanges: false,
    ...options.initialData,
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useBuilderState(options: UseBuilderStateOptions) {
  const [state, setState] = useState<BuilderStateData>(() => {
    // Try to restore from localStorage
    if (options.persistKey) {
      try {
        const saved = localStorage.getItem(options.persistKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          
          // Check storage version - clear if outdated
          if (!parsed._version || parsed._version < STORAGE_VERSION) {
            console.warn(`Clearing outdated builder state (v${parsed._version || 0} < v${STORAGE_VERSION})`);
            localStorage.removeItem(options.persistKey);
            return createInitialState(options);
          }
          
          // Check if same job
          if (parsed.jobId === hashString(options.jobDescription)) {
            // Validate and fix gaps
            const validatedGaps = (parsed.gaps || []).map((gap: GapAnalysis) => ({
              ...gap,
              gapType: VALID_GAP_TYPES.has(gap.gapType) ? gap.gapType : 'positioning_issue'
            }));
            
            return {
              ...parsed,
              gaps: validatedGaps,
              bulletStore: new Map(Object.entries(parsed.bulletStore || {})),
              roleData: new Map(Object.entries(parsed.roleData || {})),
            };
          }
        }
      } catch (e) {
        console.warn('Failed to restore builder state:', e);
      }
    }
    return createInitialState(options);
  });

  const [showJobChangeWarning, setShowJobChangeWarning] = useState(false);

  // ========================================================================
  // JOB CHANGE DETECTION
  // ========================================================================
  
  useEffect(() => {
    const newJobId = hashString(options.jobDescription);
    if (state.jobId !== newJobId && state.bulletStore.size > 0) {
      setShowJobChangeWarning(true);
    }
  }, [options.jobDescription, state.jobId, state.bulletStore.size]);

  const confirmJobChange = useCallback(() => {
    setState(createInitialState(options));
    setShowJobChangeWarning(false);
  }, [options]);

  const cancelJobChange = useCallback(() => {
    setShowJobChangeWarning(false);
  }, []);

  // ========================================================================
  // PERSISTENCE
  // ========================================================================

  useEffect(() => {
    if (options.persistKey && state.hasUnsavedChanges) {
      const timer = setTimeout(() => {
        const serializable = {
          ...state,
          _version: STORAGE_VERSION,
          bulletStore: Object.fromEntries(state.bulletStore),
          roleData: Object.fromEntries(state.roleData),
          lastSaved: new Date().toISOString(),
        };
        localStorage.setItem(options.persistKey!, JSON.stringify(serializable));
        setState(prev => ({ ...prev, lastSaved: new Date(), hasUnsavedChanges: false }));
        options.onAutoSave?.(state);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state, options.persistKey, options.onAutoSave]);

  // ========================================================================
  // STEP NAVIGATION
  // ========================================================================

  const goToStep = useCallback((step: BuilderStep) => {
    setState(prev => ({ ...prev, currentStep: step, hasUnsavedChanges: true }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.min(5, prev.currentStep + 1) as BuilderStep,
      hasUnsavedChanges: true,
    }));
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(1, prev.currentStep - 1) as BuilderStep,
      hasUnsavedChanges: true,
    }));
  }, []);

  // ========================================================================
  // BULLET MANAGEMENT
  // ========================================================================

  const updateBullet = useCallback((
    bulletId: string,
    status: BulletStatus,
    finalText?: string
  ) => {
    setState(prev => {
      const newStore = new Map(prev.bulletStore);
      const existing = newStore.get(bulletId);
      if (existing) {
        newStore.set(bulletId, {
          ...existing,
          status,
          finalText: finalText ?? (status === 'accepted' ? existing.aiSuggestedText : existing.originalText || existing.aiSuggestedText),
        });
      }
      return { ...prev, bulletStore: newStore, hasUnsavedChanges: true };
    });
  }, []);

  const acceptBullet = useCallback((bulletId: string) => {
    updateBullet(bulletId, 'accepted');
  }, [updateBullet]);

  const rejectBullet = useCallback((bulletId: string) => {
    updateBullet(bulletId, 'rejected');
  }, [updateBullet]);

  const editBullet = useCallback((bulletId: string, newText: string) => {
    updateBullet(bulletId, 'edited', newText);
  }, [updateBullet]);

  const useOriginal = useCallback((bulletId: string) => {
    setState(prev => {
      const newStore = new Map(prev.bulletStore);
      const existing = newStore.get(bulletId);
      if (existing && existing.originalText) {
        newStore.set(bulletId, {
          ...existing,
          status: 'accepted',
          finalText: existing.originalText,
        });
      }
      return { ...prev, bulletStore: newStore, hasUnsavedChanges: true };
    });
  }, []);

  const approveAllHighConfidence = useCallback((_sectionId: string, suggestions: BulletSuggestion[]) => {
    setState(prev => {
      const newStore = new Map(prev.bulletStore);
      suggestions
        .filter(s => s.confidence === 'high' && s.status === 'pending')
        .forEach(s => {
          const existing = newStore.get(s.id);
          if (existing) {
            newStore.set(s.id, { ...existing, status: 'accepted', finalText: existing.aiSuggestedText });
          }
        });
      return { ...prev, bulletStore: newStore, hasUnsavedChanges: true };
    });
  }, []);

  // ========================================================================
  // INITIALIZE BULLETS FROM SUGGESTIONS
  // ========================================================================

  const initializeBullets = useCallback((
    sectionId: string,
    suggestions: BulletSuggestion[]
  ) => {
    setState(prev => {
      const newStore = new Map(prev.bulletStore);
      suggestions.forEach(s => {
        if (!newStore.has(s.id)) {
          newStore.set(s.id, {
            bulletId: s.id,
            status: 'pending',
            finalText: s.suggestedText,
            originalText: s.originalText,
            aiSuggestedText: s.suggestedText,
            sectionId,
            gapId: s.gapId,
          });
        }
      });
      return { ...prev, bulletStore: newStore };
    });
  }, []);

  // ========================================================================
  // SKILLS MANAGEMENT
  // ========================================================================

  const acceptSkill = useCallback((skill: string) => {
    setState(prev => ({
      ...prev,
      suggestedSkills: prev.suggestedSkills.map(s =>
        s.skill === skill ? { ...s, status: 'accepted' as const } : s
      ),
      hasUnsavedChanges: true,
    }));
  }, []);

  const rejectSkill = useCallback((skill: string) => {
    setState(prev => ({
      ...prev,
      suggestedSkills: prev.suggestedSkills.map(s =>
        s.skill === skill ? { ...s, status: 'rejected' as const } : s
      ),
      hasUnsavedChanges: true,
    }));
  }, []);

  const addCustomSkill = useCallback((skill: string) => {
    setState(prev => ({
      ...prev,
      existingSkills: [...prev.existingSkills, skill],
      hasUnsavedChanges: true,
    }));
  }, []);

  // ========================================================================
  // SET DATA (from AI)
  // ========================================================================

  const setJobBlueprint = useCallback((blueprint: JobBlueprint) => {
    setState(prev => ({ ...prev, jobBlueprint: blueprint, hasUnsavedChanges: true }));
  }, []);

  const setGaps = useCallback((gaps: GapAnalysis[]) => {
    setState(prev => ({ ...prev, gaps, hasUnsavedChanges: true }));
  }, []);

  const setScores = useCallback((scores: Partial<Pick<BuilderStateData, 'initialScore' | 'currentScore' | 'projectedScore' | 'scoreBreakdown'>>) => {
    setState(prev => ({ ...prev, ...scores, hasUnsavedChanges: true }));
  }, []);

  const setRoles = useCallback((roles: RoleData[]) => {
    setState(prev => {
      const roleData = new Map(roles.map(r => [r.id, r]));
      const roleOrder = roles.map(r => r.id);
      return { ...prev, roleData, roleOrder, hasUnsavedChanges: true };
    });
  }, []);

  const setSkillsData = useCallback((existing: string[], suggested: BuilderStateData['suggestedSkills']) => {
    setState(prev => ({
      ...prev,
      existingSkills: existing,
      suggestedSkills: suggested,
      hasUnsavedChanges: true,
    }));
  }, []);

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================

  const getBulletsForSection = useCallback((sectionId: string): BulletStoreEntry[] => {
    return Array.from(state.bulletStore.values())
      .filter(b => b.sectionId === sectionId);
  }, [state.bulletStore]);

  const getAcceptedBulletsForSection = useCallback((sectionId: string): string[] => {
    return Array.from(state.bulletStore.values())
      .filter(b => b.sectionId === sectionId && (b.status === 'accepted' || b.status === 'edited'))
      .map(b => b.finalText);
  }, [state.bulletStore]);

  const getSectionProgress = useCallback((sectionId: string) => {
    const bullets = getBulletsForSection(sectionId);
    return {
      total: bullets.length,
      accepted: bullets.filter(b => b.status === 'accepted' || b.status === 'edited').length,
      pending: bullets.filter(b => b.status === 'pending').length,
      rejected: bullets.filter(b => b.status === 'rejected').length,
    };
  }, [getBulletsForSection]);

  const resolvedGapIds = useMemo(() => {
    const acceptedBullets = Array.from(state.bulletStore.values())
      .filter(b => b.status === 'accepted' || b.status === 'edited');
    return new Set(acceptedBullets.map(b => b.gapId).filter(Boolean));
  }, [state.bulletStore]);

  const gapStatus = useMemo(() => {
    const critical = state.gaps.filter(g => g.severity === 'critical');
    const important = state.gaps.filter(g => g.severity === 'important');
    return {
      criticalTotal: critical.length,
      criticalResolved: critical.filter(g => resolvedGapIds.has(g.id)).length,
      importantTotal: important.length,
      importantResolved: important.filter(g => resolvedGapIds.has(g.id)).length,
    };
  }, [state.gaps, resolvedGapIds]);

  // ========================================================================
  // FINAL RESUME RECONSTRUCTION
  // ========================================================================

  const reconstructFinalResume = useCallback((): FinalResume => {
    const highlights = getAcceptedBulletsForSection('highlights');
    
    const experience: FinalResumeRole[] = state.roleOrder
      .map(roleId => {
        const role = state.roleData.get(roleId);
        if (!role) return null;
        const bullets = getAcceptedBulletsForSection(`role_${roleId}`);
        if (bullets.length === 0) return null;
        return {
          company: role.company,
          title: role.title,
          startDate: role.startDate,
          endDate: role.endDate,
          isCurrent: role.isCurrent,
          bullets,
        };
      })
      .filter((r): r is FinalResumeRole => r !== null);

    const skills = [
      ...state.existingSkills,
      ...state.suggestedSkills.filter(s => s.status === 'accepted').map(s => s.skill),
    ];

    return {
      summary: state.summary?.finalText || '',
      highlights,
      experience,
      skills,
      metadata: {
        targetJobTitle: state.jobTitle,
        targetCompany: state.companyName || undefined,
        generatedAt: new Date(),
        initialScore: state.initialScore,
        finalScore: state.currentScore,
        gapsResolved: {
          critical: gapStatus.criticalResolved,
          criticalTotal: gapStatus.criticalTotal,
          important: gapStatus.importantResolved,
          importantTotal: gapStatus.importantTotal,
        },
        jobId: state.jobId,
      },
    };
  }, [state, getAcceptedBulletsForSection, gapStatus]);

  // ========================================================================
  // RETURN
  // ========================================================================

  return {
    // State
    state,
    showJobChangeWarning,
    
    // Navigation
    goToStep,
    nextStep,
    prevStep,
    
    // Bullet actions
    updateBullet,
    acceptBullet,
    rejectBullet,
    editBullet,
    useOriginal,
    approveAllHighConfidence,
    initializeBullets,
    
    // Skills
    acceptSkill,
    rejectSkill,
    addCustomSkill,
    
    // Data setters
    setJobBlueprint,
    setGaps,
    setScores,
    setRoles,
    setSkillsData,
    
    // Computed
    getBulletsForSection,
    getAcceptedBulletsForSection,
    getSectionProgress,
    resolvedGapIds,
    gapStatus,
    
    // Export
    reconstructFinalResume,
    
    // Job change
    confirmJobChange,
    cancelJobChange,
  };
}

export type BuilderStateHook = ReturnType<typeof useBuilderState>;
