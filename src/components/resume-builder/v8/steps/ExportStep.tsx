/**
 * ExportStep - Step 4: Celebration and download
 */

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, RotateCcw, FileText, File,
  TrendingUp, Target, CheckCircle2
} from 'lucide-react';
import type { ResumeSection, SectionType, DetectedInfo, ScoreBreakdown } from '../types';

interface ExportStepProps {
  resumeContent: string;
  sections: Record<SectionType, ResumeSection>;
  detected: DetectedInfo;
  initialScore: number;
  finalScore: number;
  scoreBreakdown: ScoreBreakdown;
  onBack: () => void;
  onStartNew: () => void;
}

export function ExportStep({
  resumeContent,
  sections,
  detected,
  initialScore,
  finalScore,
  scoreBreakdown,
  onBack,
  onStartNew
}: ExportStepProps) {
  const improvement = finalScore - initialScore;

  const downloadTxt = () => {
    const blob = new Blob([resumeContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${detected.role.replace(/\s+/g, '_')}_resume.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(resumeContent);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Celebration Header */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-4"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-6xl"
        >
          🎉
        </motion.div>
        <h2 className="text-3xl font-bold">Your Must-Interview Resume is Ready!</h2>
        <p className="text-muted-foreground">
          You've created a targeted resume for {detected.role}
        </p>
      </motion.div>

      {/* Score Comparison */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-3 divide-x">
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Before</p>
              <p className="text-3xl font-bold text-red-500">{initialScore}</p>
            </div>
            <div className="p-6 text-center bg-primary/5">
              <p className="text-sm text-muted-foreground mb-2">Improvement</p>
              <p className="text-3xl font-bold text-green-500 flex items-center justify-center gap-1">
                <TrendingUp className="h-6 w-6" />
                +{improvement}
              </p>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">After</p>
              <p className="text-3xl font-bold text-green-500">{finalScore}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'JD Match', value: scoreBreakdown.jdMatch.score, icon: Target },
          { label: 'Benchmark', value: scoreBreakdown.industryBenchmark.score, icon: TrendingUp },
          { label: 'ATS', value: scoreBreakdown.atsCompliance.score, icon: CheckCircle2 },
          { label: 'Human Voice', value: scoreBreakdown.humanVoice.score, icon: FileText }
        ].map((item, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <item.icon className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Download Options */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Download Your Resume</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={downloadTxt} variant="outline" className="h-24 flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>Plain Text (.txt)</span>
            </Button>
            <Button onClick={copyToClipboard} variant="outline" className="h-24 flex-col gap-2">
              <File className="h-6 w-6" />
              <span>Copy to Clipboard</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            For PDF export, copy to your favorite document editor
          </p>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Final Resume Preview</h3>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border max-h-[400px] overflow-auto">
            <div className="text-center border-b pb-4 mb-4">
              <h2 className="text-xl font-bold">{detected.role}</h2>
              <p className="text-sm text-muted-foreground">{detected.industry} • {detected.level}</p>
            </div>
            {Object.entries(sections).map(([id, section]) => (
              section.content.trim() && (
                <div key={id} className="mb-4">
                  <h4 className="font-semibold uppercase text-xs tracking-wide text-primary mb-1">
                    {section.title}
                  </h4>
                  <p className="whitespace-pre-wrap text-sm">{section.content}</p>
                </div>
              )
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Fine-Tune
        </Button>
        <Button onClick={onStartNew} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Start New Resume
        </Button>
      </div>
    </div>
  );
}
