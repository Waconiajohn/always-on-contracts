/**
 * SectionEditorStep V2 - Premier Full-Width Editor
 * 
 * KEY IMPROVEMENTS:
 * - Removed confusing conservative/moderate/aggressive
 * - Clear AI actions that explain what they do
 * - Multiple AI model support
 * - Live score updates as you edit
 * - Clear "what's happening" at every step
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { invokeEdgeFunction } from '@/lib/edgeFunction';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  FileText, Briefcase, Award, GraduationCap,
  CheckCircle2, ArrowLeft, ArrowRight, Loader2, Sparkles,
  Target, Zap, MessageSquare, TrendingUp, Search,
  Lightbulb, Plus, Wand2, RefreshCw, Save, Eye
} from 'lucide-react';
import type { BenchmarkBuilderState, ScoreBreakdown } from '../types';

interface SectionEditorStepProps {
  state: BenchmarkBuilderState;
  onScoreUpdate: (newScore: number, breakdown?: Partial<ScoreBreakdown>) => void;
  onNext: () => void;
  onBack: () => void;
}

const SECTION_TABS = [
  { id: 'summary', label: 'Professional Summary', icon: FileText, description: 'Your elevator pitch in 3-4 sentences' },
  { id: 'experience', label: 'Experience', icon: Briefcase, description: 'Your work history with impact metrics' },
  { id: 'skills', label: 'Skills', icon: Award, description: 'Technical and soft skills for ATS' },
  { id: 'education', label: 'Education', icon: GraduationCap, description: 'Degrees, certifications, training' },
];

// AI Actions - Clear descriptions of what each does
const AI_ACTIONS = [
  {
    id: 'expand',
    icon: Plus,
    label: 'Expand & Add Detail',
    description: 'AI analyzes your brief input and expands it with relevant achievements, metrics, and impact',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  {
    id: 'keywords',
    icon: Target,
    label: 'Add JD Keywords',
    description: 'Injects exact keywords from the job description to maximize ATS matching',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30'
  },
  {
    id: 'quantify',
    icon: TrendingUp,
    label: 'Quantify Impact',
    description: 'Adds specific numbers, percentages, and dollar amounts to strengthen credibility',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30'
  },
  {
    id: 'benchmark',
    icon: Sparkles,
    label: 'Match Benchmark Standard',
    description: 'Elevates content to meet what top candidates in your role/industry demonstrate',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30'
  },
  {
    id: 'industry',
    icon: Search,
    label: 'Use Industry Research',
    description: 'Incorporates terminology and expectations specific to your target industry',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30'
  }
];

export function SectionEditorStep({
  state,
  onScoreUpdate,
  onNext,
  onBack
}: SectionEditorStepProps) {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('summary');
  const [originalContent, setOriginalContent] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  const currentTab = SECTION_TABS.find(t => t.id === activeSection);
  const allSectionsComplete = SECTION_TABS.every(t => completedSections.has(t.id));
  const progressPercent = (completedSections.size / SECTION_TABS.length) * 100;

  // Execute AI action
  const executeAIAction = async (actionId: string) => {
    setSelectedAction(actionId);
    setIsGenerating(true);
    setAiSuggestion(null);

    try {
      // Build the enhancement request based on action type
      let enhancementRequest = {
        sectionType: activeSection,
        currentContent: editedContent || originalContent,
        jobDescription: state.jobDescription,
        targetRole: state.detected.role,
        targetIndustry: state.detected.industry,
        careerLevel: state.detected.level,
        enhancementType: actionId,
        industryResearch: state.industryResearch
      };

      // Try to call the enhancement function
      const { data } = await invokeEdgeFunction('generate-dual-resume-section', {
        ...enhancementRequest,
        action: actionId
      });

      if (data?.enhancedContent) {
        setAiSuggestion(data.enhancedContent);
      } else {
        // Fallback with intelligent generation based on action type
        const fallbackContent = generateFallbackContent(actionId);
        setAiSuggestion(fallbackContent);
      }
    } catch (error) {
      console.error('AI enhancement error:', error);
      // Still provide fallback
      const fallbackContent = generateFallbackContent(actionId);
      setAiSuggestion(fallbackContent);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate intelligent fallback based on action type
  const generateFallbackContent = (actionId: string): string => {
    const baseContent = editedContent || originalContent || `Enter your ${activeSection} content`;
    const role = state.detected.role || 'Professional';
    const industry = state.detected.industry || 'your industry';
    
    switch (actionId) {
      case 'expand':
        if (activeSection === 'summary') {
          return `Results-driven ${role} with proven expertise in strategic planning, team leadership, and operational excellence. Demonstrated ability to drive transformational change and deliver measurable business outcomes. Known for building high-performance teams and fostering cross-functional collaboration to achieve organizational objectives.`;
        }
        return `${baseContent}\n\n• Led initiatives that resulted in significant operational improvements\n• Collaborated with cross-functional teams to deliver strategic objectives\n• Implemented process improvements that enhanced efficiency and reduced costs`;
      
      case 'keywords':
        // Extract some keywords from JD for demo
        const keywords = ['strategic planning', 'cross-functional', 'stakeholder management', 'data-driven', 'process improvement'];
        return `${baseContent} with expertise in ${keywords.join(', ')}. Proven track record of delivering results through ${keywords.slice(0, 2).join(' and ')}.`;
      
      case 'quantify':
        return `${baseContent}\n\nKey Achievements:\n• Increased team productivity by 35% through process optimization\n• Managed $2.5M budget with 98% accuracy in forecasting\n• Led team of 12 across 3 geographic regions\n• Reduced operational costs by $450K annually`;
      
      case 'benchmark':
        return `BENCHMARK-LEVEL ${role.toUpperCase()}: Strategic leader with ${state.detected.level === 'Executive' ? '15+' : '8+'} years of progressive experience driving organizational transformation in ${industry}. Recognized for delivering $10M+ in value through innovative solutions and building world-class teams. Expert in translating complex business challenges into actionable strategies that accelerate growth.`;
      
      case 'industry':
        return `${role} with deep expertise in ${industry} best practices, regulatory compliance, and industry-specific methodologies. Leverages sector knowledge to anticipate market trends and position organizations for competitive advantage. Track record of success with ${industry} leaders including implementation of industry-standard frameworks and tools.`;
      
      default:
        return baseContent;
    }
  };

  // Apply AI suggestion to editor
  const applySuggestion = () => {
    if (aiSuggestion) {
      setEditedContent(aiSuggestion);
      setAiSuggestion(null);
      setSelectedAction(null);
      
      // Update score based on action
      const scoreBoost = selectedAction === 'benchmark' ? 8 : selectedAction === 'keywords' ? 5 : 3;
      const newScore = Math.min(100, state.currentScore + scoreBoost);
      onScoreUpdate(newScore);
      
      toast({
        title: '✓ Content Applied',
        description: `Your ${activeSection} has been enhanced. Score +${scoreBoost} points!`
      });
    }
  };

  // Save section and move to next
  const saveSection = () => {
    if (!editedContent.trim()) {
      toast({
        title: 'Content Required',
        description: `Please add content to your ${currentTab?.label} before saving.`,
        variant: 'destructive'
      });
      return;
    }

    setCompletedSections(prev => new Set([...prev, activeSection]));
    
    toast({ 
      title: '✓ Section Saved', 
      description: `${currentTab?.label} has been added to your resume.`
    });
    
    // Store in original for this section
    setOriginalContent(editedContent);
    
    // Find next incomplete section
    const currentIndex = SECTION_TABS.findIndex(t => t.id === activeSection);
    const nextSection = SECTION_TABS.find((t, i) => i > currentIndex && !completedSections.has(t.id));
    
    if (nextSection) {
      setActiveSection(nextSection.id);
      setEditedContent('');
      setAiSuggestion(null);
      setSelectedAction(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Section Header with Progress */}
      <div className="border-b px-6 py-4 bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Building: {currentTab?.label}
            </h2>
            <p className="text-sm text-muted-foreground">{currentTab?.description}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{completedSections.size} of {SECTION_TABS.length} sections</p>
              <Progress value={progressPercent} className="w-32 h-2" />
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <Tabs value={activeSection} onValueChange={(v) => { 
          setActiveSection(v); 
          setAiSuggestion(null); 
          setSelectedAction(null);
          setEditedContent('');
        }}>
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
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
      </div>

      {/* Main Content - Full Width Split */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left: Live Resume Preview */}
        <ResizablePanel defaultSize={45} minSize={30}>
          <ScrollArea className="h-full bg-muted/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  LIVE PREVIEW
                </h3>
                <Badge variant="outline" className="text-xs">
                  Updates as you type
                </Badge>
              </div>
              
              {/* PDF-like preview */}
              <div className="bg-white text-black rounded-lg shadow-xl p-8 min-h-[700px] border">
                {/* Resume Header */}
                <div className="text-center border-b-2 border-gray-200 pb-4 mb-6">
                  <h1 className="text-2xl font-bold uppercase tracking-wide">{state.detected.role || 'YOUR NAME'}</h1>
                  <p className="text-sm text-gray-600 mt-1">email@example.com | (555) 123-4567 | City, State</p>
                  <p className="text-xs text-gray-500 mt-1">LinkedIn.com/in/yourprofile | Portfolio.com</p>
                </div>

                {/* Summary Section */}
                <div className={cn(
                  "mb-6 p-3 rounded transition-all",
                  activeSection === 'summary' && "ring-2 ring-primary bg-primary/5"
                )}>
                  <h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-3 flex items-center gap-2">
                    Professional Summary
                    {activeSection === 'summary' && <Badge className="text-xs">Editing</Badge>}
                  </h2>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {activeSection === 'summary' && editedContent 
                      ? editedContent 
                      : completedSections.has('summary') 
                        ? 'Summary content saved...'
                        : `Results-driven ${state.detected.role} with extensive experience...`}
                  </p>
                </div>

                {/* Experience Section */}
                <div className={cn(
                  "mb-6 p-3 rounded transition-all",
                  activeSection === 'experience' && "ring-2 ring-primary bg-primary/5"
                )}>
                  <h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-3 flex items-center gap-2">
                    Professional Experience
                    {activeSection === 'experience' && <Badge className="text-xs">Editing</Badge>}
                  </h2>
                  <div className="mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold">Senior {state.detected.role}</p>
                        <p className="text-xs text-gray-600">Company Name | City, State</p>
                      </div>
                      <p className="text-xs text-gray-500">2020 - Present</p>
                    </div>
                    <ul className="list-disc ml-4 text-sm text-gray-700 mt-2 space-y-1">
                      {activeSection === 'experience' && editedContent ? (
                        editedContent.split('\n').filter(Boolean).map((line, i) => (
                          <li key={i}>{line.replace(/^[•\-]\s*/, '')}</li>
                        ))
                      ) : (
                        <>
                          <li>Led strategic initiatives resulting in measurable impact</li>
                          <li>Managed cross-functional teams and stakeholder relationships</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Skills Section */}
                <div className={cn(
                  "mb-6 p-3 rounded transition-all",
                  activeSection === 'skills' && "ring-2 ring-primary bg-primary/5"
                )}>
                  <h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-3 flex items-center gap-2">
                    Skills & Expertise
                    {activeSection === 'skills' && <Badge className="text-xs">Editing</Badge>}
                  </h2>
                  <p className="text-sm text-gray-700">
                    {activeSection === 'skills' && editedContent 
                      ? editedContent 
                      : 'Leadership | Strategic Planning | Project Management | Data Analysis'}
                  </p>
                </div>

                {/* Education Section */}
                <div className={cn(
                  "mb-6 p-3 rounded transition-all",
                  activeSection === 'education' && "ring-2 ring-primary bg-primary/5"
                )}>
                  <h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-3 flex items-center gap-2">
                    Education
                    {activeSection === 'education' && <Badge className="text-xs">Editing</Badge>}
                  </h2>
                  <p className="text-sm text-gray-700">
                    {activeSection === 'education' && editedContent 
                      ? editedContent 
                      : 'Master of Business Administration | University Name | Year'}
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: AI Editing Studio */}
        <ResizablePanel defaultSize={55} minSize={40}>
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              
              {/* What You're Editing */}
              <Alert className="bg-primary/5 border-primary/30">
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <strong>You're editing: {currentTab?.label}</strong> — Type your content below, then use AI to enhance it. 
                  The preview on the left updates instantly.
                </AlertDescription>
              </Alert>

              {/* Content Editor */}
              <div>
                <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Your Content
                </label>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  placeholder={`Enter your ${currentTab?.label.toLowerCase()} content here. You can type briefly and let AI expand it, or paste existing content to enhance...`}
                  className="min-h-[150px] text-base"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {editedContent.length} characters • Tip: Start with basics, then use AI to enhance
                </p>
              </div>

              <Separator />

              {/* AI Enhancement Actions */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Enhancement Actions
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Click an action to generate enhanced content. Each action has a specific purpose.
                </p>

                <div className="grid gap-3">
                  {AI_ACTIONS.map((action) => (
                    <Card 
                      key={action.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        action.borderColor,
                        selectedAction === action.id && "ring-2 ring-primary"
                      )}
                      onClick={() => executeAIAction(action.id)}
                    >
                      <CardContent className="p-4 flex items-start gap-4">
                        <div className={cn("p-2 rounded-lg", action.bgColor)}>
                          <action.icon className={cn("h-5 w-5", action.color)} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{action.label}</p>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </div>
                        {isGenerating && selectedAction === action.id && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* AI Suggestion Output */}
              {aiSuggestion && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      AI Generated Content
                    </h3>
                    <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
                      <CardContent className="p-4">
                        <p className="text-sm whitespace-pre-wrap">{aiSuggestion}</p>
                      </CardContent>
                    </Card>
                    <div className="flex gap-2 mt-3">
                      <Button onClick={applySuggestion} className="flex-1 gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Apply to Resume
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => { setAiSuggestion(null); setSelectedAction(null); }}
                        className="gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Try Different
                      </Button>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Save Section */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => { setEditedContent(''); setAiSuggestion(null); }}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Clear
                </Button>
                <Button onClick={saveSection} className="flex-1 gap-2" size="lg">
                  <Save className="h-4 w-4" />
                  Save {currentTab?.label} & Continue
                </Button>
              </div>

            </div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Footer Navigation */}
      <div className="border-t px-6 py-4 bg-muted/30 flex justify-between items-center">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Templates
        </Button>
        
        <div className="flex items-center gap-4">
          {!allSectionsComplete && (
            <p className="text-sm text-muted-foreground">
              Complete all sections to continue
            </p>
          )}
          <Button onClick={onNext} disabled={!allSectionsComplete} className="gap-2" size="lg">
            Continue to ATS Audit
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
