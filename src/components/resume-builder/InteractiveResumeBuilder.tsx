import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, GripVertical, Trash2, Download, Eye, Edit3, Sparkles, Loader2, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { invokeEdgeFunction, GenerateDualResumeSectionSchema, safeValidateInput } from "@/lib/edgeFunction";
import { logger } from "@/lib/logger";
import { SectionGenerationCard } from "./SectionGenerationCard";
import { SectionReviewPanel } from "./SectionReviewPanel";
import { ATSScoreCard } from "@/components/resume/ATSScoreCard";

interface ResumeSection {
  id: string;
  type: 'summary' | 'experience' | 'skills' | 'achievements' | 'leadership' | 'projects' | 'education';
  title: string;
  content: ResumeItem[];
  order: number;
}

interface ResumeItem {
  id: string;
  content: string;
  vaultItemId?: string;
  atsKeywords?: string[];
  satisfiesRequirements?: string[];
}

interface InteractiveResumeBuilderProps {
  sections: ResumeSection[];
  onUpdateSection: (sectionId: string, content: ResumeItem[]) => void;
  onAddItem: (sectionType: string, item: ResumeItem) => void;
  onRemoveItem: (sectionId: string, itemId: string) => void;
  onReorderSections: (sections: ResumeSection[]) => void;
  onExport: (format: string) => void;
  requirementCoverage: number;
  atsScore: number;
  atsScoreData?: any;
  analyzingATS?: boolean;
  onReanalyzeATS?: () => void;
  mode: 'edit' | 'preview';
  onModeChange: (mode: 'edit' | 'preview') => void;
  jobAnalysis?: any;
  vaultMatches?: any[];
  resumeMilestones?: any[];
}

