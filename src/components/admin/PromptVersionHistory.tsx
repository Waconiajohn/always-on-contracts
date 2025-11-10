import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { History, RotateCcw, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function PromptVersionHistory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: versions, isLoading } = useQuery({
    queryKey: ['prompt-versions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_version_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: async ({ promptId, versionContent }: { promptId: string; versionContent: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update the override with the rolled-back version
      const { error } = await supabase
        .from('admin_prompt_overrides')
        .upsert({
          prompt_id: promptId,
          original_prompt: versionContent,
          override_prompt: versionContent,
          is_active: true,
          created_by: user.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Rollback successful',
        description: 'Prompt has been restored to the selected version.',
      });
      queryClient.invalidateQueries({ queryKey: ['prompt-overrides'] });
    },
    onError: (error) => {
      toast({
        title: 'Rollback failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Group versions by prompt_id
  const groupedVersions = versions?.reduce((acc, version) => {
    if (!acc[version.prompt_id]) {
      acc[version.prompt_id] = [];
    }
    acc[version.prompt_id].push(version);
    return acc;
  }, {} as Record<string, typeof versions>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Prompt Version History
        </CardTitle>
        <CardDescription>
          Track all changes and rollback to previous versions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-6">
              {Object.entries(groupedVersions || {}).map(([promptId, promptVersions]) => (
                <div key={promptId} className="space-y-3">
                  <h3 className="font-semibold text-lg">{promptId}</h3>
                  <div className="space-y-2">
                    {promptVersions.map((version) => (
                      <Card key={version.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge>v{version.version_number || 1}</Badge>
                                {version.created_at && (
                                  <span className="text-sm text-muted-foreground">
                                    {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                                  </span>
                                )}
                              </div>
                              {version.change_reason && (
                                <p className="text-sm text-muted-foreground mb-3">
                                  {version.change_reason}
                                </p>
                              )}
                              {version.performance_metrics && (
                                <div className="text-xs text-muted-foreground">
                                  Performance: {JSON.stringify(version.performance_metrics)}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[80vh]">
                                  <DialogHeader>
                                    <DialogTitle>
                                      {promptId} - Version {version.version_number}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <ScrollArea className="h-[500px]">
                                    <pre className="text-xs bg-muted p-4 rounded whitespace-pre-wrap">
                                      {version.prompt_content}
                                    </pre>
                                  </ScrollArea>
                                </DialogContent>
                              </Dialog>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => version.prompt_content && rollbackMutation.mutate({
                                  promptId: version.prompt_id,
                                  versionContent: version.prompt_content
                                })}
                                disabled={rollbackMutation.isPending || !version.prompt_content}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
