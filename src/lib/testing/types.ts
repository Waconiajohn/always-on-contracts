export type TestStatus = 'passed' | 'failed' | 'skipped' | 'running';

export type TestCategory = 
  | 'authentication' 
  | 'career-vault'
  | 'master-resume'
  | 'job-search' 
  | 'resume-builder' 
  | 'linkedin' 
  | 'interview-prep' 
  | 'performance' 
  | 'data-persistence' 
  | 'edge-cases';

export interface TestResult {
  passed: boolean;
  duration: number;
  error?: string;
  errorStack?: string;
  screenshot?: string;
  consoleLogs?: string[];
  metadata?: Record<string, any>;
}

export interface Test {
  id: string;
  name: string;
  description?: string;
  category: TestCategory;
  priority: 'critical' | 'high' | 'medium' | 'low';
  execute: () => Promise<TestResult>;
  cleanup?: () => Promise<void>;
  dependencies?: string[];
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  category: TestCategory;
  tests: Test[];
}

export interface TestRunConfig {
  suites?: string[];
  categories?: TestCategory[];
  priorities?: ('critical' | 'high' | 'medium' | 'low')[];
  continueOnFailure?: boolean;
  parallel?: boolean;
  screenshot?: boolean;
  cleanup?: boolean;
}

export interface TestRunSummary {
  id: string;
  startedAt: Date;
  completedAt?: Date;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  suiteName?: string;
}
