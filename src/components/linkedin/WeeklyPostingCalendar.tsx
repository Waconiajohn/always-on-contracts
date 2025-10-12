import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Clock, XCircle } from "lucide-react";

interface WeeklyPostingCalendarProps {
  postsThisWeek: Array<{
    day: string;
    status: 'published' | 'draft' | 'not_started';
    title?: string;
  }>;
  onGenerateWeek: () => void;
}

export const WeeklyPostingCalendar = ({ postsThisWeek, onGenerateWeek }: WeeklyPostingCalendarProps) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'];
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'draft':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default" className="bg-green-600">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft Ready</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Your Weekly Posting Schedule</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={onGenerateWeek}>
            Generate This Week's Posts
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {days.map((day) => {
            const post = postsThisWeek.find(p => p.day === day);
            const status = post?.status || 'not_started';
            
            return (
              <div key={day} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{day}</p>
                  {getStatusIcon(status)}
                </div>
                {getStatusBadge(status)}
                {post?.title && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {post.title}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm font-medium mb-1">📅 Weekly Goal: 4 posts (M/T/W/Th)</p>
          <p className="text-xs text-muted-foreground">
            Post to your profile + share in 15 relevant groups each day for maximum visibility
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
