import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { StudioLayout } from '@/components/resume-builder/StudioLayout';
import { ResumeBuilderShell } from '@/components/resume-builder/ResumeBuilderShell';
import { RewriteControls } from '@/components/resume-builder/RewriteControls';
import { VersionHistory } from '@/components/resume-builder/VersionHistory';
import { TwoStageGenerationDialog } from '@/components/resume-builder/TwoStageGenerationDialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useStudioPageData } from '@/hooks/useStudioPageData';
import type { RBKeywordDecision } from '@/types/resume-builder';
import { Check, X, AlertCircle } from 'lucide-react';

const SECTION_NAME = 'skills';

function KeywordStatusPanel({ keywords }: { keywords: RBKeywordDecision[] }) {
  const approvedKeywords = keywords.filter(k => k.decision === 'add');
  const suppressedKeywords = keywords.filter(k => k.decision === 'not_true' || k.decision === 'ignore');
  const pendingKeywords = keywords.filter(k => !k.decision || (k.decision as string) === 'pending');

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">Keyword Status</h3>
      
      {approvedKeywords.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Check className="h-3 w-3 text-primary" />
            Approved ({approvedKeywords.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {approvedKeywords.map((k) => (
              <Badge key={k.id} variant="secondary" className="text-xs bg-primary/10 text-primary">
                {k.keyword}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {suppressedKeywords.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <X className="h-3 w-3 text-destructive" />
            Suppressed ({suppressedKeywords.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {suppressedKeywords.map((k) => (
              <Badge key={k.id} variant="secondary" className="text-xs bg-destructive/10 text-destructive">
                {k.keyword}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {pendingKeywords.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-accent-foreground" />
            Pending Review ({pendingKeywords.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {pendingKeywords.map((k) => (
              <Badge key={k.id} variant="outline" className="text-xs">
                {k.keyword}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {keywords.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          No keywords analyzed yet
        </p>
      )}
    </div>
  );
}

export default function SkillsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [keywords, setKeywords] = useState<RBKeywordDecision[]>([]);
  const [showTwoStage, setShowTwoStage] = useState(false);

  const {
    content,
    setContent,
    project,
    versions,
    showHistory,
    setShowHistory,
    hasChanges,
    isLoading,
    handleRewrite,
    handleSave,
    handleRevert,
  } = useStudioPageData({ projectId: projectId || '', sectionName: SECTION_NAME });

  useEffect(() => {
    const loadKeywords = async () => {
      if (!projectId) return;
      const { data } = await supabase
        .from('rb_keyword_decisions')
        .select('*')
        .eq('project_id', projectId)
        .order('keyword', { ascending: true });
      
      setKeywords((data as unknown as RBKeywordDecision[]) || []);
    };
    loadKeywords();
  }, [projectId]);

  const handleWorldClassContent = (newContent: string) => {
    setContent(newContent);
  };

  return (
    <ResumeBuilderShell>
      <StudioLayout
        leftPanel={<KeywordStatusPanel keywords={keywords} />}
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Skills & Keywords</h2>

          <RewriteControls
            onRewrite={handleRewrite}
            onShowHistory={() => setShowHistory(true)}
            onSave={handleSave}
            onWorldClass={() => setShowTwoStage(true)}
            isLoading={isLoading}
            hasChanges={hasChanges}
          />

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[300px] text-sm leading-relaxed resize-none"
            placeholder="Your skills and keywords..."
            disabled={isLoading}
          />

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{content.length} characters</span>
            <span>{versions.length} versions</span>
            <span>{keywords.length} keywords tracked</span>
          </div>
        </div>

        <VersionHistory
          open={showHistory}
          onOpenChange={setShowHistory}
          versions={versions}
          currentContent={content}
          onRevert={handleRevert}
        />
      </StudioLayout>

      <TwoStageGenerationDialog
        open={showTwoStage}
        onOpenChange={setShowTwoStage}
        projectId={projectId || ''}
        sectionName={SECTION_NAME}
        roleTitle={project?.role_title || 'Professional'}
        seniorityLevel={project?.seniority_level || 'Mid-Level'}
        industry={project?.industry || 'Technology'}
        jobDescription={project?.jd_text || ''}
        onContentSelect={handleWorldClassContent}
      />
    </ResumeBuilderShell>
  );
}
