import { useState } from "react";
import { AppNav } from "@/components/AppNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  careerVault,
  research,
  resume,
  application,
  interview,
  agency,
  networking,
  market,
  jobScraper,
  personaMemory
} from "@/lib/mcp-client";
import { 
  Zap, 
  Database, 
  Search, 
  FileText, 
  Send, 
  MessageSquare, 
  Building, 
  Users, 
  TrendingUp, 
  Briefcase,
  Brain,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";

interface TestResult {
  mcp: string;
  tool: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  duration?: number;
}

export default function MCPTestDashboard() {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const testCareerVaultMCP = async () => {
    const start = Date.now();
    try {
      const result = await careerVault.get();
      addResult({
        mcp: 'Career Vault',
        tool: 'get',
        status: result.error ? 'error' : 'success',
        message: result.error || `Found ${result.data ? 'career vault data' : 'no data'}`,
        duration: Date.now() - start
      });
    } catch (error: any) {
      addResult({
        mcp: 'Career Vault',
        tool: 'get',
        status: 'error',
        message: error.message,
        duration: Date.now() - start
      });
    }
  };

  const testResearchMCP = async () => {
    const start = Date.now();
    try {
      const result = await research.getActiveExperiments();
      addResult({
        mcp: 'Research',
        tool: 'getActiveExperiments',
        status: result.error ? 'error' : 'success',
        message: result.error || `Found experiments`,
        duration: Date.now() - start
      });
    } catch (error: any) {
      addResult({
        mcp: 'Research',
        tool: 'getActiveExperiments',
        status: 'error',
        message: error.message,
        duration: Date.now() - start
      });
    }
  };

  const testResumeMCP = async () => {
    const start = Date.now();
    try {
      const result = await resume.analyze('test-user-id', 'Sample resume text for testing');
      addResult({
        mcp: 'Resume Intelligence',
        tool: 'analyze',
        status: result.error ? 'error' : 'success',
        message: result.error || 'Resume analyzed',
        duration: Date.now() - start
      });
    } catch (error: any) {
      addResult({
        mcp: 'Resume Intelligence',
        tool: 'analyze',
        status: 'error',
        message: error.message,
        duration: Date.now() - start
      });
    }
  };

  const testApplicationMCP = async () => {
    const start = Date.now();
    try {
      const result = await application.getDailyStats('test-user-id');
      addResult({
        mcp: 'Application Automation',
        tool: 'getDailyStats',
        status: result.error ? 'error' : 'success',
        message: result.error || 'Stats retrieved',
        duration: Date.now() - start
      });
    } catch (error: any) {
      addResult({
        mcp: 'Application Automation',
        tool: 'getDailyStats',
        status: 'error',
        message: error.message,
        duration: Date.now() - start
      });
    }
  };

  const testInterviewMCP = async () => {
    const start = Date.now();
    try {
      const result = await interview.generateQuestions('test-user-id', 'Senior Software Engineer position');
      addResult({
        mcp: 'Interview Prep',
        tool: 'generateQuestions',
        status: result.error ? 'error' : 'success',
        message: result.error || 'Questions generated',
        duration: Date.now() - start
      });
    } catch (error: any) {
      addResult({
        mcp: 'Interview Prep',
        tool: 'generateQuestions',
        status: 'error',
        message: error.message,
        duration: Date.now() - start
      });
    }
  };

  const testAgencyMCP = async () => {
    const start = Date.now();
    try {
      const result = await agency.matchAgencies('test-user-id', ['Software Engineer'], ['Technology']);
      addResult({
        mcp: 'Agency Matcher',
        tool: 'matchAgencies',
        status: result.error ? 'error' : 'success',
        message: result.error || 'Agencies matched',
        duration: Date.now() - start
      });
    } catch (error: any) {
      addResult({
        mcp: 'Agency Matcher',
        tool: 'matchAgencies',
        status: 'error',
        message: error.message,
        duration: Date.now() - start
      });
    }
  };

  const testNetworkingMCP = async () => {
    const start = Date.now();
    try {
      const result = await networking.getTemplates('test-user-id');
      addResult({
        mcp: 'Networking',
        tool: 'getTemplates',
        status: result.error ? 'error' : 'success',
        message: result.error || 'Templates retrieved',
        duration: Date.now() - start
      });
    } catch (error: any) {
      addResult({
        mcp: 'Networking',
        tool: 'getTemplates',
        status: 'error',
        message: error.message,
        duration: Date.now() - start
      });
    }
  };

  const testMarketMCP = async () => {
    const start = Date.now();
    try {
      const result = await market.getMarketRates('Software Engineer', 'San Francisco');
      addResult({
        mcp: 'Market Intelligence',
        tool: 'getMarketRates',
        status: result.error ? 'error' : 'success',
        message: result.error || 'Market rates retrieved',
        duration: Date.now() - start
      });
    } catch (error: any) {
      addResult({
        mcp: 'Market Intelligence',
        tool: 'getMarketRates',
        status: 'error',
        message: error.message,
        duration: Date.now() - start
      });
    }
  };

  const testJobScraperMCP = async () => {
    const start = Date.now();
    try {
      const result = await jobScraper.scrapeJobs('Software Engineer', 'Remote', ['linkedin'], 5);
      addResult({
        mcp: 'Job Scraper',
        tool: 'scrapeJobs',
        status: result.error ? 'error' : 'success',
        message: result.error || 'Job scraping initiated',
        duration: Date.now() - start
      });
    } catch (error: any) {
      addResult({
        mcp: 'Job Scraper',
        tool: 'scrapeJobs',
        status: 'error',
        message: error.message,
        duration: Date.now() - start
      });
    }
  };

  const testPersonaMemoryMCP = async () => {
    const start = Date.now();
    try {
      const result = await personaMemory.recall('robert', 10);
      addResult({
        mcp: 'Persona Memory',
        tool: 'recall',
        status: result.error ? 'error' : 'success',
        message: result.error || 'Memories recalled',
        duration: Date.now() - start
      });
    } catch (error: any) {
      addResult({
        mcp: 'Persona Memory',
        tool: 'recall',
        status: 'error',
        message: error.message,
        duration: Date.now() - start
      });
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setTestResults([]);
    
    toast({
      title: "Running MCP Tests",
      description: "Testing all 10 MCPs..."
    });

    await testCareerVaultMCP();
    await testResearchMCP();
    await testResumeMCP();
    await testApplicationMCP();
    await testInterviewMCP();
    await testAgencyMCP();
    await testNetworkingMCP();
    await testMarketMCP();
    await testJobScraperMCP();
    await testPersonaMemoryMCP();

    setTesting(false);
    
    const successCount = testResults.filter(r => r.status === 'success').length;
    const totalCount = testResults.length;
    
    toast({
      title: "Tests Complete",
      description: `${successCount}/${totalCount} MCPs responding correctly`
    });
  };

  const mcpCards = [
    { icon: Database, name: "Career Vault", test: testCareerVaultMCP, color: "text-blue-500" },
    { icon: Search, name: "Research", test: testResearchMCP, color: "text-purple-500" },
    { icon: FileText, name: "Resume", test: testResumeMCP, color: "text-green-500" },
    { icon: Send, name: "Application", test: testApplicationMCP, color: "text-orange-500" },
    { icon: MessageSquare, name: "Interview", test: testInterviewMCP, color: "text-pink-500" },
    { icon: Building, name: "Agency", test: testAgencyMCP, color: "text-indigo-500" },
    { icon: Users, name: "Networking", test: testNetworkingMCP, color: "text-cyan-500" },
    { icon: TrendingUp, name: "Market", test: testMarketMCP, color: "text-yellow-500" },
    { icon: Briefcase, name: "Job Scraper", test: testJobScraperMCP, color: "text-red-500" },
    { icon: Brain, name: "Persona Memory", test: testPersonaMemoryMCP, color: "text-violet-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <AppNav />
      
      <main className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">MCP Test Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Monitor and test all 10 Model Context Protocol servers
          </p>
        </div>

        <div className="mb-6 flex gap-4">
          <Button onClick={runAllTests} disabled={testing} size="lg" className="gap-2">
            {testing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Run All Tests
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => setTestResults([])} size="lg">
            Clear Results
          </Button>
        </div>

        <Tabs defaultValue="grid" className="space-y-6">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="results">Test Results</TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {mcpCards.map((mcp) => (
                <Card key={mcp.name} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <mcp.icon className={`h-8 w-8 ${mcp.color}`} />
                      {testResults.find(r => r.mcp === mcp.name)?.status === 'success' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {testResults.find(r => r.mcp === mcp.name)?.status === 'error' && (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <CardTitle className="text-base">{mcp.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={mcp.test}
                      disabled={testing}
                    >
                      Test
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>
                  {testResults.length} tests run • {testResults.filter(r => r.status === 'success').length} passed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {testResults.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No tests run yet. Click "Run All Tests" to start.
                      </p>
                    ) : (
                      testResults.map((result, idx) => (
                        <div 
                          key={idx}
                          className={`p-4 rounded-lg border ${
                            result.status === 'success' 
                              ? 'bg-green-500/5 border-green-500/20' 
                              : 'bg-red-500/5 border-red-500/20'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {result.status === 'success' ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                              <span className="font-semibold">{result.mcp}</span>
                              <Badge variant="outline" className="text-xs">
                                {result.tool}
                              </Badge>
                            </div>
                            {result.duration && (
                              <span className="text-xs text-muted-foreground">
                                {result.duration}ms
                              </span>
                            )}
                          </div>
                          {result.message && (
                            <p className="text-sm text-muted-foreground">
                              {result.message}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>MCP Architecture Overview</CardTitle>
            <CardDescription>
              10 specialized servers orchestrated through a central hub
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">Core MCPs</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Career Vault - Career intelligence storage</li>
                  <li>• Research - Experimental lab features</li>
                  <li>• Resume Intelligence - Resume analysis</li>
                  <li>• Application Automation - Job applications</li>
                  <li>• Interview Prep - Interview practice</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Extended MCPs</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Agency Matcher - Staffing agency connections</li>
                  <li>• Networking - Relationship management</li>
                  <li>• Market Intelligence - Salary & trends</li>
                  <li>• Job Scraper - Multi-source job search</li>
                  <li>• Persona Memory - AI coaching memory</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}