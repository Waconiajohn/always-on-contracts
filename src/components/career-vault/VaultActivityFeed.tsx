import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, FileText, CheckCircle, Plus, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getRecentActivities } from '@/lib/services/vaultTracking';

interface ActivityItem {
  id: string;
  activity_type: string;
  description: string;
  metadata: any;
  created_at: string | null;
}

interface VaultActivityFeedProps {
  vaultId: string;
  limit?: number;
}

export const VaultActivityFeed = ({ vaultId, limit = 7 }: VaultActivityFeedProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [vaultId]);

  const loadActivities = async () => {
    setLoading(true);
    const data = await getRecentActivities(vaultId, limit);
    setActivities(data as ActivityItem[]);
    setLoading(false);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document_upload':
        return <FileText className="h-4 w-4 text-info" />;
      case 'intelligence_extracted':
        return <Plus className="h-4 w-4 text-success" />;
      case 'interview_progress':
        return <Activity className="h-4 w-4 text-accent" />;
      case 'strength_score_change':
        return <TrendingUp className="h-4 w-4 text-warning" />;
      case 'milestone_reached':
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityBadge = (type: string) => {
    const configs = {
      document_upload: { label: 'Upload', variant: 'default' as const },
      intelligence_extracted: { label: 'Extracted', variant: 'secondary' as const },
      interview_progress: { label: 'Interview', variant: 'outline' as const },
      strength_score_change: { label: 'Score', variant: 'secondary' as const },
      milestone_reached: { label: 'Milestone', variant: 'default' as const },
    };
    
    const config = configs[type as keyof typeof configs] || { label: type, variant: 'outline' as const };
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Recent Activity
        </CardTitle>
        <CardDescription>Your vault in action</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity. Start building your vault to see actions here.
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="mt-0.5">
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getActivityBadge(activity.activity_type)}
                    {activity.created_at && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{activity.description}</p>
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {activity.metadata.itemsAdded && (
                        <span>+{activity.metadata.itemsAdded} items</span>
                      )}
                      {activity.metadata.scoreChange && (
                        <span className={activity.metadata.scoreChange > 0 ? 'text-success' : 'text-destructive'}>
                          {activity.metadata.scoreChange > 0 ? '+' : ''}{activity.metadata.scoreChange} points
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};