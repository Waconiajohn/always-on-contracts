import { Card, CardContent } from "@/components/ui/card";
import { Activity, FileText, Briefcase, Target } from "lucide-react";
import { Link } from "react-router-dom";

interface ActivityItem {
  icon: React.ElementType;
  text: string;
  time: string;
  color: string;
}

export const RecentActivityWidget = () => {
  // Mock activities - in production, fetch from database
  const activities: ActivityItem[] = [
    { icon: FileText, text: "Resume optimized", time: "2h ago", color: "text-primary" },
    { icon: Briefcase, text: "Job saved", time: "5h ago", color: "text-accent" },
    { icon: Target, text: "Interview prep completed", time: "1d ago", color: "text-purple-500" },
  ];

  return (
    <Card className="glass">
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Recent Activity
        </h3>
        
        <div className="space-y-2">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div key={index} className="flex items-start gap-2">
                <div className={`mt-0.5 ${activity.color}`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground">{activity.text}</p>
                  <p className="text-[10px] text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        <Link 
          to="/projects" 
          className="text-xs text-primary hover:underline inline-block pt-1 border-t border-border/50"
        >
          View all activity →
        </Link>
      </CardContent>
    </Card>
  );
};
