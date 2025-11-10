import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database, Trash2, RefreshCw, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

export default function CachedDataInspector() {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cacheData, isLoading } = useQuery({
    queryKey: ['cache-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resume_cache')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  const clearCacheMutation = useMutation({
    mutationFn: async (cacheId: string) => {
      const { error } = await supabase
        .from('resume_cache')
        .delete()
        .eq('id', cacheId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Cache cleared',
        description: 'Cache entry has been deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['cache-data'] });
    },
    onError: (error) => {
      toast({
        title: 'Error clearing cache',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const clearAllExpiredMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('cleanup_expired_cache');
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Expired cache cleared',
        description: 'All expired cache entries have been deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['cache-data'] });
    },
  });

  const filteredData = cacheData?.filter(item =>
    item.content_hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.file_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Cached Data Inspector
        </CardTitle>
        <CardDescription>
          View and manage cached AI responses and context data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search cache keys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['cache-data'] })}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="destructive"
            onClick={() => clearAllExpiredMutation.mutate()}
            disabled={clearAllExpiredMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Expired
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              Showing {filteredData?.length || 0} cache entries
            </div>

            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {filteredData?.map((item) => {
                  const isExpired = new Date(item.expires_at) < new Date();
                  return (
                    <Card key={item.id} className={isExpired ? 'border-destructive/50' : ''}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                                  {item.file_type} - {item.content_hash.substring(0, 16)}...
                                </code>
                                {isExpired && (
                                  <Badge variant="destructive">Expired</Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div>Hits: {item.hit_count}</div>
                                <div>
                                  Created: {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                </div>
                                <div>
                                  Expires: {formatDistanceToNow(new Date(item.expires_at), { addSuffix: true })}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => clearCacheMutation.mutate(item.id)}
                              disabled={clearCacheMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              View cached data
                            </summary>
                            <pre className="mt-2 p-3 bg-muted rounded overflow-x-auto">
                              {JSON.stringify(item.analysis_result, null, 2)}
                            </pre>
                          </details>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}
