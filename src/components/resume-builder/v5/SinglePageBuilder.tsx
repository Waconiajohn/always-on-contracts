/**
 * SinglePageBuilder V5 - State of the Art Resume Builder
 * 
 * Three-panel layout:
 * - Left: Gap Radar (always visible gap tracking)
 * - Center: Section Editor (scrollable, collapsible sections)
 * - Right: Live Preview (real-time PDF-style preview)
 * 
 * Header:
 * - ThermometerScore (live updating)
 * - Score breakdown
 * - Humanize / Polish / Export buttons
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { invokeEdgeFunction } from '@/lib/edgeFunction';

// Components
import { ThermometerScore } from '@/components/quick-score/ThermometerScore';
import { BulletComparisonCard } from '../v4/cards/BulletComparisonCard';

// Types
import type { 
  BulletStatus
} from '../v4/types/builderV2Types';

// Local Gap type (simplified for V5)
interface V5Gap {
  id: string;
  severity: 'critical' | 'important' | 'nice-to-have';
  title: string;
  description?: string;
}

// Icons
import {
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Wand2,
  FileText,
  Download,
  RefreshCw,
  Loader2,
  Target,
  Star,
  Briefcase,
  Wrench,
  Eye,
  Copy,
  FileDown,
  ThumbsUp
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ScoreTier {
  tier: 'FREEZING' | 'COLD' | 'LUKEWARM' | 'WARM' | 'HOT' | 'ON_FIRE';
  emoji: string;
  color: string;
  message: string;
}

interface ScoreResult {
  overallScore: number;
  tier: ScoreTier;
  pointsToNextTier: number;
  nextTierThreshold: number;
  scores: {
    ats: number;
    requirements: number;
    competitive: number;
  };
  breakdown: any;
  priorityFixes: Array<{
    priority: number;
    category: string;
    issue: string;
    fix: string;
    impact: string;
  }>;
  detected: {
    role: string;
    industry: string;
    level: string;
  };
}

interface SectionBullet {
  id: string;
  originalText: string;
  suggestedText: string;
  editedText?: string;
  status: BulletStatus;
  confidence: 'high' | 'medium' | 'low';
  whyThisHelps?: string;
  gapAddressed?: string;
  supports?: string[]; // Job requirements this addresses
  sourceBasis?: string; // Which role/company this came from
}

interface ResumeSection {
  id: string;
  type: 'highlights' | 'experience' | 'skills' | 'summary';
  title: string;
  isExpanded: boolean;
  isLoading: boolean;
  bullets: SectionBullet[];
  roleInfo?: {
    company: string;
    title: string;
    dates: string;
  };
}

interface SinglePageBuilderProps {
  initialResumeText?: string;
  initialJobDescription?: string;
  initialScoreResult?: ScoreResult;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateTier(score: number): ScoreTier {
  if (score >= 90) return { tier: 'ON_FIRE', emoji: '🚀', color: 'red', message: 'Must-interview status achieved!' };
  if (score >= 75) return { tier: 'HOT', emoji: '🔥', color: 'orange', message: 'Strong candidate, almost there!' };
  if (score >= 60) return { tier: 'WARM', emoji: '🌡️', color: 'amber', message: 'Good foundation, needs optimization' };
  if (score >= 40) return { tier: 'LUKEWARM', emoji: '😐', color: 'yellow', message: 'Average fit, significant gaps' };
  if (score >= 20) return { tier: 'COLD', emoji: '❄️', color: 'blue', message: 'Weak match, major changes needed' };
  return { tier: 'FREEZING', emoji: '🥶', color: 'blue', message: 'Critical mismatch detected' };
}

function getNextTierThreshold(score: number): number {
  if (score >= 90) return 100;
  if (score >= 75) return 90;
  if (score >= 60) return 75;
  if (score >= 40) return 60;
  if (score >= 20) return 40;
  return 20;
}

// ============================================================================
// RESUME PARSING FUNCTIONS (Phase 1)
// ============================================================================

interface ParsedWorkExperience {
  company: string;
  title: string;
  dates: string;
  bullets: string[];
}

interface ParsedEducation {
  institution: string;
  degree: string;
  dates: string;
}

interface ParsedResumeContent {
  workHistory: ParsedWorkExperience[];
  education: ParsedEducation[];
  skills: string[];
  summary: string;
}

function parseResumeContent(text: string): ParsedResumeContent {
  if (!text) return { workHistory: [], education: [], skills: [], summary: '' };
  
  const lines = text.split('\n').filter(l => l.trim());
  const result: ParsedResumeContent = {
    workHistory: [],
    education: [],
    skills: [],
    summary: ''
  };
  
  // Extract work experience
  // Look for patterns like "Company Name" followed by role and dates
  const workPattern = /^([A-Z][A-Za-z\s&.,']+)\s*[|,]\s*([A-Z][A-Za-z\s]+)\s*[|,]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4}).+)$/;
  const bulletPattern = /^[•\-\*]\s*(.+)$/;
  
  let currentJob: ParsedWorkExperience | null = null;
  let inEducation = false;
  let inSkills = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lower = line.toLowerCase();
    
    // Section headers
    if (lower.includes('education')) {
      inEducation = true;
      inSkills = false;
      if (currentJob) result.workHistory.push(currentJob);
      currentJob = null;
      continue;
    }
    if (lower.includes('skill') || lower.includes('technical')) {
      inSkills = true;
      inEducation = false;
      if (currentJob) result.workHistory.push(currentJob);
      currentJob = null;
      continue;
    }
    if (lower.includes('experience') || lower.includes('employment')) {
      inEducation = false;
      inSkills = false;
      continue;
    }
    
    // Parse education
    if (inEducation) {
      const eduMatch = line.match(/([A-Z][A-Za-z\s]+(?:University|College|Institute|School))/);
      if (eduMatch) {
        const institution = eduMatch[1];
        const degreeMatch = line.match(/(Bachelor|Master|PhD|Associate|B\.S\.|M\.S\.|MBA)/i);
        const dateMatch = line.match(/(\d{4})/);
        result.education.push({
          institution,
          degree: degreeMatch ? degreeMatch[0] : 'Degree',
          dates: dateMatch ? dateMatch[0] : ''
        });
      }
      continue;
    }
    
    // Parse skills
    if (inSkills) {
      const skillsText = line.replace(/^[•\-\*]\s*/, '');
      const skills = skillsText.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 2);
      result.skills.push(...skills);
      continue;
    }
    
    // Parse work experience
    const workMatch = line.match(workPattern);
    if (workMatch) {
      if (currentJob) result.workHistory.push(currentJob);
      currentJob = {
        company: workMatch[1].trim(),
        title: workMatch[2].trim(),
        dates: workMatch[3].trim(),
        bullets: []
      };
      continue;
    }
    
    // Try alternate pattern: separate lines for company, title, dates
    if (!currentJob && /^[A-Z][A-Za-z\s&.,']+$/.test(line) && line.length < 50) {
      const nextLine = lines[i + 1]?.trim() || '';
      if (/^[A-Z][A-Za-z\s]+$/.test(nextLine)) {
        currentJob = {
          company: line,
          title: nextLine,
          dates: lines[i + 2]?.trim() || 'Present',
          bullets: []
        };
        i += 2;
        continue;
      }
    }
    
    // Parse bullet points
    const bulletMatch = line.match(bulletPattern);
    if (bulletMatch && currentJob) {
      currentJob.bullets.push(bulletMatch[1]);
    }
  }
  
  if (currentJob) result.workHistory.push(currentJob);
  
  // Extract summary (first few lines before experience)
  const summaryLines = lines.slice(0, 5).filter(l => {
    const lower = l.toLowerCase();
    return !lower.includes('education') && 
           !lower.includes('experience') && 
           !lower.includes('skill') &&
           l.length > 40;
  });
  result.summary = summaryLines[0] || '';
  
  return result;
}

