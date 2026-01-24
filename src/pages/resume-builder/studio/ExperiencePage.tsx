import { useParams } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { StudioLayout } from '@/components/resume-builder/StudioLayout';
import { ResumeBuilderShell } from '@/components/resume-builder/ResumeBuilderShell';
import { RewriteControls } from '@/components/resume-builder/RewriteControls';
import { VersionHistory } from '@/components/resume-builder/VersionHistory';
import { BulletItem } from '@/components/resume-builder/MicroEditPopover';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useRewriteSection, useVersionHistory, useSectionContent } from '@/hooks/useRewriteSection';
import { List, FileText } from 'lucide-react';
import type { ActionSource, RBEvidence, RBProject } from '@/types/resume-builder';

const SECTION_NAME = 'experience';

export default function ExperiencePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [showHistory, setShowHistory] = useState(false);
  const [evidence, setEvidence] = useState<RBEvidence[]>([]);
  const [project, setProject] = useState<RBProject | null>(null);
  const [editMode, setEditMode] = useState<'bullets' | 'text'>('bullets');

  const { content, setContent, originalContent, isLoading: loadingContent, loadContent } = 
    useSectionContent(projectId || '', SECTION_NAME);
  const { versions, loadVersions, revertToVersion } = 
    useVersionHistory(projectId || '', SECTION_NAME);
  const { rewrite, isLoading: rewriting } = useRewriteSection();

  useEffect(() => {
    loadContent();
    loadVersions();
    loadEvidence();
    loadProject();
  }, [loadContent, loadVersions, projectId]);

  const loadProject = async () => {
    if (!projectId) return;
    const { data } = await supabase
      .from('rb_projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (data) setProject(data as unknown as RBProject);
  };

  const loadEvidence = async () => {
    if (!projectId) return;
    const { data } = await supabase
      .from('rb_evidence')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('confidence', { ascending: false });
    
    setEvidence((data as unknown as RBEvidence[]) || []);
  };

  const handleRewrite = async (action: ActionSource) => {
    if (!projectId || !content.trim()) return;
    
    const result = await rewrite({
      projectId,
      sectionName: SECTION_NAME,
      currentContent: content,
      actionSource: action,
    });

    if (result) {
      setContent(result.rewritten_text);
      loadVersions();
    }
  };

  const handleSave = async () => {
    if (!projectId) return;
    await rewrite({
      projectId,
      sectionName: SECTION_NAME,
      currentContent: content,
      actionSource: 'manual',
    });
    loadVersions();
  };

  const handleRevert = async (version: typeof versions[0]) => {
    const success = await revertToVersion(version);
    if (success) {
      setContent(version.content);
      setShowHistory(false);
    }
  };

  // Parse content into bullets for structured editing
  const parseBullets = useCallback((text: string): string[] => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => line.replace(/^[•\-]\s*/, '').trim()).filter(Boolean);
  }, []);

  const bullets = parseBullets(content);

  const handleBulletUpdate = (index: number, newText: string) => {
    const newBullets = [...bullets];
    newBullets[index] = newText;
    // Reconstruct with bullet points
    const newContent = newBullets.map(b => `• ${b}`).join('\n');
    setContent(newContent);
  };

  const evidenceContext = evidence.map(e => ({
    claim: e.claim_text,
    source: e.source,
  }));

  const hasChanges = content !== originalContent && content.trim().length > 0;

  return (
    <ResumeBuilderShell>
      <StudioLayout
        leftPanel={
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Verified Evidence</h3>
            
            {evidence.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No evidence extracted yet
              </p>
            ) : (
              <div className="space-y-2">
                {evidence.slice(0, 10).map((item) => (
                  <Card key={item.id} className="p-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium">{item.claim_text}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(Number(item.confidence || 0) * 100)}% conf
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
                {evidence.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{evidence.length - 10} more
                  </p>
                )}
              </div>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Work Experience</h2>
            <Tabs value={editMode} onValueChange={(v) => setEditMode(v as 'bullets' | 'text')}>
              <TabsList className="h-8">
                <TabsTrigger value="bullets" className="text-xs gap-1 px-2">
                  <List className="h-3 w-3" />
                  Bullets
                </TabsTrigger>
                <TabsTrigger value="text" className="text-xs gap-1 px-2">
                  <FileText className="h-3 w-3" />
                  Text
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <RewriteControls
            onRewrite={handleRewrite}
            onShowHistory={() => setShowHistory(true)}
            onSave={handleSave}
            isLoading={rewriting || loadingContent}
            hasChanges={hasChanges}
          />

          {editMode === 'bullets' ? (
            <Card className="p-4">
              <div className="space-y-1">
                {bullets.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-4 text-center">
                    No bullets to display. Switch to Text mode or run a rewrite.
                  </p>
                ) : (
                  bullets.map((bullet, index) => (
                    <BulletItem
                      key={index}
                      text={bullet}
                      index={index}
                      onUpdate={handleBulletUpdate}
                      context={{
                        job_title: project?.role_title || undefined,
                        section_name: SECTION_NAME,
                      }}
                      evidenceClaims={evidenceContext}
                    />
                  ))
                )}
              </div>
            </Card>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] text-sm leading-relaxed resize-none font-mono"
              placeholder="Your work experience..."
              disabled={rewriting || loadingContent}
            />
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{content.length} characters</span>
            <span>{bullets.length} bullets</span>
            <span>{versions.length} versions</span>
            <span>{evidence.length} evidence items</span>
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
    </ResumeBuilderShell>
  );
}
