import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ModuleGate } from "@/components/ModuleGate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Target, Sparkles, MessageSquare, Loader2 } from "lucide-react";
import { CoachingChat } from "@/components/CoachingChat";
import { StarStoryBuilder } from "@/components/StarStoryBuilder";
import { WebinarSchedule } from "@/components/coaching/WebinarSchedule";
import { WhyMeBuilder } from "@/components/WhyMeBuilder";
import { supabase } from "@/integrations/supabase/client";

interface WhyMeNarrative {
  id: string;
  category: string;
  narrative: string;
  keywords: string[];
  created_at: string;
}

const CoachingContent = () => {
  const [selectedCoach, setSelectedCoach] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [narratives, setNarratives] = useState<WhyMeNarrative[]>([]);
  const [loadingNarratives, setLoadingNarratives] = useState(true);

  const fetchNarratives = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data } = await supabase
        .from('profiles')
        .select('why_me_narratives')
        .eq('user_id', user.id)
        .single();

      if (data?.why_me_narratives && Array.isArray(data.why_me_narratives)) {
        setNarratives(data.why_me_narratives as unknown as WhyMeNarrative[]);
      }
    } catch (error) {
      console.error('Error fetching narratives:', error);
    } finally {
      setLoadingNarratives(false);
    }
  };

  useEffect(() => {
    fetchNarratives();
  }, []);

  const coaches = [
    {
      id: 'robert',
      name: 'Robert',
      icon: Target,
      description: 'Strategic executive coach focused on results and quantifiable impact',
      specialty: 'Data-driven positioning',
      color: 'text-blue-500'
    },
    {
      id: 'sophia',
      name: 'Sophia',
      icon: Sparkles,
      description: 'Leadership coach specializing in personal branding and authenticity',
      specialty: 'Personal narrative',
      color: 'text-purple-500'
    },
    {
      id: 'nexus',
      name: 'Nexus',
      icon: Brain,
      description: 'AI strategist combining market intelligence with career analytics',
      specialty: 'Market positioning',
      color: 'text-emerald-500'
    }
  ];

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Executive Coaching</h1>
        <p className="text-muted-foreground">
          Work with AI coaches to optimize your career positioning and applications
        </p>
      </div>

      <Tabs defaultValue="coaching" className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-4">
          <TabsTrigger value="coaching">AI Coaching</TabsTrigger>
          <TabsTrigger value="star-stories">STAR Stories</TabsTrigger>
          <TabsTrigger value="success-stories">
            <MessageSquare className="h-4 w-4 mr-1" />
            Success Stories
          </TabsTrigger>
          <TabsTrigger value="webinars">Webinars</TabsTrigger>
        </TabsList>

        <TabsContent value="coaching" className="space-y-6">
          {!selectedCoach ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Choose Your Coach</CardTitle>
                  <CardDescription>
                    Select an AI coaching persona to help you with your career strategy
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-3">
                  {coaches.map((coach) => {
                    const Icon = coach.icon;
                    return (
                      <Card 
                        key={coach.id}
                        className="cursor-pointer hover:border-primary transition-colors hover:shadow-lg"
                        onClick={() => setSelectedCoach(coach.id)}
                      >
                        <CardHeader className="pb-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Icon className={`h-8 w-8 ${coach.color}`} />
                            <CardTitle className="text-xl">{coach.name}</CardTitle>
                          </div>
                          <CardDescription className="text-sm">
                            {coach.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">
                              {coach.specialty}
                            </span>
                            <Button size="sm" variant="ghost">
                              Start Session
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>What Can Coaching Help With?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Resume Optimization</p>
                      <p className="text-sm text-muted-foreground">
                        Tailor your experience for specific roles and companies
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Achievement Stories</p>
                      <p className="text-sm text-muted-foreground">
                        Structure your accomplishments using the STAR method
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Gap Analysis</p>
                      <p className="text-sm text-muted-foreground">
                        Identify and address qualification gaps for target roles
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Interview Preparation</p>
                      <p className="text-sm text-muted-foreground">
                        Practice responses and refine your narrative
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <CoachingChat
              coachPersonality={selectedCoach}
              onBack={() => setSelectedCoach(null)}
            />
          )}
        </TabsContent>

        <TabsContent value="star-stories">
          <StarStoryBuilder />
        </TabsContent>

        <TabsContent value="success-stories">
          {loadingNarratives ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : userId ? (
            <WhyMeBuilder 
              userId={userId} 
              narratives={narratives} 
              onUpdate={fetchNarratives} 
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Please log in to manage your success stories.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="webinars">
          <WebinarSchedule />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function Coaching() {
  return (
    <ProtectedRoute>
      <ModuleGate module="master_resume">
        <CoachingContent />
      </ModuleGate>
    </ProtectedRoute>
  );
}
