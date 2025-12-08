/**
 * BuildStep - Step 2: Split-screen editor with live preview
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Briefcase, Code, GraduationCap, Award,
  ArrowLeft, ArrowRight, Sparkles, Check, Lightbulb
} from 'lucide-react';
import type { ResumeSection, SectionType, DetectedInfo } from '../types';

interface BuildStepProps {
  sections: Record<SectionType, ResumeSection>;
  detected: DetectedInfo;
  isProcessing: boolean;
  onContentChange: (sectionId: SectionType, content: string) => void;
  onEnhance: (sectionId: SectionType, type: 'expand' | 'ats-boost' | 'quantify' | 'benchmark') => Promise<string | null>;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}

const SECTION_CONFIG: Record<SectionType, { icon: React.ReactNode; tips: string[] }> = {
  summary: { icon: <FileText className="h-4 w-4" />, tips: ['Lead with strongest achievement', 'Keep to 3-4 sentences', 'Include key skills'] },
  experience: { icon: <Briefcase className="h-4 w-4" />, tips: ['Start with action verbs', 'Quantify achievements', 'Focus on impact'] },
  skills: { icon: <Code className="h-4 w-4" />, tips: ['Include JD keywords', 'Group by category', 'List certifications'] },
  education: { icon: <GraduationCap className="h-4 w-4" />, tips: ['Most recent first', 'Include honors', 'Add relevant coursework'] },
  certifications: { icon: <Award className="h-4 w-4" />, tips: ['Include dates', 'Show active status', 'Prioritize relevant ones'] }
};

export function BuildStep({
  sections,
  detected,
  isProcessing,
  onContentChange,
  onEnhance,
  onNext,
  onBack,
  canProceed
}: BuildStepProps) {
  const [activeSection, setActiveSection] = useState<SectionType>('summary');
  const [enhancingSuggestion, setEnhancingSuggestion] = useState<string | null>(null);

  const completedCount = Object.values(sections).filter(s => s.content.trim()).length;

  const handleEnhance = async (type: 'expand' | 'ats-boost' | 'quantify' | 'benchmark') => {
    const result = await onEnhance(activeSection, type);
    if (result) setEnhancingSuggestion(result);
  };

  const applySuggestion = () => {
    if (enhancingSuggestion) {
      onContentChange(activeSection, enhancingSuggestion);
      setEnhancingSuggestion(null);
    }
  };

  return (
    <div className="h-[calc(100vh-180px)] flex">
      {/* Left: Editor Panel */}
      <div className="flex-1 p-6 overflow-auto border-r">
        {/* Section Tabs */}
        <Tabs value={activeSection} onValueChange={(v) => setActiveSection(v as SectionType)}>
          <TabsList className="mb-4">
            {(Object.keys(sections) as SectionType[]).map((s) => (
              <TabsTrigger key={s} value={s} className="gap-2">
                {sections[s].content.trim() ? <Check className="h-3 w-3 text-green-500" /> : SECTION_CONFIG[s].icon}
                <span className="capitalize hidden sm:inline">{s}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {(Object.keys(sections) as SectionType[]).map((sectionId) => (
            <TabsContent key={sectionId} value={sectionId} className="space-y-4">
              {/* Tips */}
              <div className="flex flex-wrap gap-2">
                {SECTION_CONFIG[sectionId].tips.map((tip, i) => (
                  <Badge key={i} variant="secondary" className="text-xs gap-1">
                    <Lightbulb className="h-3 w-3" />
                    {tip}
                  </Badge>
                ))}
              </div>

              {/* Editor */}
              <Textarea
                value={sections[sectionId].content}
                onChange={(e) => onContentChange(sectionId, e.target.value)}
                placeholder={`Write your ${sectionId} section...`}
                className="min-h-[300px] text-base"
              />

              {/* Word Count */}
              <p className="text-xs text-muted-foreground">
                {sections[sectionId].wordCount} words
              </p>

              {/* AI Actions */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Enhancement
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEnhance('expand')} disabled={isProcessing}>
                    Expand
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEnhance('ats-boost')} disabled={isProcessing}>
                    ATS Boost
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEnhance('quantify')} disabled={isProcessing}>
                    Quantify
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEnhance('benchmark')} disabled={isProcessing}>
                    Benchmark
                  </Button>
                </CardContent>
              </Card>

              {/* Suggestion Preview */}
              {enhancingSuggestion && (
                <Card className="border-primary">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-medium">AI Suggestion:</p>
                    <div className="p-3 bg-muted rounded text-sm max-h-40 overflow-auto">
                      {enhancingSuggestion}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={applySuggestion}>Apply</Button>
                      <Button size="sm" variant="outline" onClick={() => setEnhancingSuggestion(null)}>Dismiss</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Right: Live Preview */}
      <div className="w-[400px] p-6 bg-muted/30 overflow-auto">
        <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg space-y-4 text-sm">
          <div className="text-center border-b pb-4">
            <h2 className="text-xl font-bold">{detected.role}</h2>
            <p className="text-muted-foreground">{detected.industry} • {detected.level}</p>
          </div>

          {Object.entries(sections).map(([id, section]) => (
            section.content.trim() && (
              <div key={id} className="space-y-1">
                <h4 className="font-semibold uppercase text-xs tracking-wide text-primary">
                  {section.title}
                </h4>
                <p className="whitespace-pre-wrap text-xs">{section.content}</p>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {completedCount}/5 sections complete
          </span>
          <Button onClick={onNext} disabled={!canProceed} className="gap-2">
            Continue to Fine-Tune
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
