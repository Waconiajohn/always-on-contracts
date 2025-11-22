import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Database,
  RefreshCw,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VerificationProps {
  vaultId: string;
}

interface VerificationResult {
  category: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: string;
  originalData?: string;
  parsedData?: any;
}

export function ResumeDataVerification({ vaultId }: VerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [resumeText, setResumeText] = useState<string>("");
  
  const runVerification = async () => {
    setIsVerifying(true);
    const verificationResults: VerificationResult[] = [];

    try {
      // Fetch all relevant data
      const [vaultRes, workRes, eduRes, milestonesRes] = await Promise.all([
        supabase.from('career_vault').select('resume_raw_text, user_id').eq('id', vaultId).single(),
        supabase.from('vault_work_positions').select('*').eq('vault_id', vaultId),
        supabase.from('vault_education').select('*').eq('vault_id', vaultId),
        supabase.from('vault_resume_milestones').select(`
          *,
          work_position:vault_work_positions!work_position_id (
            id,
            company_name,
            job_title,
            start_date,
            end_date,
            is_current
          )
        `).eq('vault_id', vaultId)
      ]);

      if (vaultRes.error) throw vaultRes.error;
      const resume = vaultRes.data.resume_raw_text || '';
      setResumeText(resume);

      // Verification 1: Resume Text Exists
      if (!resume || resume.length < 100) {
        verificationResults.push({
          category: 'Resume Source',
          status: 'fail',
          message: 'Original resume text missing or too short',
          details: `Resume length: ${resume?.length || 0} characters (minimum 100 required)`
        });
      } else {
        verificationResults.push({
          category: 'Resume Source',
          status: 'pass',
          message: 'Original resume text found',
          details: `${resume.length} characters stored`,
          originalData: resume
        });
      }

      // Verification 2: Work Experience Extraction
      const workPositions = workRes.data || [];
      const workKeywords = ['experience', 'position', 'role', 'company', 'employer', 'work history'];
      const hasWorkSection = workKeywords.some(kw => resume.toLowerCase().includes(kw));
      
      if (hasWorkSection && workPositions.length === 0) {
        verificationResults.push({
          category: 'Work Experience',
          status: 'fail',
          message: 'Resume mentions work experience but none extracted',
          details: 'Resume contains work-related keywords but no positions were parsed into database'
        });
      } else if (workPositions.length > 0) {
        const companies = workPositions.map(wp => wp.company_name).filter(Boolean);
        const companiesInResume = companies.filter(c => 
          resume.toLowerCase().includes(c.toLowerCase())
        );
        
        verificationResults.push({
          category: 'Work Experience',
          status: companiesInResume.length === companies.length ? 'pass' : 'warning',
          message: `${workPositions.length} positions extracted`,
          details: `${companiesInResume.length}/${companies.length} company names verified in original resume`,
          parsedData: workPositions
        });
      } else {
        verificationResults.push({
          category: 'Work Experience',
          status: 'warning',
          message: 'No work experience found',
          details: 'Neither in resume text nor in database'
        });
      }

      // Verification 3: Education Extraction
      const education = eduRes.data || [];
      const eduKeywords = ['education', 'degree', 'university', 'college', 'bachelor', 'master', 'phd'];
      const hasEduSection = eduKeywords.some(kw => resume.toLowerCase().includes(kw));
      
      if (hasEduSection && education.length === 0) {
        verificationResults.push({
          category: 'Education',
          status: 'fail',
          message: 'Resume mentions education but none extracted',
          details: 'Resume contains education keywords but no degrees were parsed'
        });
      } else if (education.length > 0) {
        const institutions = education.map(e => e.institution_name).filter(Boolean);
        const institutionsInResume = institutions.filter(inst => 
          resume.toLowerCase().includes(inst.toLowerCase())
        );
        
        verificationResults.push({
          category: 'Education',
          status: institutionsInResume.length === institutions.length ? 'pass' : 'warning',
          message: `${education.length} education records extracted`,
          details: `${institutionsInResume.length}/${institutions.length} institutions verified in original resume`,
          parsedData: education
        });
      } else {
        verificationResults.push({
          category: 'Education',
          status: 'warning',
          message: 'No education records found',
          details: 'Neither in resume text nor in database'
        });
      }

      // Verification 4: Milestones/Achievements
      const milestones = milestonesRes.data || [];
      const achievementKeywords = ['achievement', 'accomplishment', 'milestone', 'award', 'recognition'];
      const hasAchievements = achievementKeywords.some(kw => resume.toLowerCase().includes(kw));
      
      if (milestones.length > 0) {
        verificationResults.push({
          category: 'Milestones',
          status: 'pass',
          message: `${milestones.length} milestones extracted`,
          details: `Successfully parsed career milestones from resume`,
          parsedData: milestones
        });
      } else if (hasAchievements) {
        verificationResults.push({
          category: 'Milestones',
          status: 'warning',
          message: 'Achievements mentioned but not fully extracted',
          details: 'Resume contains achievement keywords but milestones table is empty'
        });
      } else {
        verificationResults.push({
          category: 'Milestones',
          status: 'pass',
          message: 'No explicit milestones section',
          details: 'Resume does not have a dedicated achievements section'
        });
      }

      // Verification 5: Data Completeness
      const totalStructuredItems = workPositions.length + education.length + milestones.length;
      if (totalStructuredItems === 0) {
        verificationResults.push({
          category: 'Overall Completeness',
          status: 'fail',
          message: 'No structured data extracted from resume',
          details: 'Critical: Resume text exists but no work, education, or milestones were parsed'
        });
      } else if (totalStructuredItems < 3) {
        verificationResults.push({
          category: 'Overall Completeness',
          status: 'warning',
          message: 'Limited structured data extracted',
          details: `Only ${totalStructuredItems} total items across all structured tables`
        });
      } else {
        verificationResults.push({
          category: 'Overall Completeness',
          status: 'pass',
          message: 'Adequate structured data extraction',
          details: `${totalStructuredItems} items successfully parsed and stored`
        });
      }

      setResults(verificationResults);
      
      const failCount = verificationResults.filter(r => r.status === 'fail').length;
      const warnCount = verificationResults.filter(r => r.status === 'warning').length;
      
      if (failCount > 0) {
        toast.error(`Verification complete: ${failCount} critical issues found`);
      } else if (warnCount > 0) {
        toast.warning(`Verification complete: ${warnCount} warnings found`);
      } else {
        toast.success('Verification complete: All checks passed');
      }

    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Verification failed');
      verificationResults.push({
        category: 'System Error',
        status: 'fail',
        message: 'Verification process failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      setResults(verificationResults);
    } finally {
      setIsVerifying(false);
    }
  };

  const StatusIcon = ({ status }: { status: 'pass' | 'warning' | 'fail' }) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const passCount = results.filter(r => r.status === 'pass').length;
  const warnCount = results.filter(r => r.status === 'warning').length;
  const failCount = results.filter(r => r.status === 'fail').length;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Resume Data Verification</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Compare original resume with parsed database fields
            </p>
          </div>
          <Button 
            onClick={runVerification}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Run Verification
              </>
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{passCount}</p>
                    <p className="text-sm text-green-700 dark:text-green-300">Passed</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{warnCount}</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Warnings</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">{failCount}</p>
                    <p className="text-sm text-red-700 dark:text-red-300">Failed</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Results */}
            <Tabs defaultValue="results" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="results">
                  <Database className="h-4 w-4 mr-2" />
                  Verification Results
                </TabsTrigger>
                <TabsTrigger value="original">
                  <FileText className="h-4 w-4 mr-2" />
                  Original Resume
                </TabsTrigger>
              </TabsList>

              <TabsContent value="results" className="space-y-4 mt-4">
                <ScrollArea className="h-[600px] pr-4">
                  {results.map((result, index) => (
                    <Alert key={index} className="mb-4">
                      <div className="flex items-start gap-3">
                        <StatusIcon status={result.status} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{result.category}</h4>
                            <Badge variant={
                              result.status === 'pass' ? 'default' : 
                              result.status === 'warning' ? 'secondary' : 
                              'destructive'
                            }>
                              {result.status}
                            </Badge>
                          </div>
                          <AlertDescription>
                            <p className="font-medium">{result.message}</p>
                            {result.details && (
                              <p className="text-sm text-muted-foreground mt-1">{result.details}</p>
                            )}
                            {result.parsedData && (
                              <details className="mt-2">
                                <summary className="text-sm cursor-pointer text-primary hover:underline">
                                  View parsed data ({Array.isArray(result.parsedData) ? result.parsedData.length : 1} items)
                                </summary>
                                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                                  {JSON.stringify(result.parsedData, null, 2)}
                                </pre>
                              </details>
                            )}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="original" className="mt-4">
                <ScrollArea className="h-[600px]">
                  <Card className="p-4 bg-muted">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {resumeText || 'No resume text found'}
                    </pre>
                  </Card>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </>
        )}

        {results.length === 0 && !isVerifying && (
          <Alert>
            <AlertDescription>
              Click "Run Verification" to compare the original resume with parsed database fields.
              This will identify any discrepancies or missing data.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
}
