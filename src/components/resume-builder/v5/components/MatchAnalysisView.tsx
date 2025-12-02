/**
 * MatchAnalysisView - Page 2: Compare final resume vs job description
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import type { EliteResumeData, MatchAnalysis } from '../types';

interface MatchAnalysisViewProps {
  resumeData: EliteResumeData;
  matchAnalysis: MatchAnalysis;
  jobDescription: string;
  onBack: () => void;
  onExport: () => void;
}

export function MatchAnalysisView({
  resumeData,
  matchAnalysis,
  jobDescription,
  onBack,
  onExport
}: MatchAnalysisViewProps) {
  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Editor
        </Button>
        <Button onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Resume
        </Button>
      </div>

      {/* Match Score Card */}
      <Card>
        <CardHeader>
          <CardTitle>Match Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Match</span>
              <span className="text-2xl font-bold">{matchAnalysis.overallMatch}%</span>
            </div>
            <Progress value={matchAnalysis.overallMatch} className="h-3" />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-6">
            {/* Covered Requirements */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Covered Requirements ({matchAnalysis.coveredRequirements.length})
              </h4>
              <div className="space-y-1">
                {matchAnalysis.coveredRequirements.map((req, i) => (
                  <div key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Uncovered Requirements */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                Gaps Remaining ({matchAnalysis.uncoveredRequirements.length})
              </h4>
              <div className="space-y-1">
                {matchAnalysis.uncoveredRequirements.map((req, i) => (
                  <div key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <AlertCircle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Final Resume */}
        <Card>
          <CardHeader>
            <CardTitle>Your Tailored Resume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none space-y-4">
              {/* Contact Info */}
              <div className="border-b pb-3">
                <h2 className="text-xl font-bold m-0">{resumeData.contactInfo.name}</h2>
                <p className="text-sm text-muted-foreground m-0">
                  {resumeData.contactInfo.email} • {resumeData.contactInfo.phone}
                </p>
              </div>

              {/* Sections */}
              {resumeData.sections.map((section) => (
                <div key={section.id}>
                  <h3 className="text-sm font-semibold uppercase tracking-wide border-b pb-1 m-0">
                    {section.title}
                  </h3>
                  {section.paragraph && (
                    <p className="text-sm mt-2">{section.paragraph}</p>
                  )}
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet.id} className="text-sm">
                        {bullet.userEditedText || bullet.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Job Description with highlights */}
        <Card>
          <CardHeader>
            <CardTitle>Job Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="text-sm whitespace-pre-wrap">
                {jobDescription.split('\n').map((line, i) => {
                  const isCovered = matchAnalysis.coveredRequirements.some(req => 
                    line.toLowerCase().includes(req.toLowerCase())
                  );
                  const isGap = matchAnalysis.uncoveredRequirements.some(req => 
                    line.toLowerCase().includes(req.toLowerCase())
                  );

                  if (isCovered) {
                    return (
                      <p key={i} className="bg-green-500/10 px-2 py-1 rounded">
                        {line}
                      </p>
                    );
                  } else if (isGap) {
                    return (
                      <p key={i} className="bg-amber-500/10 px-2 py-1 rounded">
                        {line}
                      </p>
                    );
                  } else {
                    return <p key={i}>{line}</p>;
                  }
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
