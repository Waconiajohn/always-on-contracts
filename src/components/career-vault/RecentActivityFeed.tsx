import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { getRecentActivities } from '@/lib/services/vaultActivityLogger';
import { formatDistanceToNow } from 'date-fns';
import { Activity, FileText, Brain, Target, Trophy, Sparkles } from 'lucide-react';

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  created_at: string | null;
  metadata: any;
}

interface RecentActivityFeedProps {
  vaultId: string;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'document_upload':
      return <FileText className="h-4 w-4 text-info" />;
    case 'intelligence_extracted':
      return <Brain className="h-4 w-4 text-success" />;
    case 'interview_progress':
      return <Target className="h-4 w-4 text-accent" />;
    case 'strength_score_change':
      return <Trophy className="h-4 w-4 text-warning" />;
    case 'milestone_reached':
      return <Sparkles className="h-4 w-4 text-accent" />;
    default:
      return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
};

export const RecentActivityFeed = ({ vaultId }: RecentActivityFeedProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      const data = await getRecentActivities(vaultId);
      setActivities(data);
      setLoading(false);
    };

    if (vaultId) {
      fetchActivities();
    }
  }, [vaultId]);

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-muted/30 to-background border-dashed">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          Recent Activity
        </h3>
        <div className="mt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            🚀 Your vault journey starts here
          </p>
          <p className="text-xs text-muted-foreground">
            As you upload documents, complete interviews, and enhance your career intelligence, 
            you'll see all your progress tracked here in real-time.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5" />
        Recent Activity
      </h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0 last:pb-0">
            <div className="mt-0.5">{getActivityIcon(activity.activity_type)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{activity.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {activity.created_at 
                  ? formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })
                  : 'Just now'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
