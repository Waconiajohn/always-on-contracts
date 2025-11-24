import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, Lock, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format, isBefore, subMinutes } from "date-fns";

interface CoachingSession {
  id: string;
  scheduled_date: string | null;
  duration_minutes: number | null;
  coach_name: string | null;
  calendly_link: string;
  zoom_link: string | null;
  status: string | null;
}

interface CoachingCalendarWidgetProps {
  isPlatinum: boolean;
}

export const CoachingCalendarWidget = ({ isPlatinum }: CoachingCalendarWidgetProps) => {
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Placeholder Calendly link - will be updated with actual link
  const CALENDLY_BOOKING_LINK = "https://calendly.com/careeriq-coaching";

  useEffect(() => {
    if (isPlatinum) {
      fetchSessions();
    } else {
      setLoading(false);
    }
  }, [isPlatinum]);

  const fetchSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('coaching_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .gte('scheduled_date', new Date().toISOString())
        .order('scheduled_date', { ascending: true })
        .limit(3);

      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching coaching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const canJoinSession = (sessionDate: string) => {
    const sessionTime = new Date(sessionDate);
    const fifteenMinsBefore = subMinutes(sessionTime, 15);
    return isBefore(new Date(), sessionTime) && isBefore(fifteenMinsBefore, new Date());
  };

  if (!isPlatinum) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            1-on-1 Coaching
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Lock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <Badge variant="secondary" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 mb-3">
              💎 Platinum Feature
            </Badge>
            <p className="text-base text-muted-foreground mb-4">
              Get personalized coaching from career experts
            </p>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => navigate('/pricing')}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600"
            >
              Upgrade to Platinum
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">1-on-1 Coaching</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-20 bg-muted animate-pulse rounded-lg" />
            <div className="h-10 bg-muted animate-pulse rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            1-on-1 Coaching
          </CardTitle>
        </CardHeader>
      <CardContent className="space-y-4">
        {/* Book Session Section */}
        <div className="border rounded-lg p-4 bg-muted/50">
          <h4 className="font-medium text-base mb-2">Schedule Your Session</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Book a personalized coaching session with our career experts
          </p>
          <Button
            size="sm"
            variant="default"
            className="w-full"
            onClick={() => window.open(CALENDLY_BOOKING_LINK, '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-2" />
            Book on Calendly
          </Button>
        </div>

        {/* Upcoming Sessions */}
        {sessions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-base">Upcoming Sessions</h4>
            {sessions.map(session => (
              <div key={session.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-base">{session.coach_name || 'Career Coach'}</p>
                    {session.scheduled_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(session.scheduled_date), 'MMM d, h:mm a')}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {session.duration_minutes || 45} minutes
                    </div>
                  </div>
                </div>

                {session.zoom_link && session.scheduled_date && canJoinSession(session.scheduled_date) && (
                  <Button
                    size="sm"
                    variant="default"
                    className="w-full"
                    onClick={() => window.open(session.zoom_link!, '_blank')}
                  >
                    <Video className="h-3 w-3 mr-2" />
                    Join Session
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {sessions.length === 0 && (
          <p className="text-base text-muted-foreground text-center py-2">
            No upcoming sessions scheduled
          </p>
        )}
      </CardContent>
    </Card>
  );
};
