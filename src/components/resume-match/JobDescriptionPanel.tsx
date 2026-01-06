import { FileText, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface JobDescriptionPanelProps {
  jobDescription: string;
  onJobDescriptionChange: (text: string) => void;
  isAnalyzing?: boolean;
}

const SAMPLE_JD = `Senior Software Engineer - Full Stack

About the Role:
We're looking for a Senior Software Engineer to join our growing team. You'll work on building scalable web applications using modern technologies.

Requirements:
• 5+ years of software development experience
• Strong proficiency in React, TypeScript, and Node.js
• Experience with cloud platforms (AWS, GCP, or Azure)
• Familiarity with SQL and NoSQL databases
• Experience with CI/CD pipelines and DevOps practices
• Excellent problem-solving and communication skills
• Bachelor's degree in Computer Science or related field

Nice to Have:
• Experience with microservices architecture
• Knowledge of containerization (Docker, Kubernetes)
• Contributions to open source projects
• Experience mentoring junior developers

We offer competitive salary, equity, and benefits. Remote-friendly with flexible hours.`;

export function JobDescriptionPanel({ 
  jobDescription, 
  onJobDescriptionChange,
  isAnalyzing 
}: JobDescriptionPanelProps) {
  const handleLoadSample = () => {
    onJobDescriptionChange(SAMPLE_JD);
  };

  const wordCount = jobDescription.trim() ? jobDescription.trim().split(/\s+/).length : 0;

  return (
    <Card className="h-full flex flex-col p-4 bg-card/50">
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Job Description
        </Label>
        <div className="flex items-center gap-2">
          {jobDescription && (
            <span className="text-xs text-muted-foreground">{wordCount} words</span>
          )}
          {!jobDescription && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadSample}
              className="h-7 px-2 text-xs"
              disabled={isAnalyzing}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Load Sample
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <Textarea
          placeholder="Paste the job description here...

Include:
• Job title and company
• Required skills and qualifications
• Nice-to-have requirements
• Years of experience needed"
          value={jobDescription}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          className="flex-1 resize-none text-sm bg-background/50 min-h-[200px]"
          disabled={isAnalyzing}
        />
      </div>

      <p className="text-[10px] text-muted-foreground mt-2 text-center">
        💡 Paste the full job posting for best results
      </p>
    </Card>
  );
}
