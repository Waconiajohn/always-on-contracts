import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BulletItem } from '@/components/resume-builder/MicroEditPopover';
import { List, FileText } from 'lucide-react';
import { useState } from 'react';
import { parseBullets, bulletsTocontent } from '@/hooks/useStudioPageData';

interface BulletEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  context?: {
    job_title?: string;
    company?: string;
    section_name?: string;
  };
  evidenceClaims?: Array<{ claim: string; source: string }>;
}

export function BulletEditor({
  content,
  onContentChange,
  disabled = false,
  placeholder = 'Enter content...',
  context,
  evidenceClaims,
}: BulletEditorProps) {
  const [editMode, setEditMode] = useState<'bullets' | 'text'>('bullets');
  const bullets = parseBullets(content);

  const handleBulletUpdate = (index: number, newText: string) => {
    const newBullets = [...bullets];
    newBullets[index] = newText;
    onContentChange(bulletsTocontent(newBullets));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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
                  context={context}
                  evidenceClaims={evidenceClaims}
                />
              ))
            )}
          </div>
        </Card>
      ) : (
        <Textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="min-h-[400px] text-sm leading-relaxed resize-none font-mono"
          placeholder={placeholder}
          disabled={disabled}
        />
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{content.length} characters</span>
        <span>{bullets.length} bullets</span>
      </div>
    </div>
  );
}
