/**
 * Elite Resume Builder V5 - Main Orchestrator
 * Two-column layout: Draft (left) + Refinement (right)
 * Page 2: Match Analysis
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';
import { invokeEdgeFunction } from '@/lib/edgeFunction';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

import { ResumeDraftPanel } from './components/ResumeDraftPanel';
import { RefinementPanel } from './components/RefinementPanel';
import { MatchAnalysisView } from './components/MatchAnalysisView';
import { ResumeLoadingSkeleton } from './components/LoadingSkeleton';
import { ThermometerScore } from '@/components/quick-score/ThermometerScore';
import { useEliteResumeGeneration } from './hooks/useEliteResumeGeneration';

import type { EliteResumeData, ResumeBullet, MatchAnalysis } from './types';

interface EliteResumeBuilderProps {
  initialJobDescription?: string;
  initialResumeText?: string;
}

export default function EliteResumeBuilder({
  initialJobDescription = '',
  initialResumeText = ''
}: EliteResumeBuilderProps) {
  const location = useLocation();
  const { toast } = useToast();
  
  const [currentView, setCurrentView] = useState<'editor' | 'analysis'>('editor');
  const [resumeData, setResumeData] = useState<EliteResumeData | null>(null);
  const [selectedBulletId, setSelectedBulletId] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [matchAnalysis, setMatchAnalysis] = useState<MatchAnalysis | null>(null);

  const { generateEliteResume, regenerateBullet, isGenerating, progress } = useEliteResumeGeneration();

  // Initialize from location state or generate new
  useEffect(() => {
    const stateData = location.state as any;
    
    if (stateData?.jobDescription) {
      setJobDescription(stateData.jobDescription);
    }

    // Auto-generate on mount if we have job description
    if (stateData?.jobDescription && !resumeData) {
      handleGenerate(stateData);
    }
  }, [location.state]);

  const handleGenerate = async (options?: any) => {
    const result = await generateEliteResume({
      jobDescription: options?.jobDescription || jobDescription,
      jobTitle: options?.jobTitle,
      industry: options?.industry,
      resumeText: initialResumeText,
      userId: options?.userId
    });

    if (result) {
      setResumeData(result);
      toast({
        title: 'Resume Generated!',
        description: 'Review the color-coded sections and refine as needed.'
      });
    }
  };

  const handleBulletSave = (bulletId: string, newText: string) => {
    if (!resumeData) return;

    const updatedSections = resumeData.sections.map(section => ({
      ...section,
      bullets: section.bullets.map(bullet =>
        bullet.id === bulletId
          ? { ...bullet, userEditedText: newText, isEdited: true }
          : bullet
      )
    }));

    setResumeData({
      ...resumeData,
      sections: updatedSections
    });

    toast({
      title: 'Changes Saved',
      description: 'Your edits have been applied.'
    });
  };

  const handleBulletRegenerate = async (bulletId: string) => {
    if (!resumeData) return;

    const section = resumeData.sections.find(s =>
      s.bullets.some(b => b.id === bulletId)
    );
    const bullet = section?.bullets.find(b => b.id === bulletId);

    if (!section || !bullet) return;

    const newText = await regenerateBullet(bulletId, {
      section,
      jobDescription,
      currentText: bullet.userEditedText || bullet.text
    });

    if (newText) {
      handleBulletSave(bulletId, newText);
    }
  };

  const handleBulletRemove = (bulletId: string) => {
    if (!resumeData) return;

    const updatedSections = resumeData.sections.map(section => ({
      ...section,
      bullets: section.bullets.filter(bullet => bullet.id !== bulletId)
    }));

    setResumeData({
      ...resumeData,
      sections: updatedSections
    });

    setSelectedBulletId(null);
    
    toast({
      title: 'Content Removed',
      description: 'The item has been deleted.'
    });
  };

  const handleViewAnalysis = async () => {
    if (!resumeData) return;

    try {
      const { data, error } = await invokeEdgeFunction<{ matchAnalysis: MatchAnalysis }>(
        'analyze-resume-match',
        {
          resumeData,
          jobDescription
        }
      );

      if (error || !data) {
        throw new Error('Failed to analyze match');
      }

      setMatchAnalysis(data.matchAnalysis);
      setCurrentView('analysis');
    } catch (error) {
      console.error('Error analyzing match:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Could not generate match analysis. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleExport = async () => {
    if (!resumeData) return;

    try {
      const { exportResumeAsPDF } = await import('./utils/exportResume');
      await exportResumeAsPDF(resumeData);
      
      toast({
        title: 'Export Complete',
        description: 'Your resume has been downloaded.'
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Could not export resume. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getSelectedBullet = (): ResumeBullet | null => {
    if (!resumeData || !selectedBulletId) return null;

    for (const section of resumeData.sections) {
      // Check if this is a paragraph selection
      if (selectedBulletId === `${section.id}-paragraph` && section.paragraph) {
        // Create a ResumeBullet-like object for the paragraph
        return {
          id: selectedBulletId,
          text: section.paragraph,
          confidence: 'enhanced',
          source: {
            type: 'ai_generated'
          }
        };
      }

      // Check regular bullets
      const bullet = section.bullets.find(b => b.id === selectedBulletId);
      if (bullet) return bullet;
    }

    return null;
  };

  // Loading state
  if (isGenerating && !resumeData) {
    return (
      <div className="h-screen flex flex-col">
        <div className="border-b p-4 bg-background">
          <div className="max-w-[1800px] mx-auto">
            <div className="flex items-center justify-between">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              <div className="text-center flex-1 mx-4">
                <h2 className="text-xl font-bold">Creating Your Ultimate Resume</h2>
                <p className="text-sm text-muted-foreground">
                  Building an elite resume to position you as the "must speak to" candidate—review and refine as needed
                </p>
              </div>
              <div className="w-8" />
            </div>
            <Progress value={progress} className="h-2 mt-4" />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="max-w-[1800px] mx-auto py-8 grid grid-cols-5 gap-6">
            <div className="col-span-3">
              <ResumeLoadingSkeleton />
            </div>
            <div className="col-span-2">
              <div className="p-6">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>✓ Analyzing job requirements</p>
                  <p>✓ Matching with your experience</p>
                  <p>✓ Generating tailored content</p>
                  <p className="animate-pulse">✓ Optimizing for ATS...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Match analysis view
  if (currentView === 'analysis' && matchAnalysis && resumeData) {
    return (
      <MatchAnalysisView
        resumeData={resumeData}
        matchAnalysis={matchAnalysis}
        jobDescription={jobDescription}
        onBack={() => setCurrentView('editor')}
        onExport={handleExport}
      />
    );
  }

  // Main editor view
  return (
    <div className="h-screen flex flex-col">
      {/* Header with score and actions */}
      <div className="border-b p-4 bg-background">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {resumeData && (
              <ThermometerScore
                score={resumeData.overallScore}
                tier={resumeData.tier}
                pointsToNextTier={0}
                nextTierThreshold={90}
              />
            )}
            <div className="border-l pl-4">
              <p className="text-sm font-medium">Your Ultimate Resume</p>
              <p className="text-xs text-muted-foreground">
                Built from your resume + career vault + industry research + job analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleViewAnalysis}
              disabled={!resumeData}
            >
              View Match Analysis
            </Button>
            <Button onClick={handleExport} disabled={!resumeData}>
              Export Resume
            </Button>
          </div>
        </div>
      </div>

      {/* Two-column resizable layout - FULL WIDTH */}
      {resumeData ? (
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left: Resume Draft */}
          <ResizablePanel defaultSize={65} minSize={45} maxSize={75}>
            <ResumeDraftPanel
              resumeData={resumeData}
              selectedBulletId={selectedBulletId}
              onSelectBullet={setSelectedBulletId}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right: Refinement Panel */}
          <ResizablePanel defaultSize={35} minSize={25} maxSize={55}>
            <RefinementPanel
              selectedBullet={getSelectedBullet()}
              onSave={handleBulletSave}
              onRegenerate={handleBulletRegenerate}
              onRemove={handleBulletRemove}
              isProcessing={isGenerating}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">No Resume Generated</h2>
            <p className="text-muted-foreground">
              Start by providing a job description to generate your elite resume
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
