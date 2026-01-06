import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOptimizerStore } from '@/stores/optimizerStore';
import { ResumeVersion } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, ArrowLeft, Loader2, FileText, Check, Star, Eye, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TemplateSelector, ResumeTemplate, TEMPLATES } from '../components/TemplateSelector';
import { WYSIWYGEditor } from '../components/WYSIWYGEditor';

export function Step5StrategicVersions() {
  const { toast } = useToast();
  
  // Zustand store
  const resumeText = useOptimizerStore(state => state.resumeText);
  const jobDescription = useOptimizerStore(state => state.jobDescription);
  const gapAnalysis = useOptimizerStore(state => state.gapAnalysis);
  const selectedAnswers = useOptimizerStore(state => state.selectedAnswers);
  const customization = useOptimizerStore(state => state.customization);
  const careerProfile = useOptimizerStore(state => state.careerProfile);
  const resumeVersions = useOptimizerStore(state => state.resumeVersions);
  const selectedVersionId = useOptimizerStore(state => state.selectedVersionId);
  const selectedTemplateState = useOptimizerStore(state => state.selectedTemplate);
  const setResumeVersions = useOptimizerStore(state => state.setResumeVersions);
  const selectVersion = useOptimizerStore(state => state.selectVersion);
  const selectTemplate = useOptimizerStore(state => state.selectTemplate);
  const updateSection = useOptimizerStore(state => state.updateSection);
  const setProcessing = useOptimizerStore(state => state.setProcessing);
  const goToNextStep = useOptimizerStore(state => state.goToNextStep);
  const goToPrevStep = useOptimizerStore(state => state.goToPrevStep);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<ResumeVersion | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>(
    TEMPLATES.find(t => t.id === selectedTemplateState?.id) || TEMPLATES[0]
  );
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  
  useEffect(() => {
    if (resumeVersions.length === 0) {
      generateVersions();
    } else {
      const currentVersion = resumeVersions.find(v => v.id === selectedVersionId) || resumeVersions[0];
      setPreviewVersion(currentVersion);
    }
  }, []);
  
  const generateVersions = async () => {
    setIsGenerating(true);
    setProcessing(true, 'Generating strategic resume versions...');
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-resume-versions', {
        body: {
          resumeText,
          jobDescription,
          gapAnalysis,
          selectedAnswers,
          customization,
          careerProfile
        }
      });
      
      if (error) throw error;
      
      const versions: ResumeVersion[] = data.versions || [];
      setResumeVersions(versions);
      
      if (versions.length > 0) {
        setPreviewVersion(versions[0]);
        selectVersion(versions[0].id);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Could not generate resume versions';
      console.error('Generate versions error:', error);
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
  
  const handleSelectVersion = (version: ResumeVersion) => {
    setPreviewVersion(version);
    selectVersion(version.id);
  };

  const handleSelectTemplate = (template: ResumeTemplate) => {
    setSelectedTemplate(template);
    selectTemplate({ id: template.id, name: template.name });
  };

  const handleSectionUpdate = useCallback((sectionId: string, content: string[]) => {
    if (!previewVersion) return;
    
    // Update local preview state
    const updatedSections = previewVersion.sections.map(section =>
      section.id === sectionId 
        ? { ...section, content, isEdited: true }
        : section
    );
    
    const updatedVersion = { ...previewVersion, sections: updatedSections };
    setPreviewVersion(updatedVersion);
    
    // Update in store
    updateSection(previewVersion.id, sectionId, content);
  }, [previewVersion, updateSection]);
  
  if (isGenerating) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Generating strategic resume versions...</p>
          <p className="text-xs text-muted-foreground mt-2">This may take a moment</p>
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
        {/* Version Selection */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Strategic Versions</CardTitle>
              <CardDescription className="text-xs">
                Compare different positioning strategies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {resumeVersions.map((version) => (
                <div
                  key={version.id}
                  onClick={() => handleSelectVersion(version)}
                  className={cn(
                    'p-4 rounded-lg border cursor-pointer transition-all',
                    selectedVersionId === version.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{version.name}</span>
                    </div>
                    {selectedVersionId === version.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{version.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="secondary" className="text-xs">
                      {version.emphasis}
                    </Badge>
                    {version.score && (
                      <Badge variant="outline" className="text-xs">
                        <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                        {version.score}%
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={generateVersions}
                className="w-full mt-4"
              >
                Regenerate Versions
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Resume Preview/Editor */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{previewVersion?.name || 'Resume Preview'}</CardTitle>
                  <CardDescription>{previewVersion?.description}</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  {previewVersion?.score && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{previewVersion.score}%</div>
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
              {previewVersion && (
                <WYSIWYGEditor
                  sections={previewVersion.sections}
                  onSectionUpdate={handleSectionUpdate}
                  readOnly={viewMode === 'preview'}
                />
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
