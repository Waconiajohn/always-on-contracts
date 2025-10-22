import { supabase } from '@/integrations/supabase/client';
import { Test, TestResult, TestSuite, TestRunConfig, TestRunSummary } from './types';
import { TestDataGenerator } from './testDataGenerator';
import { logger } from '@/lib/logger';

export class TestExecutor {
  private testRunId?: string;
  private dataGenerator?: TestDataGenerator;
  private consoleLogs: string[] = [];

  constructor() {
    this.setupConsoleCapture();
  }

  private setupConsoleCapture() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      this.consoleLogs.push(`[LOG] ${args.join(' ')}`);
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      this.consoleLogs.push(`[ERROR] ${args.join(' ')}`);
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      this.consoleLogs.push(`[WARN] ${args.join(' ')}`);
      originalWarn.apply(console, args);
    };
  }

  async executeSuite(
    suite: TestSuite,
    config: TestRunConfig = {}
  ): Promise<TestRunSummary> {
    const startTime = Date.now();
    logger.info(`Starting test suite: ${suite.name}`);

    const { data: session } = await supabase.auth.getSession();
    // Allow authentication tests to run without existing session
    if (!session.session && suite.category !== 'authentication') {
      throw new Error('User must be authenticated');
    }

    const { data: testRun, error: runError } = await supabase
      .from('test_runs')
      .insert({
        user_id: session.session?.user.id || 'anonymous',
        test_suite_name: suite.name,
        total_tests: suite.tests.length,
      })
      .select()
      .single();

    if (runError) throw runError;
    this.testRunId = testRun.id;
    this.dataGenerator = new TestDataGenerator(this.testRunId);

    const results: TestRunSummary = {
      id: this.testRunId,
      startedAt: new Date(testRun.started_at),
      totalTests: suite.tests.length,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      duration: 0,
      suiteName: suite.name,
    };

    for (const test of suite.tests) {
      if (!config.continueOnFailure && results.failedTests > 0) {
        results.skippedTests++;
        await this.recordTestResult(test, {
          passed: false,
          duration: 0,
          error: 'Skipped due to previous failure',
        });
        continue;
      }

      logger.info(`Executing test: ${test.name}`);
      const testResult = await this.executeTest(test, config);
      
      if (testResult.passed) {
        results.passedTests++;
      } else {
        results.failedTests++;
      }

      await this.recordTestResult(test, testResult);

      if (test.cleanup && config.cleanup !== false) {
        try {
          await test.cleanup();
        } catch (error) {
          logger.error(`Cleanup failed for test ${test.id}:`, error);
        }
      }
    }

    if (this.dataGenerator && config.cleanup !== false) {
      await this.dataGenerator.cleanup();
    }

    const duration = Date.now() - startTime;
    results.duration = duration;
    results.completedAt = new Date();

    await supabase
      .from('test_runs')
      .update({
        completed_at: new Date().toISOString(),
        passed_tests: results.passedTests,
        failed_tests: results.failedTests,
        skipped_tests: results.skippedTests,
        duration_ms: duration,
      })
      .eq('id', this.testRunId);

    logger.info(`Test suite completed: ${suite.name}`);
    return results;
  }

  private async executeTest(test: Test, config: TestRunConfig): Promise<TestResult> {
    const startTime = Date.now();
    this.consoleLogs = [];

    try {
      const result = await test.execute();
      result.duration = Date.now() - startTime;
      result.consoleLogs = [...this.consoleLogs];

      if (config.screenshot && !result.passed) {
        result.screenshot = await this.captureScreenshot();
      }

      return result;
    } catch (error: any) {
      return {
        passed: false,
        duration: Date.now() - startTime,
        error: error.message || 'Unknown error',
        errorStack: error.stack,
        consoleLogs: [...this.consoleLogs],
      };
    }
  }

  private async recordTestResult(test: Test, result: TestResult) {
    if (!this.testRunId) return;

    await supabase.from('test_results').insert({
      test_run_id: this.testRunId,
      test_id: test.id,
      test_name: test.name,
      category: test.category,
      status: result.passed ? 'passed' : 'failed',
      duration_ms: result.duration,
      error_message: result.error,
      error_stack: result.errorStack,
      screenshot_url: result.screenshot,
      console_logs: result.consoleLogs || [],
      metadata: result.metadata || {},
    });
  }

  private async captureScreenshot(): Promise<string | undefined> {
    return undefined;
  }

  getDataGenerator(): TestDataGenerator | undefined {
    return this.dataGenerator;
  }
}
