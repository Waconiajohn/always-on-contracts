import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Send, CheckCircle2, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  submitted: number;
  pending: number;
  success_rate: number;
  this_week: number;
}

export const ApplicationStats = () => {
  const [stats, setStats] = useState<Stats>({
    submitted: 0,
    pending: 0,
    success_rate: 0,
    this_week: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get submitted count
      const { count: submittedCount } = await supabase
        .from('application_tracking')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'submitted');

      // Get pending count
      const { count: pendingCount } = await supabase
        .from('application_queue')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending');

      // Get this week's count
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { count: weekCount } = await supabase
        .from('application_tracking')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('submitted_at', weekAgo.toISOString());

      // Calculate success rate (responses received / submitted)
      const { count: responsesCount } = await supabase
        .from('application_tracking')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('response_received_at', 'is', null);

      const successRate = submittedCount ? Math.round((responsesCount! / submittedCount!) * 100) : 0;

      setStats({
        submitted: submittedCount || 0,
        pending: pendingCount || 0,
        success_rate: successRate,
        this_week: weekCount || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Applications Submitted",
      value: stats.submitted,
      icon: Send,
      color: "text-blue-500"
    },
    {
      title: "Pending Review",
      value: stats.pending,
      icon: Clock,
      color: "text-orange-500"
    },
    {
      title: "Response Rate",
      value: `${stats.success_rate}%`,
      icon: CheckCircle2,
      color: "text-green-500"
    },
    {
      title: "This Week",
      value: stats.this_week,
      icon: TrendingUp,
      color: "text-purple-500"
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Icon className={`h-4 w-4 ${stat.color}`} />
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