// ============================================================================
// GAP RADAR COMPONENT
// ============================================================================

interface GapRadarProps {
  gaps: V5Gap[];
  resolvedGapIds: Set<string>;
  onReanalyze: () => void;
  isAnalyzing: boolean;
}

function GapRadar({ gaps, resolvedGapIds, onReanalyze, isAnalyzing }: GapRadarProps) {
  const criticalGaps = gaps.filter(g => g.severity === 'critical');
  const importantGaps = gaps.filter(g => g.severity === 'important');
  const niceToHaveGaps = gaps.filter(g => g.severity === 'nice-to-have');
  
  const totalGaps = gaps.length;
  const resolvedCount = resolvedGapIds.size;
  const progressPercent = totalGaps > 0 ? (resolvedCount / totalGaps) * 100 : 0;

  const GapItem = ({ gap }: { gap: V5Gap }) => {
    const isResolved = resolvedGapIds.has(gap.id);
    return (
      <div className={cn(
        "flex items-start gap-2 p-2 rounded-lg transition-all",
        isResolved ? "bg-green-500/10" : "bg-muted/50"
      )}>
        {isResolved ? (
          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
        ) : (
          <AlertCircle className={cn(
            "h-4 w-4 mt-0.5 flex-shrink-0",
            gap.severity === 'critical' ? "text-red-500" :
            gap.severity === 'important' ? "text-amber-500" : "text-muted-foreground"
          )} />
        )}
        <div className="min-w-0">
          <p className={cn(
            "text-sm font-medium",
            isResolved && "line-through text-muted-foreground"
          )}>
            {gap.title}
          </p>
          {!isResolved && gap.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {gap.description}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background border-r">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" />
            Gap Radar
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReanalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{resolvedCount}/{totalGaps}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Critical Gaps */}
          {criticalGaps.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="destructive" className="text-xs">
                  Critical
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {criticalGaps.filter(g => resolvedGapIds.has(g.id)).length}/{criticalGaps.length}
                </span>
              </div>
              <div className="space-y-2">
                {criticalGaps.map(gap => <GapItem key={gap.id} gap={gap} />)}
              </div>
            </div>
          )}

          {/* Important Gaps */}
          {importantGaps.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs border-amber-500 text-amber-500">
                  Important
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {importantGaps.filter(g => resolvedGapIds.has(g.id)).length}/{importantGaps.length}
                </span>
              </div>
              <div className="space-y-2">
                {importantGaps.map(gap => <GapItem key={gap.id} gap={gap} />)}
              </div>
            </div>
          )}

          {/* Nice to Have Gaps */}
          {niceToHaveGaps.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  Nice to Have
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {niceToHaveGaps.filter(g => resolvedGapIds.has(g.id)).length}/{niceToHaveGaps.length}
                </span>
              </div>
              <div className="space-y-2">
                {niceToHaveGaps.map(gap => <GapItem key={gap.id} gap={gap} />)}
              </div>
            </div>
          )}

          {gaps.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">All gaps addressed!</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// LIVE PREVIEW COMPONENT
// ============================================================================

interface LivePreviewProps {
  sections: ResumeSection[];
  contactInfo: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  onCopyToClipboard: () => void;
  onDownloadPDF: () => void;
  onDownloadDOCX: () => void;
}

function LivePreview({ 
  sections, 
  contactInfo, 
  onCopyToClipboard, 
  onDownloadPDF,
  onDownloadDOCX 
}: LivePreviewProps) {
  // Get accepted bullets from each section
  const getAcceptedBullets = (section: ResumeSection) => {
    return section.bullets
      .filter(b => b.status === 'accepted' || b.status === 'edited')
      .map(b => b.editedText || b.suggestedText);
  };

  const highlights = sections.find(s => s.type === 'highlights');
  const experienceSections = sections.filter(s => s.type === 'experience');
  const skillsSection = sections.find(s => s.type === 'skills');

  return (
    <div className="h-full flex flex-col bg-muted/20 border-l">
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Live Preview
          </h2>
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onCopyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy to clipboard</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onDownloadDOCX}>
                  <FileDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download DOCX</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onDownloadPDF}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download PDF</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 min-h-[800px] text-black">
          {/* Contact Header */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold uppercase tracking-wide">
              {contactInfo.name || 'Your Name'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {[contactInfo.email, contactInfo.phone, contactInfo.location]
                .filter(Boolean)
                .join(' | ')}
            </p>
          </div>

          {/* Key Highlights */}
          {highlights && getAcceptedBullets(highlights).length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-2">
                Key Highlights
              </h2>
              <ul className="space-y-1">
                {getAcceptedBullets(highlights).map((bullet, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-gray-500">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Professional Experience */}
          {experienceSections.length > 0 && experienceSections.some(s => getAcceptedBullets(s).length > 0) && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-2">
                Professional Experience
              </h2>
              {experienceSections.map(section => {
                const bullets = getAcceptedBullets(section);
                if (bullets.length === 0) return null;
                
                return (
                  <div key={section.id} className="mb-4">
                    {section.roleInfo && (
                      <div className="flex justify-between items-baseline mb-1">
                        <div>
                          <span className="font-semibold text-sm">{section.roleInfo.title}</span>
                          <span className="text-sm text-gray-600"> | {section.roleInfo.company}</span>
                        </div>
                        <span className="text-sm text-gray-500">{section.roleInfo.dates}</span>
                      </div>
                    )}
                    <ul className="space-y-1">
                      {bullets.map((bullet, i) => (
                        <li key={i} className="text-sm flex gap-2">
                          <span className="text-gray-500">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          {/* Skills */}
          {skillsSection && getAcceptedBullets(skillsSection).length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-2">
                Skills
              </h2>
              <p className="text-sm">
                {getAcceptedBullets(skillsSection).join(', ')}
              </p>
            </div>
          )}

          {/* Empty state */}
          {sections.every(s => getAcceptedBullets(s).length === 0) && (
            <div className="text-center py-20 text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Accept bullets to see your resume build in real-time</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// SECTION EDITOR COMPONENT
// ============================================================================

interface SectionEditorProps {
  section: ResumeSection;
  onToggleExpand: () => void;
  onBulletAction: (bulletId: string, action: 'accept' | 'reject' | 'edit', editedText?: string) => void;
  onRegenerateSection: () => void;
  onApproveAllHigh: () => void;
}

function SectionEditor({
  section,
  onToggleExpand,
  onBulletAction,
  onRegenerateSection,
  onApproveAllHigh
}: SectionEditorProps) {
  const acceptedCount = section.bullets.filter(b => b.status === 'accepted' || b.status === 'edited').length;
  const highConfidenceCount = section.bullets.filter(b => b.status === 'pending' && b.confidence === 'high').length;

  const sectionIcon = {
    highlights: Star,
    experience: Briefcase,
    skills: Wrench,
    summary: FileText
  }[section.type] || FileText;

  const Icon = sectionIcon;

  return (
    <Card className="mb-4">
      <Collapsible open={section.isExpanded} onOpenChange={onToggleExpand}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {section.isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <Icon className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">
                  {section.title}
                  {section.roleInfo && (
                    <span className="text-muted-foreground font-normal text-sm ml-2">
                      @ {section.roleInfo.company}
                    </span>
                  )}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {section.isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                <Badge variant="outline" className="text-xs">
                  {acceptedCount}/{section.bullets.length}
                </Badge>
                {acceptedCount === section.bullets.length && section.bullets.length > 0 && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Quick Actions */}
            <div className="flex gap-2 mb-4">
              {highConfidenceCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onApproveAllHigh}
                  className="gap-1"
                >
                  <ThumbsUp className="h-3 w-3" />
                  Approve All High ({highConfidenceCount})
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onRegenerateSection}
                disabled={section.isLoading}
                className="gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </Button>
            </div>

            {/* Bullets */}
            <div className="space-y-3">
              {section.bullets.map((bullet, index) => (
                <BulletComparisonCard
                  key={bullet.id}
                  suggestion={{
                    id: bullet.id,
                    originalText: bullet.originalText,
                    suggestedText: bullet.suggestedText,
                    editedText: bullet.editedText,
                    status: bullet.status,
                    confidence: bullet.confidence,
                    whyThisHelps: bullet.whyThisHelps || '',
                    supports: bullet.supports || [],
                    sourceBasis: bullet.sourceBasis || '',
                    interviewQuestions: [],
                    order: index,
                  }}
                  onUseAI={() => onBulletAction(bullet.id, 'accept')}
                  onKeepOriginal={() => onBulletAction(bullet.id, 'accept')}
                  onEdit={(text: string) => onBulletAction(bullet.id, 'edit', text)}
                  onRemove={() => onBulletAction(bullet.id, 'reject')}
                  bulletNumber={index + 1}
                />
              ))}

              {section.bullets.length === 0 && !section.isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No suggestions yet. Click "Regenerate" to generate.</p>
                </div>
              )}

              {section.isLoading && section.bullets.length === 0 && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Generating suggestions...</p>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SinglePageBuilder({
  initialResumeText,
  initialJobDescription,
  initialScoreResult
}: SinglePageBuilderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get initial data from location state (from QuickScore) or props
  const locationState = location.state as any;
  const resumeText = initialResumeText || locationState?.resumeText || '';
  const jobDescription = initialJobDescription || locationState?.jobDescription || '';

  // Score state
  const [score, setScore] = useState<ScoreResult | null>(
    initialScoreResult || locationState?.scoreResult || null
  );
  const [previousScore, setPreviousScore] = useState<number | undefined>(
    score?.overallScore
  );
  const [isRescoring, setIsRescoring] = useState(false);

  // Gap state
  const [gaps, setGaps] = useState<V5Gap[]>([]);
  const [resolvedGapIds, setResolvedGapIds] = useState<Set<string>>(new Set());
  const [isAnalyzingGaps, setIsAnalyzingGaps] = useState(false);

  // Section state (Phase 3: Dynamic sections from parsed resume)
  const [sections, setSections] = useState<ResumeSection[]>(() => {
    const parsed = parseResumeContent(resumeText);
    
    const baseSections: ResumeSection[] = [
      {
        id: 'summary',
        type: 'summary',
        title: 'Professional Summary',
        isExpanded: false,
        isLoading: false,
        bullets: parsed.summary ? [{
          id: 'summary-1',
          originalText: parsed.summary,
          suggestedText: parsed.summary,
          status: 'pending' as BulletStatus,
          confidence: 'high' as const,
          whyThisHelps: 'Strong opening summary'
        }] : []
      },
      {
        id: 'highlights',
        type: 'highlights',
        title: 'Key Highlights',
        isExpanded: true,
        isLoading: false,
        bullets: []
      }
    ];
    
    // Add experience sections from parsed work history
    const experienceSections: ResumeSection[] = parsed.workHistory.map((job, i) => ({
      id: `experience-${i}`,
      type: 'experience' as const,
      title: job.title,
      isExpanded: false,
      isLoading: false,
      bullets: job.bullets.map((bullet, j) => ({
        id: `experience-${i}-bullet-${j}`,
        originalText: bullet,
        suggestedText: bullet,
        status: 'pending' as BulletStatus,
        confidence: 'medium' as const,
        whyThisHelps: `Extracted from ${job.company}`
      })),
      roleInfo: {
        company: job.company,
        title: job.title,
        dates: job.dates
      }
    }));
    
    // If no work history found, add a placeholder
    if (experienceSections.length === 0) {
      experienceSections.push({
        id: 'experience-0',
        type: 'experience',
        title: 'Professional Experience',
        isExpanded: false,
        isLoading: false,
        bullets: [],
        roleInfo: {
          company: 'Your Company',
          title: 'Your Role',
          dates: 'Present'
        }
      });
    }
    
    const endSections: ResumeSection[] = [
      {
        id: 'education',
        type: 'summary' as const, // Using 'summary' type for education
        title: 'Education',
        isExpanded: false,
        isLoading: false,
        bullets: parsed.education.map((edu, i) => ({
          id: `education-${i}`,
          originalText: `${edu.degree} from ${edu.institution}${edu.dates ? ` (${edu.dates})` : ''}`,
          suggestedText: `${edu.degree} from ${edu.institution}${edu.dates ? ` (${edu.dates})` : ''}`,
          status: 'pending' as BulletStatus,
          confidence: 'high' as const,
          whyThisHelps: 'Educational background'
        }))
      },
      {
        id: 'skills',
        type: 'skills',
        title: 'Skills',
        isExpanded: false,
        isLoading: false,
        bullets: parsed.skills.slice(0, 10).map((skill, i) => ({
          id: `skill-${i}`,
          originalText: skill,
          suggestedText: skill,
          status: 'pending' as BulletStatus,
          confidence: 'medium' as const,
          whyThisHelps: 'Relevant skill for role'
        }))
      }
    ];
    
    return [...baseSections, ...experienceSections, ...endSections];
  });

  // AI processing state
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);

  // Contact info (extracted from resume)
  const [contactInfo, setContactInfo] = useState({
    name: 'Candidate Name',
    email: 'email@example.com',
    phone: '',
    location: ''
  });

  // Extract contact info from resume text
  useEffect(() => {
    if (!resumeText) return;
    
    const extractContactInfo = (text: string) => {
      // Extract email
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const email = emailMatch ? emailMatch[0] : '';
      
      // Extract phone
      const phoneMatch = text.match(/(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/);
      const phone = phoneMatch ? phoneMatch[0] : '';
      
      // Extract location (City, ST pattern)
      const locationMatch = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),?\s+([A-Z]{2})/);
      const location = locationMatch ? `${locationMatch[1]}, ${locationMatch[2]}` : '';
      
      // Extract name (first line with capitalized words or first capitalized text)
      const lines = text.split('\n').filter(l => l.trim());
      const nameMatch = lines[0]?.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/);
      const name = nameMatch ? nameMatch[1] : '';
      
      return { name, email, phone, location };
    };
    
    const extracted = extractContactInfo(resumeText);
    setContactInfo(extracted);
  }, [resumeText]);

  // Initialize gaps from score result
  useEffect(() => {
    if (score?.priorityFixes) {
      const extractedGaps: V5Gap[] = score.priorityFixes.map((fix, i) => ({
        id: `gap-${i}`,
        severity: fix.priority === 1 ? 'critical' : fix.priority === 2 ? 'important' : 'nice-to-have',
        title: fix.issue,
        description: fix.fix
      }));
      setGaps(extractedGaps);
    }
  }, [score]);

  // Redirect if no data
  useEffect(() => {
    if (!resumeText && !jobDescription) {
      toast({
        title: 'Missing Data',
        description: 'Please start from Quick Score',
        variant: 'destructive'
      });
      navigate('/quick-score');
    }
  }, [resumeText, jobDescription, navigate, toast]);

  // Phase 6: Auto-generate Key Highlights on mount
  useEffect(() => {
    const highlightsSection = sections.find(s => s.type === 'highlights');
    if (highlightsSection && highlightsSection.bullets.length === 0 && !highlightsSection.isLoading) {
      // Trigger generation after a short delay to ensure component is fully mounted
      setTimeout(() => {
        handleGenerateSection('highlights');
      }, 500);
    }
  }, []); // Only run once on mount

  // ========== AI FUNCTIONS ==========

  // Phase 2: Fix Score Recalculation - Use reconstructed resume
  const reconstructResumeFromSections = useCallback(() => {
    let resumeText = '';
    
    // Add contact info
    resumeText += `${contactInfo.name}\n`;
    resumeText += `${contactInfo.email || ''} | ${contactInfo.phone || ''} | ${contactInfo.location || ''}\n\n`;
    
    // Add each section with accepted bullets
    sections.forEach(section => {
      const acceptedBullets = section.bullets.filter(
        b => b.status === 'accepted' || b.status === 'edited'
      );
      
      if (acceptedBullets.length > 0) {
        resumeText += `${section.title.toUpperCase()}\n`;
        
        if (section.roleInfo) {
          resumeText += `${section.roleInfo.title} | ${section.roleInfo.company} | ${section.roleInfo.dates}\n`;
        }
        
        acceptedBullets.forEach(bullet => {
          const text = bullet.editedText || bullet.suggestedText;
          resumeText += `• ${text}\n`;
        });
        
        resumeText += `\n`;
      }
    });
    
    return resumeText;
  }, [sections, contactInfo]);

  const handleRescore = useCallback(async () => {
    if (!jobDescription) return;
    
    setIsRescoring(true);
    setPreviousScore(score?.overallScore);

    try {
      // Use reconstructed resume from accepted bullets
      const reconstructedResume = reconstructResumeFromSections();
      const resumeToScore = reconstructedResume || resumeText;
      
      const { data, error } = await invokeEdgeFunction('instant-resume-score', {
        resumeText: resumeToScore,
        jobDescription
      });

      if (error) throw error;
      if (data?.success) {
        setScore(data);
        toast({
          title: 'Score Updated',
          description: `New score: ${data.overallScore}`
        });
      }
    } catch (error: any) {
      toast({
        title: 'Rescore Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsRescoring(false);
    }
  }, [reconstructResumeFromSections, resumeText, jobDescription, score, toast]);

  // Handle gap reanalysis with loading state
  const handleReanalyzeGaps = useCallback(async () => {
    setIsAnalyzingGaps(true);
    try {
      await handleRescore();
    } finally {
      setIsAnalyzingGaps(false);
    }
  }, [handleRescore]);

  const handleHumanize = useCallback(async () => {
    setIsHumanizing(true);
    try {
      // Collect all accepted bullets
      const acceptedContent = sections
        .flatMap(s => s.bullets.filter(b => b.status === 'accepted' || b.status === 'edited'))
        .map(b => b.editedText || b.suggestedText)
        .join('\n');

      if (!acceptedContent) {
        toast({
          title: 'Nothing to humanize',
          description: 'Accept some bullets first',
          variant: 'destructive'
        });
        return;
      }

      const { data, error } = await invokeEdgeFunction('humanize-content', {
        content: acceptedContent,
        context: 'resume bullets',
        targetTone: 'professional yet authentic'
      });

      if (error) throw error;

      // Update bullets with humanized content
      if (data?.humanizedContent) {
        const humanizedLines = data.humanizedContent.split('\n').filter((l: string) => l.trim());
        let lineIndex = 0;
        
        setSections(prev => prev.map(section => ({
          ...section,
          bullets: section.bullets.map(bullet => {
            if (bullet.status !== 'accepted' && bullet.status !== 'edited') return bullet;
            const humanizedText = humanizedLines[lineIndex++];
            return humanizedText 
              ? { ...bullet, editedText: humanizedText, status: 'edited' as BulletStatus }
              : bullet;
          })
        })));
      }

      toast({
        title: 'Content Humanized',
        description: 'AI-speak removed from your resume',
      });

    } catch (error: any) {
      toast({
        title: 'Humanize Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsHumanizing(false);
    }
  }, [sections, toast]);

  const handlePolish = useCallback(async () => {
    setIsPolishing(true);
    try {
      // Collect all accepted bullets
      const acceptedContent = sections
        .flatMap(s => s.bullets.filter(b => b.status === 'accepted' || b.status === 'edited'))
        .map(b => b.editedText || b.suggestedText)
        .join('\n');

      if (!acceptedContent) {
        toast({
          title: 'Nothing to polish',
          description: 'Accept some bullets first',
          variant: 'destructive'
        });
        return;
      }

      const { data, error } = await invokeEdgeFunction('hiring-manager-final-polish', {
        resumeContent: acceptedContent,
        jobDescription,
        targetRole: score?.detected?.role || 'Target Role'
      });

      if (error) throw error;

      // Update bullets with polished content from refinements
      if (data?.review?.refinements && Array.isArray(data.review.refinements)) {
        const refinements = data.review.refinements;
        let refinementIndex = 0;
        
        setSections(prev => prev.map(section => ({
          ...section,
          bullets: section.bullets.map(bullet => {
            if (bullet.status !== 'accepted' && bullet.status !== 'edited') return bullet;
            const refinement = refinements[refinementIndex++];
            return refinement?.suggested_fix
              ? { ...bullet, editedText: refinement.suggested_fix, status: 'edited' as BulletStatus }
              : bullet;
          })
        })));
      }

      toast({
        title: 'Final Polish Applied',
        description: 'Resume optimized with hiring manager perspective',
      });

    } catch (error: any) {
      toast({
        title: 'Polish Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsPolishing(false);
    }
  }, [sections, jobDescription, score, toast]);

  const handleGenerateSection = useCallback(async (sectionId: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, isLoading: true } : s
    ));

    try {
      const section = sections.find(s => s.id === sectionId);
      if (!section) return;

      const { data, error } = await invokeEdgeFunction('generate-dual-resume-section', {
        section_type: section.type,
        job_title: score?.detected?.role || 'Target Role',
        industry: score?.detected?.industry || 'General',
        existing_resume: resumeText,
        job_analysis_research: jobDescription,
        section_guidance: `Generate ${section.type} section optimized for ATS`,
        ats_keywords: { critical: [], important: [], nice_to_have: [] },
        requirements: gaps.map(g => g.title)
      });

      if (error) throw error;

      // Parse the generated bullets
      const content = data?.personalizedVersion?.content || data?.idealVersion?.content || '';
      const bulletTexts = content
        .split('\n')
        .filter((line: string) => line.trim().startsWith('•') || line.trim().startsWith('-'))
        .map((line: string) => line.replace(/^[•\-]\s*/, '').trim())
        .filter((text: string) => text.length > 10);

      // Phase 4: Wire up gap addressing, supports, and source basis
      const newBullets: SectionBullet[] = bulletTexts.map((text: string, i: number) => {
        // Try to match bullet to a gap
        const matchedGap = gaps.find(gap => {
          const gapWords = gap.title.toLowerCase().split(' ');
          const textLower = text.toLowerCase();
          return gapWords.some(word => word.length > 4 && textLower.includes(word));
        });
        
        // Extract potential job requirements this addresses
        const supports: string[] = [];
        if (score?.priorityFixes) {
          score.priorityFixes.forEach(fix => {
            const fixWords = fix.issue.toLowerCase().split(' ');
            const textLower = text.toLowerCase();
            if (fixWords.some(word => word.length > 4 && textLower.includes(word))) {
              supports.push(fix.category);
            }
          });
        }
        
        // Get original bullet text for comparison (if exists)
        const originalBullet = section.bullets[i];
        
        return {
          id: `${sectionId}-bullet-${i}`,
          originalText: originalBullet?.originalText || '',
          suggestedText: text,
          status: 'pending' as BulletStatus,
          confidence: i < 2 ? 'high' : i < 4 ? 'medium' : 'low',
          whyThisHelps: matchedGap 
            ? `Addresses "${matchedGap.title}"` 
            : 'Optimized for ATS and job requirements',
          gapAddressed: matchedGap?.id,
          supports,
          sourceBasis: section.roleInfo 
            ? `${section.roleInfo.title} at ${section.roleInfo.company}`
            : ''
        };
      });

      setSections(prev => prev.map(s => 
        s.id === sectionId ? { ...s, bullets: newBullets, isLoading: false } : s
      ));

    } catch (error: any) {
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive'
      });
      setSections(prev => prev.map(s => 
        s.id === sectionId ? { ...s, isLoading: false } : s
      ));
    }
  }, [sections, resumeText, jobDescription, score, gaps, toast]);

  // ========== BULLET ACTIONS ==========

  const handleBulletAction = useCallback((
    sectionId: string,
    bulletId: string,
    action: 'accept' | 'reject' | 'edit',
    editedText?: string
  ) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;

      return {
        ...section,
        bullets: section.bullets.map(bullet => {
          if (bullet.id !== bulletId) return bullet;

          if (action === 'accept') {
            // Check if this bullet addresses a gap
            if (bullet.gapAddressed) {
              setResolvedGapIds(prev => new Set([...prev, bullet.gapAddressed!]));
            }
            return { ...bullet, status: 'accepted' as BulletStatus };
          }
          if (action === 'reject') {
            return { ...bullet, status: 'rejected' as BulletStatus };
          }
          if (action === 'edit' && editedText) {
            return { ...bullet, status: 'edited' as BulletStatus, editedText };
          }
          return bullet;
        })
      };
    }));

    // Trigger rescore after changes (debounced in production)
    setTimeout(handleRescore, 1000);
  }, [handleRescore]);

  const handleApproveAllHigh = useCallback((sectionId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;

      return {
        ...section,
        bullets: section.bullets.map(bullet => {
          if (bullet.status === 'pending' && bullet.confidence === 'high') {
            return { ...bullet, status: 'accepted' as BulletStatus };
          }
          return bullet;
        })
      };
    }));
  }, []);

  const handleToggleSectionExpand = useCallback((sectionId: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, isExpanded: !s.isExpanded } : s
    ));
  }, []);

  // ========== EXPORT FUNCTIONS ==========

  const handleCopyToClipboard = useCallback(async () => {
    const acceptedBullets = sections
      .flatMap(s => s.bullets.filter(b => b.status === 'accepted' || b.status === 'edited'))
      .map(b => `• ${b.editedText || b.suggestedText}`)
      .join('\n');

    await navigator.clipboard.writeText(acceptedBullets);
    toast({ title: 'Copied to clipboard' });
  }, [sections, toast]);

  const handleDownloadPDF = useCallback(() => {
    toast({ title: 'PDF Export', description: 'Coming soon!' });
  }, [toast]);

  const handleDownloadDOCX = useCallback(() => {
    toast({ title: 'DOCX Export', description: 'Coming soon!' });
  }, [toast]);

  // ========== RENDER ==========

  // Calculate current tier
  const currentTier = score ? score.tier : calculateTier(0);
  const currentScore = score?.overallScore || 0;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Title + Role */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="font-semibold">{score?.detected?.role || 'Resume Builder'}</h1>
              <p className="text-sm text-muted-foreground">
                {score?.detected?.industry} • {score?.detected?.level}
              </p>
            </div>
          </div>

          {/* Center: Score */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <ThermometerScore
                score={currentScore}
                previousScore={previousScore}
                tier={currentTier}
                pointsToNextTier={score?.pointsToNextTier || 0}
                nextTierThreshold={score?.nextTierThreshold || getNextTierThreshold(currentScore)}
                animate={true}
                size="sm"
                showImprovement={true}
              />
            </div>
            
            {isRescoring && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Recalculating...
              </div>
            )}
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleHumanize}
              disabled={isHumanizing}
              className="gap-1"
            >
              {isHumanizing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Humanize
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePolish}
              disabled={isPolishing}
              className="gap-1"
            >
              {isPolishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Polish
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button size="sm" className="gap-1">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Score Breakdown Bar */}
        <div className="px-4 py-2 border-t bg-muted/30 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">ATS:</span>
            <Badge variant={score?.scores?.ats && score.scores.ats >= 80 ? 'default' : 'secondary'}>
              {score?.scores?.ats || 0}%
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Requirements:</span>
            <Badge variant={score?.scores?.requirements && score.scores.requirements >= 70 ? 'default' : 'secondary'}>
              {score?.scores?.requirements || 0}%
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Competitive:</span>
            <Badge variant={score?.scores?.competitive && score.scores.competitive >= 75 ? 'default' : 'secondary'}>
              {score?.scores?.competitive || 0}%
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content: Three Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Gap Radar */}
        <div className="w-64 flex-shrink-0">
          <GapRadar
            gaps={gaps}
            resolvedGapIds={resolvedGapIds}
            onReanalyze={handleReanalyzeGaps}
            isAnalyzing={isAnalyzingGaps}
          />
        </div>

        {/* Center Panel: Section Editor */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-6">
            <div className="max-w-3xl mx-auto">
              {sections.map(section => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  onToggleExpand={() => handleToggleSectionExpand(section.id)}
                  onBulletAction={(bulletId, action, text) => 
                    handleBulletAction(section.id, bulletId, action, text)
                  }
                  onRegenerateSection={() => handleGenerateSection(section.id)}
                  onApproveAllHigh={() => handleApproveAllHigh(section.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel: Live Preview */}
        <div className="w-80 flex-shrink-0">
          <LivePreview
            sections={sections}
            contactInfo={contactInfo}
            onCopyToClipboard={handleCopyToClipboard}
            onDownloadPDF={handleDownloadPDF}
            onDownloadDOCX={handleDownloadDOCX}
          />
        </div>
      </div>
    </div>
  );
}

export default SinglePageBuilder;
