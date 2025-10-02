import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, CheckCircle2, AlertCircle, Target, Users, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface JobAnalysis {
  professionalTitle: string;
  industry: string;
  standardizedQualifications: {
    required: string[];
    preferred: string[];
    technical: string[];
    soft: string[];
  };
  hiringManagerPerspective: {
    keyPriorities: string[];
    redFlags: string[];
    idealCandidate: string;
  };
  atsKeywords: string[];
  compensationRange: {
    min: number;
    max: number;
    currency: string;
  } | null;
}

interface JobConversationProps {
  jobDescription: string;
  onAnalysisComplete: (analysis: JobAnalysis) => void;
}

export function JobConversation({ jobDescription, onAnalysisComplete }: JobConversationProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);

  const analyzeJob = async () => {
    setIsAnalyzing(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-job-qualifications`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ jobDescription }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to analyze job');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysis(data);
      onAnalysisComplete(data);
    } catch (error) {
      console.error('Job analysis error:', error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Step 1: Decode the Job Description
          </CardTitle>
          <CardDescription>
            Let's analyze what this job really requires, beyond what's written
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Job Description Preview:</p>
            <p className="text-sm line-clamp-6">{jobDescription}</p>
          </div>
          
          <Button 
            onClick={analyzeJob} 
            disabled={isAnalyzing}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing Job Requirements...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-5 w-5" />
                Analyze Job Description
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Job Analysis Complete
          </CardTitle>
          <CardDescription>
            {analysis.professionalTitle} in {analysis.industry}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="qualifications" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="qualifications">
                <Target className="h-4 w-4 mr-2" />
                Qualifications
              </TabsTrigger>
              <TabsTrigger value="hiring">
                <Users className="h-4 w-4 mr-2" />
                Hiring Manager
              </TabsTrigger>
              <TabsTrigger value="keywords">
                <Award className="h-4 w-4 mr-2" />
                Keywords
              </TabsTrigger>
              <TabsTrigger value="compensation">Compensation</TabsTrigger>
            </TabsList>

            <TabsContent value="qualifications" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    Required Qualifications
                  </h4>
                  <ul className="space-y-1">
                    {analysis.standardizedQualifications.required.map((qual, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-red-600 mt-1">•</span>
                        <span>{qual}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Preferred Qualifications
                  </h4>
                  <ul className="space-y-1">
                    {analysis.standardizedQualifications.preferred.map((qual, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{qual}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Technical Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.standardizedQualifications.technical.map((skill, i) => (
                        <Badge key={i} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Soft Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.standardizedQualifications.soft.map((skill, i) => (
                        <Badge key={i} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hiring" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Key Priorities</h4>
                  <ul className="space-y-2">
                    {analysis.hiringManagerPerspective.keyPriorities.map((priority, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{priority}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2 text-red-600">Red Flags to Avoid</h4>
                  <ul className="space-y-2">
                    {analysis.hiringManagerPerspective.redFlags.map((flag, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Ideal Candidate Profile</h4>
                  <p className="text-sm">{analysis.hiringManagerPerspective.idealCandidate}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="keywords" className="mt-4">
              <div>
                <h4 className="font-semibold text-sm mb-3">ATS Keywords to Include</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.atsKeywords.map((keyword, i) => (
                    <Badge key={i} variant="default">{keyword}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  These keywords should appear naturally in your resume to pass Applicant Tracking Systems
                </p>
              </div>
            </TabsContent>

            <TabsContent value="compensation" className="mt-4">
              {analysis.compensationRange ? (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Compensation Range</h4>
                  <p className="text-2xl font-bold">
                    {analysis.compensationRange.currency} ${analysis.compensationRange.min.toLocaleString()} - ${analysis.compensationRange.max.toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No compensation information found in job description</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
