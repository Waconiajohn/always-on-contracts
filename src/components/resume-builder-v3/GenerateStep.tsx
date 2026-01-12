// =====================================================
// STEP 4: Generated Resume Display
// =====================================================

import { useRef } from "react";
import { useResumeBuilderV3Store } from "@/stores/resumeBuilderV3Store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Copy,
  CheckCircle2,
  FileText,
  Sparkles,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { ScoringReport } from "./ScoringReport";
import { BeforeAfterComparison } from "./BeforeAfterComparison";
import { ExportOptionsV3 } from "./ExportOptionsV3";
import { PrintableResume } from "./PrintableResume";
import { SuccessAnimation, FadeIn, StaggerContainer, StaggerItem } from "./StepTransition";
import { formatResumeAsText } from "./utils/formatters";

export function GenerateStep() {
  const { finalResume, fitAnalysis, standards } = useResumeBuilderV3Store();
  const printRef = useRef<HTMLDivElement>(null);

  if (!finalResume) return null;

  const handleCopyText = () => {
    const resumeText = formatResumeAsText(finalResume);
    navigator.clipboard.writeText(resumeText);
    toast.success("Resume copied to clipboard!");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 no-print">
      {/* Hidden printable version */}
      <div className="hidden print:block">
        <PrintableResume ref={printRef} resume={finalResume} />
      </div>

      {/* Success header */}
      <SuccessAnimation>
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Your Optimized Resume</h2>
          <p className="text-sm text-muted-foreground">
            Your resume has been tailored to match the job requirements
          </p>
        </div>
      </SuccessAnimation>

      {/* Before/After Comparison */}
      <FadeIn delay={0.1}>
        <BeforeAfterComparison fitAnalysis={fitAnalysis} finalResume={finalResume} />
      </FadeIn>

      {/* Scoring Report */}
      <FadeIn delay={0.2}>
        <ScoringReport fitAnalysis={fitAnalysis} standards={standards} finalResume={finalResume} />
      </FadeIn>

      {/* Improvements made */}
      <FadeIn delay={0.3}>
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-green-800 dark:text-green-200">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Improvements Made ({finalResume.improvements_made.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {finalResume.improvements_made.length > 0 ? (
              <StaggerContainer staggerDelay={0.05}>
                <ul className="space-y-1" role="list" aria-label="List of improvements made to your resume">
                  {finalResume.improvements_made.map((improvement, index) => (
                    <StaggerItem key={index}>
                      <li className="text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                        {improvement}
                      </li>
                    </StaggerItem>
                  ))}
                </ul>
              </StaggerContainer>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Your resume was already well-optimized. No major improvements were needed.
              </p>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {/* Resume preview */}
      <FadeIn delay={0.4}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resume Preview
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyText}>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              <ExportOptionsV3 resume={finalResume} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
          {/* Header */}
          <div className="text-center border-b pb-4">
            <h3 className="text-2xl font-bold">{finalResume.header.name}</h3>
            <p className="text-lg text-muted-foreground">{finalResume.header.title}</p>
            {finalResume.header.contact && (
              <p className="text-sm text-muted-foreground mt-1">{finalResume.header.contact}</p>
            )}
          </div>

          {/* Summary */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wide mb-2">
              Professional Summary
            </h4>
            <p className="text-sm leading-relaxed">{finalResume.summary}</p>
          </div>

          <Separator />

          {/* Experience */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wide mb-3">
              Experience
            </h4>
            <div className="space-y-4">
              {finalResume.experience.map((exp, index) => (
                <div key={index}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{exp.title}</p>
                      <p className="text-sm text-muted-foreground">{exp.company}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{exp.dates}</p>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {exp.bullets.map((bullet, bIndex) => (
                      <li key={bIndex} className="text-sm flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Skills */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wide mb-2">
              Skills
            </h4>
            {finalResume.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2" role="list" aria-label="Skills">
                {finalResume.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" role="listitem">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No skills listed</p>
            )}
          </div>

          {/* Education */}
          {finalResume.education && finalResume.education.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wide mb-2">
                  Education
                </h4>
                <div className="space-y-2">
                  {finalResume.education.map((edu, index) => (
                    <div key={index} className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{edu.degree}</p>
                        <p className="text-sm text-muted-foreground">{edu.institution}</p>
                      </div>
                      {edu.year && (
                        <p className="text-sm text-muted-foreground">{edu.year}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Certifications */}
          {finalResume.certifications && finalResume.certifications.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wide mb-2">
                  Certifications
                </h4>
                <ul className="space-y-1">
                  {finalResume.certifications.map((cert, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      {cert}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      </FadeIn>
    </div>
  );
}
