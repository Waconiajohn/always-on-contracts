/**
 * SectionEditorStep - Full-width section-by-section editing
 * Left: Live PDF preview | Right: AI editing studio
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { invokeEdgeFunction } from '@/lib/edgeFunction';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  FileText, Briefcase, Award, GraduationCap,
  CheckCircle2, ArrowLeft, ArrowRight, Loader2, Sparkles,
  Wand2, RefreshCw, ThumbsUp, ThumbsDown, Star
} from 'lucide-react';
import type { BenchmarkBuilderState, ResumeSection, ScoreBreakdown } from '../types';

interface SectionEditorStepProps {
  state: BenchmarkBuilderState;
  onUpdateSection: (sectionId: string, updates: Partial<ResumeSection>) => void;
  onScoreUpdate: (newScore: number, breakdown?: Partial<ScoreBreakdown>) => void;
  onNext: () => void;
  onBack: () => void;
  onUpdateState: (updates: Partial<BenchmarkBuilderState>) => void;
}

const SECTION_TABS = [
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'skills', label: 'Skills', icon: Award },
  { id: 'education', label: 'Education', icon: GraduationCap },
];

export function SectionEditorStep({
  state,
  onUpdateSection,
  onScoreUpdate,
  onNext,
  onBack,
  onUpdateState
}: SectionEditorStepProps) {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('summary');
  const [editedContent, setEditedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [alternatives, setAlternatives] = useState<{
    conservative: string;
    moderate: string;
    aggressive: string;
  } | null>(null);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  const generateAlternatives = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await invokeEdgeFunction('get-refinement-suggestions', {
        bulletText: editedContent || `Sample ${activeSection} content for ${state.detected.role}`,
        jobDescription: state.jobDescription,
        requirement: '',
        originalText: ''
      });

      if (data?.alternativeVersions) {
        setAlternatives(data.alternativeVersions);
      } else {
        // Generate mock alternatives for demonstration
        setAlternatives({
          conservative: `${editedContent || 'Original content'} (minor polish applied)`,
          moderate: `Enhanced ${activeSection} content with industry keywords and metrics for ${state.detected.role} in ${state.detected.industry}`,
          aggressive: `BENCHMARK-LEVEL ${activeSection.toUpperCase()}: Strategic ${state.detected.role} with proven track record of transformational leadership and measurable business impact across ${state.detected.industry}`
        });
      }
    } catch (error) {
      console.error('Error generating alternatives:', error);
      toast({
        title: 'Generation failed',
        description: 'Could not generate alternatives. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const applyAlternative = (type: 'conservative' | 'moderate' | 'aggressive') => {
    if (alternatives?.[type]) {
      setEditedContent(alternatives[type]);
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} version applied` });
      
      // Simulate score update based on alternative type
      const scoreBoost = type === 'conservative' ? 2 : type === 'moderate' ? 5 : 10;
      onScoreUpdate(Math.min(100, state.currentScore + scoreBoost));
    }
  };

  const saveSection = () => {
    setCompletedSections(prev => new Set([...prev, activeSection]));
    toast({ title: 'Section saved', description: `${activeSection} has been saved.` });
    
    // Auto-advance to next incomplete section
    const currentIndex = SECTION_TABS.findIndex(t => t.id === activeSection);
    const nextSection = SECTION_TABS.find((t, i) => i > currentIndex && !completedSections.has(t.id));
    if (nextSection) {
      setActiveSection(nextSection.id);
      setAlternatives(null);
      setEditedContent('');
    }
  };

  const allSectionsComplete = SECTION_TABS.every(t => completedSections.has(t.id));

  return (
    <div className="h-full flex flex-col">
      {/* Section Tabs */}
      <div className="border-b px-4 py-2 bg-muted/30">
        <div className="flex items-center justify-between">
          <Tabs value={activeSection} onValueChange={(v) => { setActiveSection(v); setAlternatives(null); }}>
            <TabsList>
              {SECTION_TABS.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {completedSections.has(tab.id) && (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {completedSections.size}/{SECTION_TABS.length} Complete
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width Split */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left: Live PDF Preview */}
        <ResizablePanel defaultSize={50} minSize={35}>
          <ScrollArea className="h-full">
            <div className="p-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">LIVE PREVIEW</h3>
              <div className="bg-white text-black rounded-lg shadow-lg p-8 min-h-[600px]">
                {/* Resume Header */}
                <div className="text-center border-b pb-4 mb-4">
                  <h1 className="text-xl font-bold uppercase">{state.detected.role || 'Your Name'}</h1>
                  <p className="text-sm text-gray-600">email@example.com | (555) 123-4567 | City, State</p>
                </div>

                {/* Summary Section */}
                <div className={cn("mb-4", activeSection === 'summary' && "ring-2 ring-primary rounded p-2 bg-primary/5")}>
                  <h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-2">Professional Summary</h2>
                  <p className="text-sm text-gray-700">
                    {activeSection === 'summary' && editedContent ? editedContent : 
                      `Results-driven ${state.detected.role} with extensive experience in ${state.detected.industry}. Proven track record of delivering measurable business outcomes...`}
                  </p>
                </div>

                {/* Experience Section */}
                <div className={cn("mb-4", activeSection === 'experience' && "ring-2 ring-primary rounded p-2 bg-primary/5")}>
                  <h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-2">Professional Experience</h2>
                  <div className="mb-3">
                    <div className="flex justify-between">
                      <p className="text-sm font-semibold">Senior {state.detected.role}</p>
                      <p className="text-sm text-gray-500">2020 - Present</p>
                    </div>
                    <p className="text-sm text-gray-600">Company Name | City, State</p>
                    <ul className="list-disc ml-4 text-sm text-gray-700 mt-1">
                      <li>{activeSection === 'experience' && editedContent ? editedContent : 'Led strategic initiatives resulting in measurable business impact'}</li>
                      <li>Managed cross-functional teams and stakeholder relationships</li>
                    </ul>
                  </div>
                </div>

                {/* Skills Section */}
                <div className={cn("mb-4", activeSection === 'skills' && "ring-2 ring-primary rounded p-2 bg-primary/5")}>
                  <h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-2">Skills</h2>
                  <p className="text-sm text-gray-700">
                    {activeSection === 'skills' && editedContent ? editedContent : 
                      'Leadership, Strategic Planning, Project Management, Cross-functional Collaboration, Data Analysis'}
                  </p>
                </div>

                {/* Education Section */}
                <div className={cn("mb-4", activeSection === 'education' && "ring-2 ring-primary rounded p-2 bg-primary/5")}>
                  <h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-2">Education</h2>
                  <p className="text-sm text-gray-700">
                    {activeSection === 'education' && editedContent ? editedContent : 
                      'Master of Business Administration | University Name | Year'}
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: AI Editing Studio */}
        <ResizablePanel defaultSize={50} minSize={35}>
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Editing: {SECTION_TABS.find(t => t.id === activeSection)?.label}</h3>
                <p className="text-sm text-muted-foreground">Use AI to generate different versions, then save when satisfied</p>
              </div>

              {/* Current Content */}
              <div>
                <label className="text-sm font-medium mb-2 block">Your Content</label>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  placeholder={`Enter or paste your ${activeSection} content here...`}
                  className="min-h-[120px]"
                />
              </div>

              {/* Generate Button */}
              <Button onClick={generateAlternatives} disabled={isGenerating} className="w-full gap-2">
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate AI Alternatives
              </Button>

              {/* AI Alternatives */}
              {alternatives && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">AI Versions - Click to Apply</h4>
                  
                  {/* Conservative */}
                  <Card className="cursor-pointer hover:border-blue-500 transition-colors" onClick={() => applyAlternative('conservative')}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge variant="secondary">Conservative</Badge>
                        <span className="text-xs text-muted-foreground">+2-5 points • Subtle polish</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">{alternatives.conservative}</p>
                    </CardContent>
                  </Card>

                  {/* Moderate */}
                  <Card className="cursor-pointer hover:border-amber-500 ring-2 ring-amber-500/30 transition-colors" onClick={() => applyAlternative('moderate')}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge className="bg-amber-500">
                          <Star className="h-3 w-3 mr-1" />
                          Recommended
                        </Badge>
                        <span className="text-xs text-muted-foreground">+10-15 points • Optimized</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">{alternatives.moderate}</p>
                    </CardContent>
                  </Card>

                  {/* Aggressive */}
                  <Card className="cursor-pointer hover:border-red-500 transition-colors" onClick={() => applyAlternative('aggressive')}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge variant="destructive">Aggressive</Badge>
                        <span className="text-xs text-muted-foreground">+20-30 points • Benchmark level</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">{alternatives.aggressive}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Separator />

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAlternatives(null)} className="flex-1 gap-1">
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </Button>
                <Button onClick={saveSection} className="flex-1 gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Save & Continue
                </Button>
              </div>
            </div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Footer Navigation */}
      <div className="border-t px-6 py-4 bg-muted/30 flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Templates
        </Button>
        <Button onClick={onNext} disabled={!allSectionsComplete} className="gap-2">
          Continue to ATS Audit
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
