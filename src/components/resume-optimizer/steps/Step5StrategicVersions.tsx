import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOptimizer } from '../context/OptimizerContext';
import { ResumeVersion } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, ArrowLeft, Loader2, FileText, Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Step5StrategicVersions() {
  const { state, dispatch, goToNextStep, goToPrevStep } = useOptimizer();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<ResumeVersion | null>(null);
  
  useEffect(() => {
    if (state.resumeVersions.length === 0) {
      generateVersions();
    } else {
      setPreviewVersion(state.resumeVersions[0]);
    }
  }, []);
  
  const generateVersions = async () => {
    setIsGenerating(true);
    dispatch({ type: 'SET_PROCESSING', isProcessing: true, message: 'Generating strategic resume versions...' });
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-resume-versions', {
        body: {
          resumeText: state.resumeText,
          jobDescription: state.jobDescription,
          gapAnalysis: state.gapAnalysis,
          selectedAnswers: state.selectedAnswers,
          customization: state.customization,
          careerProfile: state.careerProfile
        }
      });
      
      if (error) throw error;
      
      const versions: ResumeVersion[] = data.versions || [];
      dispatch({ type: 'SET_RESUME_VERSIONS', versions });
      
      if (versions.length > 0) {
        setPreviewVersion(versions[0]);
        dispatch({ type: 'SELECT_VERSION', versionId: versions[0].id });
      }
    } catch (error: any) {
      console.error('Generate versions error:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Could not generate resume versions',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
      dispatch({ type: 'SET_PROCESSING', isProcessing: false });
    }
  };
  
  const handleSelectVersion = (version: ResumeVersion) => {
    setPreviewVersion(version);
    dispatch({ type: 'SELECT_VERSION', versionId: version.id });
  };
  
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
              {state.resumeVersions.map((version) => (
                <div
                  key={version.id}
                  onClick={() => handleSelectVersion(version)}
                  className={cn(
                    'p-4 rounded-lg border cursor-pointer transition-all',
                    state.selectedVersionId === version.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{version.name}</span>
                    </div>
                    {state.selectedVersionId === version.id && (
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
        
        {/* Resume Preview */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{previewVersion?.name || 'Resume Preview'}</CardTitle>
                  <CardDescription>{previewVersion?.description}</CardDescription>
                </div>
                {previewVersion?.score && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{previewVersion.score}%</div>
                    <div className="text-xs text-muted-foreground">Match Score</div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh] pr-4">
                {previewVersion?.sections.map((section) => (
                  <div key={section.id} className="mb-6">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">
                      {section.title}
                    </h3>
                    <ul className="space-y-2">
                      {section.content.map((item, idx) => (
                        <li key={idx} className="text-sm pl-4 border-l-2 border-muted">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </ScrollArea>
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
