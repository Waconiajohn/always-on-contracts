import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Activity,
  FileText,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { TestExecutor } from '@/lib/testing/testExecutor';
import { TestRunSummary } from '@/lib/testing/types';
import { 
  authenticationSuite, 
  careerVaultSuite,
  jobSearchSuite,
  resumeBuilderSuite,
  linkedInSuite,
  interviewPrepSuite,
  performanceSuite,
  dataPersistenceSuite,
  edgeCasesSuite,
  careerVault2Suite,
  smokeTestSuite,
} from '@/lib/testing/suites';
import { toast } from 'sonner';
import { TestResultsReport } from '@/components/testing/TestResultsReport';
import { BugTracker } from '@/components/testing/BugTracker';
import { DeploymentSignoff } from '@/components/testing/DeploymentSignoff';
import { TestingGuide } from '@/components/testing/TestingGuide';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TestingDashboard() {
  const [loading, setLoading] = useState(false);
  const [currentRun, setCurrentRun] = useState<TestRunSummary | null>(null);
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [runningTest, setRunningTest] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  // Priority test suites for Career Vault 2.0
  const prioritySuites = [
    smokeTestSuite,
    careerVault2Suite,
  ];

  // Other functional test suites (exclude auth as it interferes with active sessions)
  const allSuites = [
    careerVaultSuite,
    jobSearchSuite,
    resumeBuilderSuite,
    linkedInSuite,
    interviewPrepSuite,
    performanceSuite,
    dataPersistenceSuite,
    edgeCasesSuite,
  ];

  // Keep auth suite separate with warning
  const dangerousSuites = [authenticationSuite];

  useEffect(() => {
    loadTestHistory();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUserEmail(session?.user?.email || null);
    setSessionLoaded(true);
  };

  const loadTestHistory = async () => {
    const { data } = await supabase
      .from('test_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);

    setTestHistory(data || []);
  };

  const runTests = async (suiteName?: string) => {
    // Check auth before running
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('You must be logged in to run tests. Please refresh the page and try again.');
      return;
    }

    setLoading(true);
    setRunningTest(suiteName || 'All Tests');
    const executor = new TestExecutor();

    try {
      const suitesToRun = suiteName
        ? [...prioritySuites, ...allSuites].filter((s) => s.id === suiteName)
        : [...prioritySuites, ...allSuites];

      for (const suite of suitesToRun) {
        toast.info(`Running test suite: ${suite.name}`);
        const summary = await executor.executeSuite(suite, {
          continueOnFailure: true,
          screenshot: true,
          cleanup: true,
        });

        setCurrentRun(summary);
        
        if (summary.failedTests === 0) {
          toast.success(`✅ ${suite.name} - All tests passed!`);
        } else {
          toast.error(`❌ ${suite.name} - ${summary.failedTests} test(s) failed`);
        }
      }

      await loadTestHistory();
    } catch (error: any) {
      console.error('Test execution failed:', error);
      toast.error(`Test execution failed: ${error.message}`);
    } finally {
      setLoading(false);
      setRunningTest('');
    }
  };

  const calculateOverallStats = () => {
    if (!testHistory.length) return null;

    const latest = testHistory[0];
    const passRate = latest.total_tests > 0
      ? (latest.passed_tests / latest.total_tests) * 100
      : 0;

    return {
      total: latest.total_tests,
      passed: latest.passed_tests,
      failed: latest.failed_tests,
      skipped: latest.skipped_tests,
      passRate,
      duration: latest.duration_ms,
    };
  };

  const stats = calculateOverallStats();

  return (
    <div className="container mx-auto p-8 space-y-6">
      <Tabs defaultValue="guide" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="guide">Deployment Guide</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="bugs">Bug Tracker</TabsTrigger>
          <TabsTrigger value="signoff">Sign-Off</TabsTrigger>
        </TabsList>

        <TabsContent value="guide" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Deployment & Testing Guide</h2>
            <p className="text-muted-foreground">
              Step-by-step guide for deploying Career Vault 2.0 to production
            </p>
          </div>
          <TestingGuide />
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Testing Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive automated testing for all application features
          </p>
          {sessionLoaded && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={userEmail ? "default" : "destructive"} className="gap-1">
                {userEmail ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Authenticated as {userEmail}
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    Not authenticated
                  </>
                )}
              </Badge>
            </div>
          )}
        </div>
        <Button
          onClick={() => runTests()}
          disabled={loading || !userEmail}
          size="lg"
          className="gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run All Tests
            </>
          )}
        </Button>
      </div>

      {loading && runningTest && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm font-medium">Currently running: {runningTest}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.passRate.toFixed(1)}%</div>
              <Progress value={stats.passRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((stats.duration || 0) / 1000).toFixed(1)}s
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-primary">
        <CardHeader>
          <CardTitle>🚀 Priority: Career Vault 2.0 Tests</CardTitle>
          <CardDescription>
            Run these first to verify migrations and critical paths (completes in ~2 minutes)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {prioritySuites.map((suite) => (
              <Card key={suite.id} className="hover:bg-accent transition-colors border-primary/50">
                <CardHeader>
                  <CardTitle className="text-base">{suite.name}</CardTitle>
                  <CardDescription className="text-sm">{suite.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-primary text-primary">
                      {suite.tests.length} tests
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => runTests(suite.id)}
                      disabled={loading || !userEmail}
                      className="bg-primary"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Run
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Test Suites</CardTitle>
          <CardDescription>Comprehensive test coverage for all features (excludes authentication tests)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allSuites.map((suite) => (
              <Card key={suite.id} className="hover:bg-accent transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">{suite.name}</CardTitle>
                  <CardDescription className="text-sm">{suite.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{suite.tests.length} tests</Badge>
                    <Button
                      size="sm"
                      onClick={() => runTests(suite.id)}
                      disabled={loading || !userEmail}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Run
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">⚠️ Dangerous Tests (Disabled)</CardTitle>
          <CardDescription>
            These tests modify authentication state and will log you out. Only run in isolated test environments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dangerousSuites.map((suite) => (
              <Card key={suite.id} className="opacity-50">
                <CardHeader>
                  <CardTitle className="text-base">{suite.name}</CardTitle>
                  <CardDescription className="text-sm">{suite.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{suite.tests.length} tests</Badge>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled
                    >
                      Disabled
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {currentRun && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Test Run</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Test Suite:</span>
                <span className="text-sm">{currentRun.suiteName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Tests:</span>
                <span className="text-sm">{currentRun.totalTests}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Passed:</span>
                <span className="text-sm text-green-600">{currentRun.passedTests}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Failed:</span>
                <span className="text-sm text-red-600">{currentRun.failedTests}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Duration:</span>
                <span className="text-sm">{(currentRun.duration / 1000).toFixed(2)}s</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Test History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {testHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No test runs yet. Run your first test suite to see results here.
                </p>
              ) : (
                testHistory.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div>
                      <div className="font-medium">{run.test_suite_name || 'All Tests'}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(run.started_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={run.failed_tests === 0 ? 'default' : 'destructive'}>
                        {run.passed_tests}/{run.total_tests} passed
                      </Badge>
                      <Button size="sm" variant="ghost">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Test Results & Analytics</h2>
              <p className="text-muted-foreground">
                Comprehensive test execution results and performance metrics
              </p>
            </div>

            {currentRun && <TestResultsReport summary={currentRun} />}

            <Card>
              <CardHeader>
                <CardTitle>Historical Test Runs</CardTitle>
                <CardDescription>
                  View past test execution history and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {testHistory.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No test runs yet. Execute tests to see historical data here.
                      </p>
                    ) : (
                      testHistory.map((run) => (
                        <Card key={run.id} className="hover:bg-accent transition-colors">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h4 className="font-medium">{run.test_suite_name || 'All Tests'}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(run.started_at).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant={run.failed_tests === 0 ? 'default' : 'destructive'}>
                                  {run.passed_tests}/{run.total_tests} passed
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {((run.duration_ms || 0) / 1000).toFixed(1)}s
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bugs" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Bug Tracking & Management</h2>
            <p className="text-muted-foreground">
              Document and track issues found during QA testing
            </p>
          </div>
          <BugTracker />
        </TabsContent>

        <TabsContent value="signoff" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Production Deployment Sign-Off</h2>
            <p className="text-muted-foreground">
              Complete all required checklist items before deploying to production
            </p>
          </div>
          <DeploymentSignoff />
        </TabsContent>
      </Tabs>
    </div>
  );
}
