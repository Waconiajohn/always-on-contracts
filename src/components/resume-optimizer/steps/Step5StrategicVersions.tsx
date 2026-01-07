import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOptimizerStore } from '@/stores/optimizerStore';
import { BenchmarkResume, ResumeSection, ChangelogEntry } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, ArrowLeft, Loader2, FileText, Star, Eye, Edit3, ChevronDown, ChevronRight, History, RefreshCw, MessageSquare } from 'lucide-react';

import { TemplateSelector, ResumeTemplate, TEMPLATES } from '../components/TemplateSelector';
import { WYSIWYGEditor } from '../components/WYSIWYGEditor';

export function Step5StrategicVersions() {
  const { toast } = useToast();
  
  // Zustand store - new benchmark resume system
  const resumeText = useOptimizerStore(state => state.resumeText);
  const jobDescription = useOptimizerStore(state => state.jobDescription);
  const fitBlueprint = useOptimizerStore(state => state.fitBlueprint);
  const missingBulletResponses = useOptimizerStore(state => state.missingBulletResponses);
  const customization = useOptimizerStore(state => state.customization);
  const benchmarkResume = useOptimizerStore(state => state.benchmarkResume);
  const selectedTemplateState = useOptimizerStore(state => state.selectedTemplate);
  const setBenchmarkResume = useOptimizerStore(state => state.setBenchmarkResume);
  const updateBenchmarkSection = useOptimizerStore(state => state.updateBenchmarkSection);
  const selectTemplate = useOptimizerStore(state => state.selectTemplate);
  const setProcessing = useOptimizerStore(state => state.setProcessing);
  const goToNextStep = useOptimizerStore(state => state.goToNextStep);
  const goToPrevStep = useOptimizerStore(state => state.goToPrevStep);
  const addVersionHistory = useOptimizerStore(state => state.addVersionHistory);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [previewSections, setPreviewSections] = useState<ResumeSection[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>(
    TEMPLATES.find(t => t.id === selectedTemplateState?.id) || TEMPLATES[0]
  );
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const [showChangelog, setShowChangelog] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  
  useEffect(() => {
    if (!benchmarkResume) {
      generateBenchmark();
    } else {
      setPreviewSections(benchmarkResume.sections);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [benchmarkResume]);
  
  const generateBenchmark = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    setProcessing(true, 'Generating benchmark resume...');
    
    try {
      const { data, error } = await supabase.functions.invoke('benchmark-resume', {
        body: {
          resumeText,
          jobDescription,
          fitBlueprint,
          missingBulletResponses,
          customization
        }
      });
      
      if (error) {
        // Handle rate limit and payment errors
        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
          setGenerateError('You\'ve reached your usage limit. Please try again later.');
          toast({
            title: 'Rate Limit Reached',
            description: 'Please wait a moment before trying again.',
            variant: 'destructive'
          });
          return;
        }
        if (error.message?.includes('402') || error.message?.includes('payment')) {
          setGenerateError('This feature requires an active subscription.');
          toast({
            title: 'Subscription Required',
            description: 'Please upgrade to access this feature.',
            variant: 'destructive'
          });
          return;
        }
        throw error;
      }
      
      const benchmark: BenchmarkResume = {
        resumeText: data.resumeText || '',
        sections: data.sections || [],
        changelog: data.changelog || [],
        followUpQuestions: data.followUpQuestions || []
      };
      
      setBenchmarkResume(benchmark);
      setPreviewSections(benchmark.sections);
      
      // Save version history
      addVersionHistory({
        stepCompleted: 'strategic-versions',
        resumeSnapshot: benchmark.resumeText,
        changeDescription: 'Benchmark resume generated',
        benchmarkResume: benchmark
      });
      
      toast({
        title: 'Benchmark Resume Generated',
        description: 'Your optimized resume is ready for review.'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Could not generate benchmark resume';
      console.error('Generate benchmark error:', error);
      setGenerateError(errorMessage);
      toast({
        title: 'Generation Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
      setProcessing(false);
    }
  };

  const handleSelectTemplate = (template: ResumeTemplate) => {
    setSelectedTemplate(template);
    selectTemplate({ id: template.id, name: template.name });
  };

  const handleSectionUpdate = useCallback((sectionId: string, content: string[]) => {
    // Update local preview state
    const updatedSections = previewSections.map(section =>
      section.id === sectionId 
        ? { ...section, content, isEdited: true }
        : section
    );
    
    setPreviewSections(updatedSections);
    
    // Update in store
    updateBenchmarkSection(sectionId, content);
  }, [previewSections, updateBenchmarkSection]);

  const renderChangelogEntry = (entry: ChangelogEntry, index: number) => (
    <div key={index} className="p-3 rounded-lg border bg-muted/30">
      <div className="flex items-start gap-2">
        <Badge variant="outline" className="text-xs shrink-0">{entry.section}</Badge>
        <div className="flex-1">
          <p className="text-sm">{entry.change}</p>
          <p className="text-xs text-muted-foreground mt-1">{entry.rationale}</p>
          {entry.evidenceUsed && entry.evidenceUsed.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {entry.evidenceUsed.map((ev, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">{ev}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  if (isGenerating) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Generating benchmark resume...</p>
          <p className="text-xs text-muted-foreground mt-2">This may take 30-60 seconds</p>
        </CardContent>
      </Card>
    );
  }

  if (generateError) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive mb-4">{generateError}</p>
          <div className="flex gap-2">
            <Button onClick={goToPrevStep} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={generateBenchmark}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      {/* Template Selector */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Choose Template</CardTitle>
          <CardDescription className="text-xs">
            Select a template style for your resume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateSelector
            selectedTemplateId={selectedTemplate.id}
            onSelectTemplate={handleSelectTemplate}
            compact
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Changelog & Follow-up Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Changelog */}
          {benchmarkResume?.changelog && benchmarkResume.changelog.length > 0 && (
            <Collapsible open={showChangelog} onOpenChange={setShowChangelog}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <History className="h-4 w-4" />
                        What Changed
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{benchmarkResume.changelog.length}</Badge>
                        {showChangelog ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {benchmarkResume.changelog.map(renderChangelogEntry)}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Follow-up Questions */}
          {benchmarkResume?.followUpQuestions && benchmarkResume.followUpQuestions.length > 0 && (
            <Collapsible open={showFollowUp} onOpenChange={setShowFollowUp}>
              <Card className="border-amber-200 bg-amber-50/30">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-amber-100/50 transition-colors pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                        <MessageSquare className="h-4 w-4" />
                        Optional Enhancements
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-amber-300 text-amber-700">
                          {benchmarkResume.followUpQuestions.length}
                        </Badge>
                        {showFollowUp ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground mb-3">
                      Answer these to further strengthen your resume
                    </p>
                    <div className="space-y-2">
                      {benchmarkResume.followUpQuestions.map((question, idx) => (
                        <div key={idx} className="p-3 rounded-lg border bg-background">
                          <p className="text-sm">{question}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Regenerate Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={generateBenchmark}
            className="w-full gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate Resume
          </Button>
        </div>
        
        {/* Resume Preview/Editor */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Benchmark Resume
                  </CardTitle>
                  <CardDescription>Your optimized resume tailored to the job</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  {fitBlueprint?.overallFitScore && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary flex items-center gap-1">
                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                        {fitBlueprint.overallFitScore}%
                      </div>
                      <div className="text-xs text-muted-foreground">Match Score</div>
                    </div>
                  )}
                  <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'preview' | 'edit')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="preview" className="gap-1">
                        <Eye className="h-3 w-3" />
                        Preview
                      </TabsTrigger>
                      <TabsTrigger value="edit" className="gap-1">
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {previewSections.length > 0 ? (
                <WYSIWYGEditor
                  sections={previewSections}
                  onSectionUpdate={handleSectionUpdate}
                  readOnly={viewMode === 'preview'}
                />
              ) : (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  No resume content available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={goToPrevStep} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={goToNextStep} className="gap-2">
          Get Hiring Manager Review
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
