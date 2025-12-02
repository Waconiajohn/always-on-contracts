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

import { ResumeDraftPanel } from './components/ResumeDraftPanel';
import { RefinementPanel } from './components/RefinementPanel';
import { MatchAnalysisView } from './components/MatchAnalysisView';
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

    if (!section) return;

    const newText = await regenerateBullet(bulletId, {
      section,
      jobDescription
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

  const handleViewAnalysis = () => {
    // Generate match analysis
    if (!resumeData) return;

    // TODO: Call edge function to analyze match
    const mockAnalysis: MatchAnalysis = {
      overallMatch: 85,
      coveredRequirements: ['Experience with React', 'Team leadership', 'Project management'],
      uncoveredRequirements: ['5+ years experience', 'Masters degree'],
      strengthAreas: ['Technical skills', 'Leadership experience'],
      improvementAreas: ['Education credentials', 'Years of experience']
    };

    setMatchAnalysis(mockAnalysis);
    setCurrentView('analysis');
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Your resume is being prepared for download.'
    });
  };

  const getSelectedBullet = (): ResumeBullet | null => {
    if (!resumeData || !selectedBulletId) return null;

    for (const section of resumeData.sections) {
      const bullet = section.bullets.find(b => b.id === selectedBulletId);
      if (bullet) return bullet;
    }

    return null;
  };

  // Loading state
  if (isGenerating && !resumeData) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <Sparkles className="h-12 w-12 mx-auto text-primary animate-pulse" />
          <h2 className="text-2xl font-bold">Crafting Your Elite Resume...</h2>
          <p className="text-muted-foreground">
            AI is analyzing the job description and building a perfectly tailored resume
          </p>
          <Progress value={progress} className="h-2" />
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
        <div className="container max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            {resumeData && (
              <ThermometerScore
                score={resumeData.overallScore}
                tier={resumeData.tier}
                pointsToNextTier={0}
                nextTierThreshold={90}
              />
            )}
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

      {/* Two-column layout */}
      {resumeData ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Resume Draft (60%) */}
          <div className="w-3/5 border-r">
            <ResumeDraftPanel
              resumeData={resumeData}
              selectedBulletId={selectedBulletId}
              onSelectBullet={setSelectedBulletId}
            />
          </div>

          {/* Right: Refinement Panel (40%) */}
          <div className="w-2/5">
            <RefinementPanel
              selectedBullet={getSelectedBullet()}
              onSave={handleBulletSave}
              onRegenerate={handleBulletRegenerate}
              onRemove={handleBulletRemove}
              isProcessing={isGenerating}
            />
          </div>
        </div>
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
