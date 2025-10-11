import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Video, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface Webinar {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  instructor: string;
  max_attendees: number;
  registered_count: number;
  zoom_link: string;
  recording_available: boolean;
  topics: string[];
}

export const WebinarSchedule = () => {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeredWebinars, setRegisteredWebinars] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    // Use mock data for now - database tables will be added later
    setWebinars(mockWebinars);
    setLoading(false);
  }, []);

  const handleRegister = async (webinarId: string) => {
    // Simulate registration for now
    setRegisteredWebinars(prev => new Set([...prev, webinarId]));
    
    toast({
      title: "Registration successful!",
      description: "You'll receive a reminder email before the webinar starts"
    });

    // Update webinar count
    setWebinars(prev => prev.map(w => 
      w.id === webinarId 
        ? { ...w, registered_count: w.registered_count + 1 }
        : w
    ));
  };

  const mockWebinars: Webinar[] = [
    {
      id: '1',
      title: 'Resume Optimization Masterclass',
      description: 'Learn advanced techniques to make your resume stand out to hiring managers and ATS systems',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      time: '2:00 PM EST',
      duration: '90 minutes',
      instructor: 'Sarah Johnson, Career Coach',
      max_attendees: 50,
      registered_count: 32,
      zoom_link: 'https://zoom.us/j/example',
      recording_available: true,
      topics: ['ATS Optimization', 'Keyword Placement', 'Achievement Quantification']
    },
    {
      id: '2',
      title: 'Interview Prep: Behavioral Questions',
      description: 'Master the STAR method and prepare winning answers to common behavioral interview questions',
      date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      time: '6:00 PM EST',
      duration: '60 minutes',
      instructor: 'Michael Chen, Executive Coach',
      max_attendees: 75,
      registered_count: 48,
      zoom_link: 'https://zoom.us/j/example2',
      recording_available: true,
      topics: ['STAR Method', 'Common Questions', 'Practice Sessions']
    },
    {
      id: '3',
      title: 'LinkedIn Profile Optimization Workshop',
      description: 'Transform your LinkedIn profile into a lead generation machine',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      time: '12:00 PM EST',
      duration: '75 minutes',
      instructor: 'Lisa Rodriguez, Personal Branding Expert',
      max_attendees: 60,
      registered_count: 28,
      zoom_link: 'https://zoom.us/j/example3',
      recording_available: true,
      topics: ['Headline Optimization', 'About Section', 'Content Strategy']
    }
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Upcoming Live Webinars</h2>
        <p className="text-muted-foreground">
          Join expert-led sessions 3x per week • All sessions recorded for later viewing
        </p>
      </div>

      <div className="space-y-4">
        {webinars.map((webinar) => {
          const isRegistered = registeredWebinars.has(webinar.id);
          const isFull = webinar.registered_count >= webinar.max_attendees;
          const spotsLeft = webinar.max_attendees - webinar.registered_count;

          return (
            <Card key={webinar.id} className="border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={isRegistered ? "default" : "secondary"}>
                        {isRegistered ? "Registered" : "Upcoming"}
                      </Badge>
                      {isFull && !isRegistered && (
                        <Badge variant="destructive">Full</Badge>
                      )}
                      {spotsLeft <= 10 && !isFull && !isRegistered && (
                        <Badge variant="outline" className="text-orange-500 border-orange-500">
                          {spotsLeft} spots left
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl mb-2">{webinar.title}</CardTitle>
                    <CardDescription>{webinar.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{new Date(webinar.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{webinar.time} • {webinar.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span>{webinar.registered_count} / {webinar.max_attendees} registered</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Video className="h-4 w-4 text-primary" />
                    <span>Instructor: {webinar.instructor}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Topics Covered:</p>
                  <div className="flex flex-wrap gap-2">
                    {webinar.topics.map((topic, i) => (
                      <Badge key={i} variant="outline">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  {isRegistered ? (
                    <Button className="flex-1" onClick={() => window.open(webinar.zoom_link, '_blank')}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Join Webinar
                    </Button>
                  ) : (
                    <Button 
                      className="flex-1" 
                      onClick={() => handleRegister(webinar.id)}
                      disabled={isFull}
                    >
                      {isFull ? 'Fully Booked' : 'Register Now'}
                    </Button>
                  )}
                  {webinar.recording_available && (
                    <Button variant="outline">
                      View Past Recording
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Webinar Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Mondays 2:00 PM EST:</strong> Resume & Application Strategy</p>
            <p><strong>Wednesdays 6:00 PM EST:</strong> Interview Preparation & Behavioral Questions</p>
            <p><strong>Fridays 12:00 PM EST:</strong> LinkedIn, Networking & Personal Branding</p>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            All webinars are recorded and available in your dashboard within 24 hours
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
