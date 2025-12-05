/**
 * SectionStudio - Full-width dedicated section editor
 * One section at a time with AI enhancement tools
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Briefcase, 
  Code, 
  GraduationCap, 
  Award,
  ArrowLeft,
  ArrowRight,
  Save,
  Check,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { invokeEdgeFunction } from '@/lib/edgeFunction';
import { AIEnhancementToolbar } from './AIEnhancementToolbar';
import type { SectionType, AIEnhancementType, DetectedInfo, GapAnalysisResult } from '../types';

interface SectionConfig {
  id: SectionType;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  tips: string[];
  characterLimit?: { min: number; ideal: number; max: number };
}

const SECTIONS: SectionConfig[] = [
  {
    id: 'summary',
    label: 'Professional Summary',
    icon: <FileText className="h-4 w-4" />,
    placeholder: 'Write a compelling 3-4 sentence summary of your professional background, key strengths, and career objectives...',
    tips: [
      'Lead with your strongest qualifier',
      'Include 2-3 key accomplishments',
      'End with what you bring to the role'
    ],
    characterLimit: { min: 150, ideal: 300, max: 500 }
  },
  {
    id: 'experience',
    label: 'Professional Experience',
    icon: <Briefcase className="h-4 w-4" />,
    placeholder: 'Describe your most relevant role. Start with impact-driven bullet points using action verbs and quantified results...',
    tips: [
      'Use strong action verbs',
      'Quantify achievements (%, $, #)',
      'Focus on impact, not just duties'
    ]
  },
  {
    id: 'skills',
    label: 'Skills & Competencies',
    icon: <Code className="h-4 w-4" />,
    placeholder: 'List your technical skills, tools, certifications, and core competencies relevant to the target role...',
    tips: [
      'Include keywords from job posting',
      'Group by category if many',
      'List certifications separately'
    ]
  },
  {
    id: 'education',
    label: 'Education',
    icon: <GraduationCap className="h-4 w-4" />,
    placeholder: 'Include your degrees, certifications, and relevant training...',
    tips: [
      'Most recent first',
      'Include honors if applicable',
      'Add relevant coursework for entry-level'
    ]
  },
  {
    id: 'certifications',
    label: 'Certifications',
    icon: <Award className="h-4 w-4" />,
    placeholder: 'List professional certifications, licenses, and specialized training...',
    tips: [
      'Include certification dates',
      'Mention if actively maintained',
      'Prioritize industry-relevant certs'
    ]
  }
];

interface SectionStudioProps {
  detected: DetectedInfo;
  jobDescription: string;
  gapAnalysis: GapAnalysisResult | null;
  industryResearch: string | null;
  sectionContent: Record<SectionType, string>;
  completedSections: Set<SectionType>;
  onContentChange: (section: SectionType, content: string) => void;
  onSectionComplete: (section: SectionType) => void;
  onNext: () => void;
  onBack: () => void;
}

export function SectionStudio({
  detected,
  jobDescription,
  gapAnalysis,
  industryResearch,
  sectionContent,
  completedSections,
  onContentChange,
  onSectionComplete,
  onNext,
  onBack
}: SectionStudioProps) {
  const [activeSection, setActiveSection] = useState<SectionType>('summary');
  const [isEnhancing, setIsEnhancing] = useState(false);

  const currentConfig = SECTIONS.find(s => s.id === activeSection)!;
  const currentContent = sectionContent[activeSection] || '';
  const isCurrentComplete = completedSections.has(activeSection);
  const allComplete = SECTIONS.every(s => completedSections.has(s.id));

  const currentIndex = SECTIONS.findIndex(s => s.id === activeSection);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < SECTIONS.length - 1;

  // Character count for sections with limits
  const charCount = currentContent.length;
  const charLimit = currentConfig.characterLimit;
  const charStatus = charLimit 
    ? charCount < charLimit.min ? 'low' : charCount > charLimit.max ? 'high' : 'good'
    : 'good';

  // AI Enhancement handler
  const handleEnhance = useCallback(async (type: AIEnhancementType): Promise<string | null> => {
    setIsEnhancing(true);
    try {
      const { data } = await invokeEdgeFunction('generate-dual-resume-section', {
        sectionType: activeSection,
        currentContent,
        jobDescription,
        targetRole: detected.role,
        targetIndustry: detected.industry,
        careerLevel: detected.level,
        enhancementType: type,
        industryResearch,
        action: type
      });

      return data?.enhancedContent || null;
    } catch (error) {
      console.error('Enhancement error:', error);
      return null;
    } finally {
      setIsEnhancing(false);
    }
  }, [activeSection, currentContent, jobDescription, detected, industryResearch]);

  // Apply AI suggestion
  const handleApplySuggestion = (content: string) => {
    onContentChange(activeSection, content);
  };

  // Save current section
  const handleSaveSection = () => {
    if (currentContent.trim()) {
      onSectionComplete(activeSection);
    }
  };

  // Navigate sections
  const goToPrevSection = () => {
    if (canGoPrev) {
      setActiveSection(SECTIONS[currentIndex - 1].id);
    }
  };

  const goToNextSection = () => {
    if (canGoNext) {
      setActiveSection(SECTIONS[currentIndex + 1].id);
    }
  };

  // Get relevant context for current section
  const getRelevantContext = () => {
    if (!gapAnalysis) return [];
    
    const context: { type: 'missing' | 'match' | 'tip'; text: string }[] = [];
    
    // Add missing requirements as tips
    gapAnalysis.missingRequirements.slice(0, 3).forEach(req => {
      context.push({ type: 'missing', text: req.requirement });
    });

    // Add partial matches
    gapAnalysis.partialMatches.slice(0, 2).forEach(match => {
      context.push({ type: 'tip', text: match.recommendation });
    });

    return context;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Section Tabs */}
      <div className="border-b px-6 py-3">
        <Tabs value={activeSection} onValueChange={(v) => setActiveSection(v as SectionType)}>
          <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
            {SECTIONS.map((section) => {
              const isComplete = completedSections.has(section.id);
              const isActive = section.id === activeSection;
              
              return (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className={cn(
                    "gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                    isComplete && !isActive && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  )}
                >
                  {isComplete ? <Check className="h-3 w-3" /> : section.icon}
                  <span className="hidden sm:inline">{section.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Editor (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {currentConfig.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{currentConfig.label}</h2>
                  <p className="text-sm text-muted-foreground">
                    Section {currentIndex + 1} of {SECTIONS.length}
                  </p>
                </div>
              </div>

              {/* Section Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPrevSection}
                  disabled={!canGoPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNextSection}
                  disabled={!canGoNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content Editor */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <Textarea
                  value={currentContent}
                  onChange={(e) => onContentChange(activeSection, e.target.value)}
                  placeholder={currentConfig.placeholder}
                  className="min-h-[200px] resize-none text-base leading-relaxed"
                />

                {/* Character Count (if applicable) */}
                {charLimit && (
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn(
                      "transition-colors",
                      charStatus === 'low' && "text-amber-500",
                      charStatus === 'high' && "text-red-500",
                      charStatus === 'good' && "text-green-500"
                    )}>
                      {charCount} characters
                      {charStatus === 'low' && ` (minimum ${charLimit.min})`}
                      {charStatus === 'high' && ` (maximum ${charLimit.max})`}
                    </span>
                    <span className="text-muted-foreground">
                      Ideal: {charLimit.ideal} chars
                    </span>
                  </div>
                )}

                {/* Tips */}
                <div className="flex flex-wrap gap-2">
                  {currentConfig.tips.map((tip, i) => (
                    <Badge key={i} variant="secondary" className="text-xs gap-1">
                      <Lightbulb className="h-3 w-3" />
                      {tip}
                    </Badge>
                  ))}
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveSection}
                    disabled={!currentContent.trim() || isEnhancing}
                    className="gap-2"
                  >
                    {isCurrentComplete ? (
                      <>
                        <Check className="h-4 w-4" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Section
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Enhancement Toolbar */}
            <Card>
              <CardContent className="p-4">
                <AIEnhancementToolbar
                  sectionType={activeSection}
                  currentContent={currentContent}
                  onEnhance={handleEnhance}
                  onApplySuggestion={handleApplySuggestion}
                  disabled={isEnhancing || !currentContent.trim()}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right: Context Panel */}
          <div className="space-y-4">
            {/* Job Requirements Context */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Job Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getRelevantContext().length > 0 ? (
                  getRelevantContext().map((item, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "p-2 rounded text-xs",
                        item.type === 'missing' && "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
                        item.type === 'match' && "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
                        item.type === 'tip' && "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                      )}
                    >
                      {item.type === 'missing' && '❌ Missing: '}
                      {item.type === 'tip' && '💡 '}
                      {item.text}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No specific requirements detected for this section.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Progress Overview */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress 
                  value={(completedSections.size / SECTIONS.length) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground text-center">
                  {completedSections.size} of {SECTIONS.length} sections complete
                </p>
                <div className="space-y-1">
                  {SECTIONS.map((section) => (
                    <div 
                      key={section.id}
                      className="flex items-center gap-2 text-xs"
                    >
                      {completedSections.has(section.id) ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />
                      )}
                      <span className={cn(
                        completedSections.has(section.id) && "text-muted-foreground line-through"
                      )}>
                        {section.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="border-t px-6 py-4 bg-muted/30 flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Templates
        </Button>
        <Button 
          onClick={onNext}
          disabled={!allComplete}
          className="gap-2"
        >
          {allComplete ? 'Continue to Quick Glance' : `Complete ${SECTIONS.length - completedSections.size} More Sections`}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
