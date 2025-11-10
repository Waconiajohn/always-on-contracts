import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Package, FileText, Users, MessageSquare, 
  Linkedin, Building2, FolderKanban,
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
        .select('review_completion_percentage')
        .eq('user_id', user.id)
        .single();

      const vaultComplete = vault?.review_completion_percentage || 0;
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
              route: '/career-vault',
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
              name: 'Job Search Board',
              icon: FolderKanban,
              completion: 0,
              lastActivity: null,
              route: '/job-search',
              description: 'Search & save job opportunities',
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
              name: 'Active Applications',
              icon: FolderKanban,
              completion: 0,
              lastActivity: null,
              route: '/active-applications',
              description: 'Track applications & interviews',
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
            },
            {
              name: 'LinkedIn Blogging',
              icon: Linkedin,
              completion: 0,
              lastActivity: null,
              route: '/agents/linkedin-blogging',
              description: 'Create engaging LinkedIn content',
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
          <div className="flex items-center justify-center h-screen">
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
        <div className="container max-w-7xl py-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Career Command Center</h1>
                <p className="text-muted-foreground text-lg">
                  Your complete career transition workflow
                </p>
              </div>
            </div>
            
            {/* Visual Workflow Guide */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Your Career Journey - 6 Phases
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="text-center space-y-2">
                  <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold ${vaultCompletion > 0 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    1
                  </div>
                  <p className="text-xs font-medium">Build Foundation</p>
                  <Progress value={vaultCompletion} className="h-1" />
                </div>
                <div className="hidden md:flex items-center justify-center">
                  <div className="w-full h-1 bg-border" />
                </div>
                <div className="text-center space-y-2">
                  <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold ${vaultCompletion === 100 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    2
                  </div>
                  <p className="text-xs font-medium">Find Jobs</p>
                </div>
                <div className="hidden md:flex items-center justify-center">
                  <div className="w-full h-1 bg-border" />
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-muted text-muted-foreground mx-auto flex items-center justify-center font-bold">
                    3
                  </div>
                  <p className="text-xs font-medium">Customize & Apply</p>
                </div>
                <div className="hidden md:flex items-center justify-center">
                  <div className="w-full h-1 bg-border" />
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-muted text-muted-foreground mx-auto flex items-center justify-center font-bold">
                    4
                  </div>
                  <p className="text-xs font-medium">Network</p>
                </div>
                <div className="hidden md:flex items-center justify-center">
                  <div className="w-full h-1 bg-border" />
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-muted text-muted-foreground mx-auto flex items-center justify-center font-bold">
                    5
                  </div>
                  <p className="text-xs font-medium">Interview Prep</p>
                </div>
                <div className="hidden md:flex items-center justify-center">
                  <div className="w-full h-1 bg-border" />
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-muted text-muted-foreground mx-auto flex items-center justify-center font-bold">
                    6
                  </div>
                  <p className="text-xs font-medium">Negotiate</p>
                </div>
              </div>
            </Card>
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

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {phase.features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <Card
                      key={feature.name}
                      className={`transition-all relative group ${
                        feature.isLocked 
                          ? 'cursor-not-allowed' 
                          : 'hover:shadow-lg cursor-pointer'
                      }`}
                      onClick={() => handleFeatureClick(feature)}
                    >
                      <CardHeader className={`pb-4 ${feature.isLocked ? 'filter blur-[2px] opacity-70 group-hover:blur-[1px] group-hover:opacity-85 transition-all' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-lg ${
                              feature.isLocked ? 'bg-muted' : 'bg-primary/10'
                            }`}>
                              <Icon className={`h-6 w-6 ${
                                feature.isLocked ? 'text-muted-foreground' : 'text-primary'
                              }`} />
                            </div>
                            <CardTitle className="text-xl">{feature.name}</CardTitle>
                          </div>
                          {!feature.isLocked && getStatusIcon(feature)}
                        </div>
                        <CardDescription>{feature.description}</CardDescription>
                      </CardHeader>
                      <CardContent className={`space-y-3 ${feature.isLocked ? 'filter blur-[2px] opacity-70 group-hover:blur-[1px] group-hover:opacity-85 transition-all' : ''}`}>
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
                      
                      {feature.isLocked && (
                        <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-background/80 backdrop-blur-[2px] flex items-center justify-center rounded-lg border-2 border-primary/20 group-hover:border-primary/30 transition-colors">
                          <div className="text-center p-4 bg-card/90 rounded-lg shadow-xl max-w-[80%]">
                            <Lock className="h-8 w-8 mx-auto mb-2 text-primary" />
                            <p className="font-semibold text-sm mb-1">Locked</p>
                            {feature.requiredCompletion && (
                              <p className="text-xs text-muted-foreground">
                                {feature.requiredCompletion}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
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
