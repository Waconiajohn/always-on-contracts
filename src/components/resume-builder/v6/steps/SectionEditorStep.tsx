/**
 * SectionEditorStep - Refactored full-width section editor
 * Uses smaller focused components for maintainability
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useToast } from '@/hooks/use-toast';
import { invokeEdgeFunction } from '@/lib/edgeFunction';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import { LiveResumePreview } from '../components/LiveResumePreview';
import { AIActionPanel, AI_ACTIONS } from '../components/AIActionPanel';
import { SectionTabs, SECTION_TABS } from '../components/SectionTabs';
import type { BenchmarkBuilderState, ScoreBreakdown } from '../types';

interface SectionEditorStepProps {
  state: BenchmarkBuilderState;
  onScoreUpdate: (newScore: number, breakdown?: Partial<ScoreBreakdown>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function SectionEditorStep({
  state,
  onScoreUpdate,
  onNext,
  onBack
}: SectionEditorStepProps) {
  const { toast } = useToast();
  
  // Section state management
  const [activeSection, setActiveSection] = useState('summary');
  const [sectionContent, setSectionContent] = useState<Record<string, string>>({});
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTab = SECTION_TABS.find(t => t.id === activeSection);
  const allSectionsComplete = SECTION_TABS.every(t => completedSections.has(t.id));

  // Handle section change
  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section);
    setError(null);
  }, []);

  // Handle content change for current section
  const handleContentChange = useCallback((content: string) => {
    setSectionContent(prev => ({
      ...prev,
      [activeSection]: content
    }));
  }, [activeSection]);

  // Generate AI enhancement
  const generateEnhancement = useCallback(async (actionId: string): Promise<string> => {
    setIsGenerating(true);
    setError(null);

    const currentContent = sectionContent[activeSection] || '';
    const action = AI_ACTIONS.find(a => a.id === actionId);

    try {
      const { data } = await invokeEdgeFunction('generate-dual-resume-section', {
        sectionType: activeSection,
        currentContent,
        jobDescription: state.jobDescription,
        targetRole: state.detected.role,
        targetIndustry: state.detected.industry,
        careerLevel: state.detected.level,
        enhancementType: actionId,
        industryResearch: state.industryResearch,
        action: actionId
      });

      if (data?.enhancedContent) {
        // Update score based on action
        const scoreBoost = action?.scoreImpact || 3;
        onScoreUpdate(Math.min(100, state.currentScore + scoreBoost));
        return data.enhancedContent;
      }

      // Fallback content generation
      return generateFallbackContent(actionId, currentContent);
    } catch (err) {
      console.error('AI enhancement error:', err);
      setError('Enhancement failed. Using fallback suggestions.');
      return generateFallbackContent(actionId, currentContent);
    } finally {
      setIsGenerating(false);
    }
  }, [activeSection, sectionContent, state, onScoreUpdate]);

  // Generate intelligent fallback content
  const generateFallbackContent = (actionId: string, baseContent: string): string => {
    const role = state.detected.role || 'Professional';
    const industry = state.detected.industry || 'your industry';
    const content = baseContent || `Enter your ${activeSection} content`;

    const fallbacks: Record<string, string> = {
      expand: activeSection === 'summary'
        ? `Results-driven ${role} with proven expertise in strategic planning, team leadership, and operational excellence. Demonstrated ability to drive transformational change and deliver measurable business outcomes. Known for building high-performance teams and fostering cross-functional collaboration.`
        : `${content}\n\n• Led initiatives resulting in significant operational improvements\n• Collaborated with cross-functional teams to deliver strategic objectives\n• Implemented process improvements enhancing efficiency and reducing costs`,
      
      keywords: `${content} with expertise in strategic planning, cross-functional collaboration, stakeholder management, and data-driven decision making. Proven track record of delivering results.`,
      
      quantify: `${content}\n\nKey Achievements:\n• Increased team productivity by 35% through process optimization\n• Managed $2.5M budget with 98% accuracy\n• Led team of 12 across 3 regions\n• Reduced operational costs by $450K annually`,
      
      benchmark: `BENCHMARK-LEVEL ${role.toUpperCase()}: Strategic leader with ${state.detected.level === 'Executive' ? '15+' : '8+'} years driving organizational transformation in ${industry}. Recognized for delivering $10M+ in value through innovative solutions and building world-class teams.`,
      
      industry: `${role} with deep expertise in ${industry} best practices, regulatory compliance, and industry methodologies. Leverages sector knowledge to anticipate market trends and position organizations for competitive advantage.`
    };

    return fallbacks[actionId] || content;
  };

  // Save current section
  const handleSaveSection = useCallback(() => {
    const content = sectionContent[activeSection];
    
    if (!content?.trim()) {
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

    // Auto-advance to next incomplete section
    const currentIndex = SECTION_TABS.findIndex(t => t.id === activeSection);
    const nextSection = SECTION_TABS.find((t, i) => 
      i > currentIndex && !completedSections.has(t.id)
    );
    
    if (nextSection) {
      setActiveSection(nextSection.id);
    }
  }, [activeSection, sectionContent, completedSections, currentTab, toast]);

  return (
    <div className="h-full flex flex-col">
      {/* Section Tabs */}
      <SectionTabs
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        completedSections={completedSections}
      />

      {/* Main Content - Split View */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left: Live Preview */}
        <ResizablePanel defaultSize={50} minSize={35}>
          <LiveResumePreview
            state={state}
            activeSection={activeSection}
            sectionContent={sectionContent}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: AI Editing Panel */}
        <ResizablePanel defaultSize={50} minSize={35}>
          <AIActionPanel
            sectionLabel={currentTab?.label || 'Section'}
            content={sectionContent[activeSection] || ''}
            onContentChange={handleContentChange}
            onApplyAI={generateEnhancement}
            onSave={handleSaveSection}
            isGenerating={isGenerating}
            error={error}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Footer Navigation */}
      <div className="border-t px-6 py-4 bg-muted/30 flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Templates
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!allSectionsComplete} 
          className="gap-2"
        >
          Continue to ATS Audit
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
