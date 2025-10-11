import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Loader2,
  TrendingUp,
  Database,
  Zap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface QueueItem {
  id: string;
  file_name: string;
  status: string;
  progress: number | null;
  error_message?: string | null;
  error_type?: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
}

interface ProcessingLog {
  id: string;
  file_name: string;
  file_size: number;
  processing_time_ms?: number | null;
  success: boolean;
  confidence_level?: string | null;
  was_cached: boolean | null;
  created_at: string;
}

interface Stats {
  totalProcessed: number;
  successRate: number;
  avgProcessingTime: number;
  cacheHitRate: number;
  todayProcessed: number;
}

export function ResumeProcessingMonitor() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalProcessed: 0,
    successRate: 0,
    avgProcessingTime: 0,
    cacheHitRate: 0,
    todayProcessed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Set up realtime subscription for queue updates
    const channel = supabase
      .channel('resume_processing_monitor')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resume_processing_queue'
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch queue items
      const { data: queueData } = await supabase
        .from('resume_processing_queue')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (queueData) setQueueItems(queueData);

      // Fetch logs
      const { data: logsData } = await supabase
        .from('processing_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (logsData) {
        setLogs(logsData);
        
        // Calculate stats
        const successful = logsData.filter(l => l.success).length;
        const cached = logsData.filter(l => l.was_cached === true).length;
        const avgTime = logsData
          .filter(l => l.processing_time_ms)
          .reduce((sum, l) => sum + (l.processing_time_ms ?? 0), 0) / logsData.length;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayLogs = logsData.filter(l => new Date(l.created_at) >= today);

        setStats({
          totalProcessed: logsData.length,
          successRate: logsData.length > 0 ? (successful / logsData.length) * 100 : 0,
          avgProcessingTime: avgTime || 0,
          cacheHitRate: logsData.length > 0 ? (cached / logsData.length) * 100 : 0,
          todayProcessed: todayLogs.length
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getConfidenceBadge = (level?: string) => {
    if (!level) return null;
    
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      high: "default",
      medium: "secondary",
      low: "destructive"
    };

    return (
      <Badge variant={variants[level] || "secondary"} className="text-xs">
        {level}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalProcessed} total processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.avgProcessingTime / 1000).toFixed(1)}s</div>
            <p className="text-xs text-muted-foreground">
              Per resume analysis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cacheHitRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Instant results
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayProcessed}</div>
            <p className="text-xs text-muted-foreground">
              Resumes processed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Queue */}
      {queueItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Queue</CardTitle>
            <CardDescription>
              Current and recent processing jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {queueItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <div>
                          <p className="font-medium">{item.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <Badge variant={item.status === 'completed' ? 'default' : item.status === 'failed' ? 'destructive' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </div>
                    
                    {item.status === 'processing' && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{item.progress}%</span>
                        </div>
                        <Progress value={item.progress} />
                      </div>
                    )}
                    
                    {item.error_message && (
                      <div className="flex items-start gap-2 bg-destructive/10 rounded p-2">
                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="text-xs">
                          <p className="font-medium text-destructive">{item.error_type}</p>
                          <p className="text-muted-foreground">{item.error_message}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Processing History */}
      <Card>
        <CardHeader>
          <CardTitle>Processing History</CardTitle>
          <CardDescription>
            Detailed logs of resume analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {log.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{log.file_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                        {log.processing_time_ms && (
                          <>
                            <span>•</span>
                            <span>{(log.processing_time_ms / 1000).toFixed(2)}s</span>
                          </>
                        )}
                        {log.was_cached && (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">Cached</Badge>
                          </>
                        )}
                      </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {log.confidence_level && getConfidenceBadge(log.confidence_level)}
                  <span className="text-xs text-muted-foreground">
                    {(log.file_size / 1024).toFixed(1)} KB
                  </span>
                </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}