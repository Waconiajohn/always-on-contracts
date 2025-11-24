import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Clock, Video, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";

interface Webinar {
  id: string;
  title: string;
  description: string | null;
  scheduled_date: string;
  duration_minutes: number | null;
  instructor_name: string | null;
  max_attendees: number | null;
  current_attendees: number | null;
  topics: string[] | null;
  isRegistered?: boolean;
}

interface WebinarScheduleWidgetProps {
  isPlatinum: boolean;
}

export const WebinarScheduleWidget = ({ isPlatinum }: WebinarScheduleWidgetProps) => {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isPlatinum) {
      fetchWebinars();
    } else {
      setLoading(false);
    }
  }, [isPlatinum]);

  const fetchWebinars = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch upcoming webinars
      const { data: webinarsData } = await supabase
        .from('webinars')
        .select('*')
        .eq('status', 'scheduled')
        .gte('scheduled_date', new Date().toISOString())
        .order('scheduled_date', { ascending: true })
        .limit(3);

      // Fetch user's registrations
      const { data: registrations } = await supabase
        .from('webinar_registrations')
        .select('webinar_id')
        .eq('user_id', user.id);

      const registeredIds = new Set(registrations?.map(r => r.webinar_id) || []);

      setWebinars((webinarsData || []).map(w => ({
        ...w,
        isRegistered: registeredIds.has(w.id)
      })));
    } catch (error) {
      console.error('Error fetching webinars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (webinarId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('webinar_registrations')
        .insert({ user_id: user.id, webinar_id: webinarId });

      if (error) throw error;

      toast.success('Successfully registered for webinar!');
      fetchWebinars();
    } catch (error) {
      toast.error('Failed to register for webinar');
      console.error(error);
    }
  };

  if (!isPlatinum) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Video className="h-5 w-5" />
            Live Webinars
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Lock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <Badge variant="secondary" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 mb-3">
              💎 Platinum Feature
            </Badge>
            <p className="text-base text-muted-foreground mb-4">
              Access live training sessions with career experts
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
          <CardTitle className="text-base">Live Webinars</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Video className="h-5 w-5" />
            Upcoming Webinars
          </CardTitle>
        </CardHeader>
      <CardContent className="space-y-4">
        {webinars.length === 0 ? (
          <p className="text-base text-muted-foreground text-center py-4">
            No upcoming webinars scheduled
          </p>
        ) : (
          webinars.map(webinar => (
            <div key={webinar.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-base">{webinar.title}</h4>
                {webinar.isRegistered && (
                  <Badge variant="secondary" className="text-xs">Registered</Badge>
                )}
              </div>
              
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(webinar.scheduled_date), 'MMM d, h:mm a')}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {webinar.duration_minutes || 60} minutes
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {webinar.current_attendees || 0}/{webinar.max_attendees || 50} registered
                </div>
              </div>

              {!webinar.isRegistered && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleRegister(webinar.id)}
                  disabled={(webinar.current_attendees || 0) >= (webinar.max_attendees || 50)}
                >
                  {(webinar.current_attendees || 0) >= (webinar.max_attendees || 50) ? 'Full' : 'Register'}
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