export const InteractiveResumeBuilder = ({
  sections,
  onUpdateSection,
  onAddItem,
  onRemoveItem,
  onExport,
  requirementCoverage = 0,
  atsScore = 0,
  atsScoreData,
  analyzingATS = false,
  onReanalyzeATS,
  mode,
  onModeChange,
  jobAnalysis,
  vaultMatches = [],
  resumeMilestones = []
}: InteractiveResumeBuilderProps) => {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: ""
  });
  const [generatingSection, setGeneratingSection] = useState<string | null>(null);
  const [showGenerationCard, setShowGenerationCard] = useState(false);
  const [generationData, setGenerationData] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        logger.info('User ID loaded for resume generation', { userId: user.id });
      }
    };
    getUserId();
  }, []);

  const sectionIcons: { [key: string]: string } = {
    summary: "📋",
    experience: "💼",
    skills: "⚡",
    achievements: "🏆",
    leadership: "👥",
    projects: "🚀",
    education: "🎓"
  };

  const getSectionGuidance = (sectionType: string) => {
    const guidance: Record<string, string> = {
      'summary': '3-4 sentences. Problem-solution-value format. Include seniority, top skills, biggest achievement.',
      'experience': 'Bullet points. Start with action verb, include metrics, show progression. Focus on impact.',
      'skills': 'Simple comma-separated list of skills. NO descriptions. Example: "Python, JavaScript, AWS, Team Leadership, Project Management"',
      'education': 'Degree, institution, year, relevant coursework/honors if recent grad.',
      'certifications': 'Certification name, issuing body, date. Prioritize relevant and current.',
      'projects': 'Project name, technologies, impact. Quantify results when possible.',
      'achievements': 'Quantified accomplishments. Use STAR format. Show impact.',
      'leadership': 'Team size, scope, outcome. Demonstrate people management and influence.'
    };
    return guidance[sectionType] || 'Clear, concise, achievement-focused content.';
  };

  const handleGenerateWithAI = async (sectionId: string, sectionType: string) => {
    if (!jobAnalysis) {
      toast.error('Job analysis required for AI generation');
      return;
    }

    setGeneratingSection(sectionId);
    logger.info('Generating AI content for section', {
      sectionId,
      sectionType,
      sectionTitle: sections.find(s => s.id === sectionId)?.title
    });

    try {
      toast.info('Researching industry standards...');

      // Get relevant vault items for this section
      const relevantVaultItems = (vaultMatches || []).filter((match: any) => 
        match.suggestedPlacement?.toLowerCase().includes(sectionType.toLowerCase())
      );

      // Get resume milestones relevant to this section
      const relevantMilestones = (resumeMilestones || []).filter((milestone: any) => {
        if (sectionType === 'experience' && milestone.milestone_type === 'job') return true;
        if (sectionType === 'education' && milestone.milestone_type === 'education') return true;
        return false;
      });

      const payload = {
        section_type: sectionType,
        section_guidance: getSectionGuidance(sectionType),
        job_analysis_research: jobAnalysis.research || '',
        vault_items: relevantVaultItems,
        resume_milestones: relevantMilestones,
        user_id: userId,
        job_title: jobAnalysis.jobTitle || 'Professional',
        industry: jobAnalysis.industry || 'Technology',
        seniority: jobAnalysis.seniority || 'mid-level',
        ats_keywords: jobAnalysis.atsKeywords || { critical: [], important: [], nice_to_have: [] },
        requirements: [
          ...(jobAnalysis.jobRequirements?.required || []),
          ...(jobAnalysis.jobRequirements?.preferred || [])
        ]
      };

      const validation = safeValidateInput(GenerateDualResumeSectionSchema, payload);
      if (!validation.success) {
        setGeneratingSection(null);
        return;
      }

      const { data, error } = await invokeEdgeFunction(
        'generate-dual-resume-section',
        payload
      );

      if (error) {
        logger.error('Failed to generate resume section', error);
        setGeneratingSection(null);
        return;
      }

      if (data.success) {
        // Calculate vault strength based on section type
        let vaultStrength = 0;
        let hasResumeData = false;
        
        if (sectionType === 'experience' || sectionType === 'education') {
          // For experience/education, strength is based on resume milestones
          const relevantMilestoneCount = (resumeMilestones || []).filter((m: any) => 
            (sectionType === 'experience' && m.milestone_type === 'job') ||
            (sectionType === 'education' && m.milestone_type === 'education')
          ).length;
          vaultStrength = relevantMilestoneCount > 0 ? Math.min(100, relevantMilestoneCount * 25) : 0;
          hasResumeData = relevantMilestoneCount > 0;
        } else {
          // For other sections, use vault matches
          vaultStrength = relevantVaultItems.length > 0 
            ? Math.min(100, relevantVaultItems.length * 15)
            : 0;
        }

        setGenerationData({
          ...data,
          sectionId,
          sectionType,
          comparison: {
            ...data.comparison,
            vaultStrength,
            hasResumeData
          }
        });
        setShowGenerationCard(true);
        
        // Only auto-apply for non-skills sections (skills need user review due to comma-separated format)
        const isSkillsSection = sectionType.toLowerCase().includes('skill') || 
                                sectionType === 'core_competencies' ||
                                sectionType === 'key_skills';

        if (!isSkillsSection) {
          // Auto-apply recommended version for better UX
          const recommendedVersion = data.comparison.recommendation === 'personalized' && vaultStrength >= 30
            ? data.personalizedVersion.content
            : data.comparison.recommendation === 'blend' && vaultStrength >= 40
            ? data.blendVersion.content
            : data.idealVersion.content;
          
          // Auto-apply after a short delay to allow user to see the options
          setTimeout(() => {
            handleSelectVersion(recommendedVersion, 'replace');
          }, 800);
        } else {
          toast.info('Review the generated skills and select your preferred version');
        }
      } else {
        logger.error('Generation failed - no data returned');
        toast.error('Generation failed');
      }
    } catch (error: any) {
      logger.error('AI generation error', error);
    } finally {
      setGeneratingSection(null);
    }
  };

  const handleSelectVersion = (content: string, action: 'replace' | 'append' = 'replace') => {
    if (!generationData) return;
    
    const sectionId = generationData.sectionId;
    const sectionType = generationData.sectionType;
    const currentSection = sections.find(s => s.id === sectionId);
    
    logger.info('Applying generated content to section', {
      sectionId,
      sectionType,
      currentSectionId: currentSection?.id,
      currentSectionType: currentSection?.type,
      contentPreview: content.substring(0, 100)
    });
    
    // For skills sections, treat the entire content as a single comma-separated list
    const isSkillsSection = sectionType.toLowerCase().includes('skill') || 
                            sectionType === 'core_competencies' ||
                            sectionType === 'key_skills';
    
    let updatedContent;
    
    if (isSkillsSection) {
      // Skills section: store as single item with comma-separated skills
      const skillsItem = {
        id: Date.now().toString() + Math.random(),
        content: content.trim() // Keep as comma-separated string
      };
      updatedContent = action === 'append' 
        ? [...(currentSection?.content || []), skillsItem]
        : [skillsItem];
    } else {
      // Other sections: split by newlines into separate items
      const newItems = content.split('\n')
        .filter(line => line.trim())
        .map(line => ({
          id: Date.now().toString() + Math.random(),
          content: line.trim()
        }));
      
      updatedContent = action === 'append' 
        ? [...(currentSection?.content || []), ...newItems]
        : newItems.length > 0 ? newItems : [{ id: Date.now().toString(), content }];
    }
    
    // CRITICAL: Verify we're updating the correct section
    if (currentSection?.id !== sectionId) {
      logger.error('Section ID mismatch', {
        expectedId: sectionId,
        foundSection: currentSection
      });
      toast.error('Error: Wrong section targeted. Please try again.');
      return;
    }
    
    onUpdateSection(sectionId, updatedContent);
    setShowGenerationCard(false);
    setGenerationData(null); // Clear generation data
    
    toast.success(action === 'append' ? 'Content added to section' : 'Section updated');
  };

  const ResumeItemComponent = ({ item, sectionId }: { item: ResumeItem; sectionId: string }) => {
    const isEditing = editingItem === item.id;

    return (
      <div className="group relative p-3 bg-card rounded border hover:border-primary transition-all">
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 cursor-move" />

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Textarea
                value={item.content}
                onChange={(e) => {
                  const updatedContent = sections
                    .find(s => s.id === sectionId)
                    ?.content.map(i => i.id === item.id ? { ...i, content: e.target.value } : i) || [];
                  onUpdateSection(sectionId, updatedContent);
                }}
                onBlur={() => setEditingItem(null)}
                className="text-sm"
                rows={3}
                autoFocus
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap text-foreground">{item.content}</p>
            )}

            {item.atsKeywords && item.atsKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.atsKeywords.map((kw, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
            )}

            {item.satisfiesRequirements && item.satisfiesRequirements.length > 0 && (
              <div className="mt-1 text-xs text-muted-foreground">
                ✓ Addresses: {item.satisfiesRequirements.slice(0, 2).join(', ')}
                {item.satisfiesRequirements.length > 2 && ` +${item.satisfiesRequirements.length - 2} more`}
              </div>
            )}
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditingItem(item.id)}
              className="h-7 w-7 p-0"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemoveItem(sectionId, item.id)}
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const SectionComponent = ({ section }: { section: ResumeSection }) => {
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [newItemContent, setNewItemContent] = useState("");
    const isEmpty = section.content.length === 0;
    const isGenerating = generatingSection === section.id;

    const handleAddItem = () => {
      if (newItemContent.trim()) {
        onAddItem(section.type, {
          id: `item-${Date.now()}`,
          content: newItemContent
        });
        setNewItemContent("");
        setIsAddingItem(false);
      }
    };

    return (
      <div className="mb-6 space-y-3">
        <div className="p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span>{sectionIcons[section.type]}</span>
              <span>{section.title}</span>
              <Badge variant="outline" className="text-xs">{section.content.length} items</Badge>
            </h3>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingItem(!isAddingItem)}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Manually
              </Button>
            </div>
          </div>

          <div className="space-y-2">
          {/* Show generation card if generating for this section */}
          {showGenerationCard && generationData?.sectionId === section.id && (
            <SectionGenerationCard
              sectionType={generationData.sectionType}
              idealVersion={generationData.idealVersion}
              personalizedVersion={generationData.personalizedVersion}
              blendVersion={generationData.blendVersion}
              comparison={generationData.comparison}
              onSelectVersion={handleSelectVersion}
              onCancel={() => {
                setShowGenerationCard(false);
                setGenerationData(null);
              }}
            />
          )}

          {section.content.map(item => (
            <ResumeItemComponent key={item.id} item={item} sectionId={section.id} />
          ))}

          {isAddingItem && (
            <div className="p-3 bg-card rounded border border-primary">
              <Textarea
                placeholder="Enter content..."
                value={newItemContent}
                onChange={(e) => setNewItemContent(e.target.value)}
                className="text-sm mb-2"
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddItem} className="h-7 text-xs">
                  Add Item
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsAddingItem(false);
                    setNewItemContent("");
                  }}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {isEmpty && !isAddingItem && !isGenerating && !showGenerationCard && (
            <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/20">
              <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-3">
                This section is empty
              </p>
              {jobAnalysis ? (
                <Button
                  onClick={() => handleGenerateWithAI(section.id, section.type)}
                  variant="default"
                  size="sm"
                  className="bg-gradient-to-r from-primary to-primary/80"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate with AI
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Add items manually
                </p>
              )}
            </div>
          )}

          {isGenerating && (
            <div className="p-8 text-center border-2 border-dashed rounded-lg bg-primary/5">
              <Loader2 className="h-8 w-8 mx-auto mb-3 text-primary animate-spin" />
              <p className="text-sm font-medium mb-1">Analyzing job requirements...</p>
              <p className="text-xs text-muted-foreground">
                Researching industry standards and your Career Vault
              </p>
            </div>
          )}
        </div>
        </div>
        
        {/* Section Review Panel - Show transparency */}
        {section.content.length > 0 && (section as any).vaultItemsUsed && (
          <SectionReviewPanel
            sectionTitle={section.title}
            sectionType={section.type}
            vaultItemsUsed={(section as any).vaultItemsUsed || []}
            requirementsCovered={(section as any).requirementsCovered || []}
            atsKeywords={(section as any).atsKeywords || []}
            qualityScore={85} // Calculate based on vault quality
            onRegenerate={() => handleGenerateWithAI(section.id, section.type)}
          />
        )}
      </div>
    );
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg text-foreground">Resume Builder</h3>
              <p className="text-xs text-muted-foreground">
                Generate with AI or add content manually
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant={mode === 'edit' ? 'default' : 'outline'}
                onClick={() => onModeChange('edit')}
                className="h-8 text-xs"
              >
                <Edit3 className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant={mode === 'preview' ? 'default' : 'outline'}
                onClick={() => onModeChange('preview')}
                className="h-8 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-muted-foreground">Requirement Coverage</span>
                <span className="font-semibold">{requirementCoverage}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all",
                    requirementCoverage >= 80 ? "bg-success" :
                    requirementCoverage >= 60 ? "bg-warning" : "bg-destructive"
                  )}
                  style={{ width: `${requirementCoverage}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-muted-foreground">ATS Score</span>
                <span className="font-semibold">{atsScore}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all",
                    atsScore >= 80 ? "bg-success" :
                    atsScore >= 60 ? "bg-warning" : "bg-destructive"
                  )}
                  style={{ width: `${atsScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {mode === 'edit' ? (
              <>
                {/* ATS Score Card */}
                {atsScoreData && (
                  <div className="mb-6">
                    <ATSScoreCard scoreData={atsScoreData} isLoading={analyzingATS} />
                  </div>
                )}

                {/* ATS Improvement Suggestions */}
                {atsScoreData && atsScoreData.overallScore < 80 && (
                  <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10">
                    <TrendingUp className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <AlertDescription className="text-sm">
                      <strong>Boost your ATS score:</strong> Consider adding more keywords from the job description and quantifying your achievements with metrics.
                      {onReanalyzeATS && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={onReanalyzeATS}
                          className="ml-2 h-auto p-0 text-yellow-600 dark:text-yellow-400 underline"
                        >
                          Re-analyze after edits
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Contact Info */}
                <div className="mb-6 p-4 bg-muted rounded-lg border">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                    <span>👤</span>
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Full Name"
                      value={contactInfo.name}
                      onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                      className="text-sm h-9"
                    />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                      className="text-sm h-9"
                    />
                    <Input
                      placeholder="Phone"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                      className="text-sm h-9"
                    />
                    <Input
                      placeholder="Location"
                      value={contactInfo.location}
                      onChange={(e) => setContactInfo({ ...contactInfo, location: e.target.value })}
                      className="text-sm h-9"
                    />
                    <Input
                      placeholder="LinkedIn URL"
                      value={contactInfo.linkedin}
                      onChange={(e) => setContactInfo({ ...contactInfo, linkedin: e.target.value })}
                      className="text-sm h-9 col-span-2"
                    />
                  </div>
                </div>

                {/* Sections */}
                {sections
                  .sort((a, b) => a.order - b.order)
                  .map(section => (
                    <SectionComponent key={section.id} section={section} />
                  ))}

                {/* Export */}
                <div className="flex gap-2 mt-6">
                  <Button onClick={() => onExport('pdf')} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button onClick={() => onExport('docx')} variant="outline" className="flex-1">
                    Export DOCX
                  </Button>
                  <Button onClick={() => onExport('html')} variant="outline" className="flex-1">
                    Export HTML
                  </Button>
                </div>
              </>
            ) : (
              <div className="bg-card p-8 rounded shadow-lg min-h-[800px]">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2 text-foreground">{contactInfo.name || "Your Name"}</h1>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {contactInfo.email && <div>{contactInfo.email}</div>}
                    {contactInfo.phone && <div>{contactInfo.phone}</div>}
                    {contactInfo.location && <div>{contactInfo.location}</div>}
                    {contactInfo.linkedin && <div>{contactInfo.linkedin}</div>}
                  </div>
                </div>

                {sections
                  .sort((a, b) => a.order - b.order)
                  .map(section => (
                    <div key={section.id} className="mb-6">
                      <h2 className="text-xl font-bold mb-3 pb-2 border-b-2 border-primary text-foreground">
                        {section.title}
                      </h2>
                      <div className="space-y-3">
                        {section.type === 'skills' ? (
                          <div className="grid grid-cols-3 gap-2">
                            {section.content.flatMap(item =>
                              item.content.split(',').map((skill, idx) => (
                                <div key={`${item.id}-${idx}`} className="text-xs px-2 py-1 bg-primary/10 rounded text-foreground">
                                  {skill.trim()}
                                </div>
                              ))
                            )}
                          </div>
                        ) : (
                          section.content.map(item => (
                            <div key={item.id} className="text-sm text-foreground">
                              {item.content}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </>
  );
};