import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AppNav } from "@/components/AppNav";
import { 
  Package, FileText, Users, MessageSquare, 
  Linkedin, Building2, TrendingUp, FolderKanban,
  BookOpen, DollarSign, Lock, CheckCircle, Clock
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface PhaseProgress {
  phase: string;
  completion: number;
  isLocked: boolean;
  features: FeatureProgress[];
}

interface FeatureProgress {
  name: string;
  icon: any;
  completion: number;
  lastActivity: string | null;
  route: string;
  description: string;
  isLocked: boolean;
  requiredCompletion?: string;
}

const CommandCenter = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [phases, setPhases] = useState<PhaseProgress[]>([]);
  const [vaultCompletion, setVaultCompletion] = useState(0);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Fetch Career Vault completion
      const { data: vault } = await supabase
        .from('career_vault')
        .select('interview_completion_percentage')
        .eq('user_id', user.id)
        .single();

      const vaultComplete = vault?.interview_completion_percentage || 0;
      setVaultCompletion(vaultComplete);

      // Check subscription status
      const { data: subscription } = await supabase.functions.invoke('check-subscription');
      const isSubscribed = subscription?.subscribed || false;

      // Build phases - new workflow order
      const hasVault = vaultComplete > 0;
      const phasesData: PhaseProgress[] = [
        {
          phase: "Phase 1: Career Foundation",
          completion: vaultComplete,
          isLocked: false,
          features: [
            {
              name: 'Career Vault',
              icon: Package,
              completion: vaultComplete,
              lastActivity: null,
              route: '/career-vault/onboarding',
              description: 'Upload resume & build intelligence (Required)',
              isLocked: false
            }
          ]
        },
        {
          phase: "Phase 2: Job Discovery",
          completion: 0,
          isLocked: !hasVault,
          features: [
            {
              name: 'Job Board',
              icon: TrendingUp,
              completion: 0,
              lastActivity: null,
              route: '/opportunities',
              description: 'Browse contract & full-time opportunities',
              isLocked: !hasVault || !isSubscribed,
              requiredCompletion: !hasVault ? 'Complete Career Vault first' : !isSubscribed ? 'Upgrade to access' : undefined
            },
            {
              name: 'Search Profiles',
              icon: FolderKanban,
              completion: 0,
              lastActivity: null,
              route: '/search-profiles',
              description: 'Save & automate job searches',
              isLocked: !hasVault || !isSubscribed,
              requiredCompletion: !hasVault ? 'Complete Career Vault first' : !isSubscribed ? 'Upgrade to access' : undefined
            }
          ]
        },
        {
          phase: "Phase 3: Application & Networking",
          completion: 0,
          isLocked: !hasVault,
          features: [
            {
              name: 'Application Queue',
              icon: FolderKanban,
              completion: 0,
              lastActivity: null,
              route: '/application-queue',
              description: 'Jobs you\'re targeting',
              isLocked: !hasVault || !isSubscribed,
              requiredCompletion: !hasVault ? 'Complete Career Vault first' : !isSubscribed ? 'Upgrade to access' : undefined
            },
            {
              name: 'Resume Builder',
              icon: FileText,
              completion: 0,
              lastActivity: null,
              route: '/agents/resume-builder',
              description: 'Customize resume for each job',
              isLocked: !hasVault || !isSubscribed,
              requiredCompletion: !hasVault ? 'Complete Career Vault first' : !isSubscribed ? 'Upgrade to access' : undefined
            },
            {
              name: 'Networking Agent',
              icon: Users,
              completion: 0,
              lastActivity: null,
              route: '/agents/networking',
              description: 'Network into companies you applied to',
              isLocked: !hasVault || !isSubscribed,
              requiredCompletion: !hasVault ? 'Complete Career Vault first' : !isSubscribed ? 'Upgrade to access' : undefined
            },
            {
              name: 'LinkedIn Profile',
              icon: Linkedin,
              completion: 0,
              lastActivity: null,
              route: '/agents/linkedin-profile',
              description: 'Optimize your LinkedIn presence',
              isLocked: !hasVault || !isSubscribed,
              requiredCompletion: !hasVault ? 'Complete Career Vault first' : !isSubscribed ? 'Upgrade to access' : undefined
            }
          ]
        },
        {
          phase: "Phase 4: Interview Preparation",
          completion: 0,
          isLocked: !hasVault,
          features: [
            {
              name: 'Interview Prep Agent',
              icon: MessageSquare,
              completion: 0,
              lastActivity: null,
              route: '/agents/interview-prep',
              description: 'Practice with AI interviewer',
              isLocked: !hasVault || !isSubscribed,
              requiredCompletion: !hasVault ? 'Complete Career Vault first' : !isSubscribed ? 'Upgrade to access' : undefined
            }
          ]
        },
        {
          phase: "Phase 5: Offer Negotiation",
          completion: 0,
          isLocked: !hasVault,
          features: [
            {
              name: 'Salary Negotiation',
              icon: DollarSign,
              completion: 0,
              lastActivity: null,
              route: '/salary-negotiation',
              description: 'Get market data & negotiation scripts',
              isLocked: !hasVault || !isSubscribed,
              requiredCompletion: !hasVault ? 'Complete Career Vault first' : !isSubscribed ? 'Upgrade to access' : undefined
            }
          ]
        }
      ];

      setPhases(phasesData);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (feature: FeatureProgress) => {
    if (feature.isLocked) return <Lock className="h-5 w-5 text-muted-foreground" />;
    if (feature.completion === 100) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (feature.completion > 0) return <Clock className="h-5 w-5 text-blue-600" />;
    return <div className="h-5 w-5" />;
  };

  const handleFeatureClick = (feature: FeatureProgress) => {
    if (feature.isLocked) return;
    navigate(feature.route);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex w-full">
        <div className="flex-1">
          <AppNav />
          <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
            <p>Loading your command center...</p>
          </div>
        </div>
      </div>
    );
  }

  const overallCompletion = Math.round(vaultCompletion * 0.4); // Weighted for now

  return (
    <div className="min-h-screen flex w-full">
      <div className="flex-1">
        <AppNav />
        <div className="container py-8 space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Career Command Center</h1>
            <p className="text-muted-foreground text-lg">
              Your complete career transition workflow
            </p>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">How This Works:</h3>
              <ol className="space-y-1 text-sm text-muted-foreground">
                <li>1. <strong>Build Foundation</strong> - Upload resume to Career Vault</li>
                <li>2. <strong>Find Jobs</strong> - Browse opportunities that match your skills</li>
                <li>3. <strong>Customize & Apply</strong> - Tailor resume for each job</li>
                <li>4. <strong>Network Immediately</strong> - Reach out to people at companies you applied to</li>
                <li>5. <strong>Prepare for Interviews</strong> - Practice with AI coaching</li>
                <li>6. <strong>Negotiate Offers</strong> - Use market data to get paid what you're worth</li>
              </ol>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Overall Progress</h3>
                  <Badge variant={overallCompletion === 100 ? "default" : "secondary"}>
                    {overallCompletion}% Complete
                  </Badge>
                </div>
                <Progress value={overallCompletion} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  Complete each phase sequentially for best results
                </p>
              </div>
            </CardContent>
          </Card>

          {phases.map((phase, phaseIdx) => (
            <div key={phaseIdx} className="space-y-4">
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{phase.phase}</h2>
                  {phase.isLocked && <Lock className="h-5 w-5 text-muted-foreground" />}
                </div>
                <Separator className="flex-1" />
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {phase.features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <Card
                      key={feature.name}
                      className={`transition-all ${
                        feature.isLocked 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:shadow-lg cursor-pointer'
                      }`}
                      onClick={() => handleFeatureClick(feature)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              feature.isLocked ? 'bg-muted' : 'bg-primary/10'
                            }`}>
                              <Icon className={`h-5 w-5 ${
                                feature.isLocked ? 'text-muted-foreground' : 'text-primary'
                              }`} />
                            </div>
                            <CardTitle className="text-lg">{feature.name}</CardTitle>
                          </div>
                          {getStatusIcon(feature)}
                        </div>
                        <CardDescription>{feature.description}</CardDescription>
                        {feature.isLocked && feature.requiredCompletion && (
                          <p className="text-xs text-destructive mt-2">
                            🔒 {feature.requiredCompletion}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {!feature.isLocked && (
                          <>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-semibold">
                                  {feature.completion}%
                                </span>
                              </div>
                              <Progress value={feature.completion} className="h-2" />
                            </div>

                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                            >
                              {feature.completion === 0 ? 'Start' : feature.completion === 100 ? 'View' : 'Continue'}
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <h2 className="text-xl font-bold">Supporting Tools</h2>
              <Separator className="flex-1" />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Daily Workflow', icon: BookOpen, route: '/daily-workflow' },
                { name: 'AI Coach', icon: MessageSquare, route: '/coaching' },
                { name: 'Projects', icon: FolderKanban, route: '/projects' },
                { name: 'Agencies', icon: Building2, route: '/agencies' }
              ].map((tool) => {
                const Icon = tool.icon;
                return (
                  <Card 
                    key={tool.name}
                    className="hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => navigate(tool.route)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base">{tool.name}</CardTitle>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
