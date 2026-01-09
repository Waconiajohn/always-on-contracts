// =====================================================
// STEP 4: Generated Resume Display
// =====================================================

import { useResumeBuilderV3Store } from "@/stores/resumeBuilderV3Store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Copy,
  CheckCircle2,
  FileText,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export function GenerateStep() {
  const { finalResume, fitAnalysis } = useResumeBuilderV3Store();

  if (!finalResume) return null;

  const handleCopyText = () => {
    const resumeText = formatResumeAsText(finalResume);
    navigator.clipboard.writeText(resumeText);
    toast.success("Resume copied to clipboard!");
  };

  const formatResumeAsText = (resume: typeof finalResume) => {
    if (!resume) return "";
    
    let text = "";
    
    // Header
    text += `${resume.header.name}\n`;
    text += `${resume.header.title}\n`;
    if (resume.header.contact) text += `${resume.header.contact}\n`;
    text += "\n";
    
    // Summary
    text += "PROFESSIONAL SUMMARY\n";
    text += `${resume.summary}\n\n`;
    
    // Experience
    text += "EXPERIENCE\n";
    resume.experience.forEach((exp) => {
      text += `${exp.title} | ${exp.company} | ${exp.dates}\n`;
      exp.bullets.forEach((bullet) => {
        text += `• ${bullet}\n`;
      });
      text += "\n";
    });
    
    // Skills
    text += "SKILLS\n";
    text += resume.skills.join(" • ") + "\n\n";
    
    // Education
    if (resume.education?.length) {
      text += "EDUCATION\n";
      resume.education.forEach((edu) => {
        text += `${edu.degree} - ${edu.institution}`;
        if (edu.year) text += ` (${edu.year})`;
        text += "\n";
      });
      text += "\n";
    }
    
    // Certifications
    if (resume.certifications?.length) {
      text += "CERTIFICATIONS\n";
      resume.certifications.forEach((cert) => {
        text += `• ${cert}\n`;
      });
    }
    
    return text;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Success header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Your Optimized Resume</h2>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Original Fit</p>
            <p className={`text-2xl font-bold ${getScoreColor(fitAnalysis?.fit_score || 0)}`}>
              {fitAnalysis?.fit_score || 0}%
            </p>
          </div>
          <div className="text-3xl text-muted-foreground">→</div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">ATS Score</p>
            <p className={`text-2xl font-bold ${getScoreColor(finalResume.ats_score)}`}>
              {finalResume.ats_score}%
            </p>
          </div>
        </div>
      </div>

      {/* Improvements made */}
      <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-green-800 dark:text-green-200">
            <Sparkles className="h-4 w-4" />
            Improvements Made ({finalResume.improvements_made.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {finalResume.improvements_made.map((improvement, index) => (
              <li key={index} className="text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {improvement}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Resume preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume Preview
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyText}>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            <Button size="sm">
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
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
            <div className="flex flex-wrap gap-2">
              {finalResume.skills.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
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
    </div>
  );
}
