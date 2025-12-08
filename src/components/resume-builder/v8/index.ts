/**
 * V8 Resume Builder - State-of-the-art evidence-first resume builder
 * 
 * Public exports for the V8 Resume Builder module.
 */

// Main component
export { default as ResumeBuilderV8 } from './ResumeBuilderV8';

// Types
export * from './types';

// Hooks
export { useResumeBuilderState } from './hooks/useResumeBuilderState';
export { useSessionPersistence } from './hooks/useSessionPersistence';

// Utils
export * from './utils/exportResume';
