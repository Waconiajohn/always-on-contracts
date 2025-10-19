import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, Plus, Clock, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Resume {
  id: string;
  created_at: string;
  updated_at: string;
  content: any;
}

interface ResumeSidebarProps {
  currentResumeId?: string;
  onResumeSelect?: (resumeId: string) => void;
  onNewResume?: () => void;
}

export const ResumeSidebar: React.FC<ResumeSidebarProps> = ({
  onNewResume,
}) => {
  const { toast } = useToast();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentResumes();
  }, []);

  const loadRecentResumes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('resume_versions')
        .select('id, created_at, updated_at, content')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setResumes((data as Resume[]) || []);
    } catch (error) {
      console.error('Error loading resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* New Resume Button */}
      <Button onClick={onNewResume} className="w-full" size="lg">
        <Plus className="h-4 w-4 mr-2" />
        New Resume
      </Button>

      <Separator />

      {/* Recent Resumes */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Resumes
        </h3>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : resumes.length === 0 ? (
              <Card className="p-4">
                <p className="text-sm text-muted-foreground text-center">
                  No resumes yet. Create your first one!
                </p>
              </Card>
            ) : (
              resumes.map((resume) => (
                <Card
                  key={resume.id}
                  className="p-3 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => {
                    toast({
                      title: 'Resume loaded',
                      description: `Version from ${formatDistanceToNow(new Date(resume.created_at), { addSuffix: true })}`,
                    });
                  }}
                >
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        Resume Version
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(resume.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Templates */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Templates
        </h3>
        <div className="space-y-2">
          {['ATS Optimized', 'Executive', 'Creative'].map((template) => (
            <Card
              key={template}
              className="p-3 cursor-pointer hover:bg-accent transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{template}</span>
                <Badge variant="secondary" className="text-xs">
                  Popular
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
