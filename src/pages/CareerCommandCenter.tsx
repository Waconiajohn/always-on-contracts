import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Package, Search, FileText, Users, MessageSquare, 
  Linkedin, Building2, TrendingUp, FolderKanban,
  BookOpen, Calendar 
} from "lucide-react";

interface FeatureProgress {
  name: string;
  icon: any;
  completion: number;
  lastActivity: string | null;
  route: string;
  description: string;
}

const CareerCommandCenter = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<FeatureProgress[]>([]);

  useEffect(() => {
    loadFeatureProgress();
  }, []);

  const loadFeatureProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Fetch Career Vault completion
      const { data: vault } = await supabase
        .from('career_vault')
        .select('interview_completion_percentage, last_updated_at')
        .eq('user_id', user.id)
        .single();

      // Fetch user feature progress
      const { data: progressData } = await supabase
        .from('user_feature_progress')
        .select('*')
        .eq('user_id', user.id);

      const progressMap = new Map(
        progressData?.map(p => [p.feature_name, p]) || []
      );

      // Build feature list with completion percentages
      const featureList: FeatureProgress[] = [
        {
          name: 'Career Vault',
          icon: Package,
          completion: vault?.interview_completion_percentage || 0,
          lastActivity: vault?.last_updated_at || null,
          route: '/career-vault',
          description: 'Your career intelligence foundation'
        },
        {
          name: 'Job Search',
          icon: Search,
          completion: progressMap.get('job_search')?.milestone_percentage || 0,
          lastActivity: progressMap.get('job_search')?.last_activity_at || null,
          route: '/job-search',
          description: 'AI-powered opportunity discovery'
        },
        {
          name: 'Applications',
          icon: FolderKanban,
          completion: progressMap.get('applications')?.milestone_percentage || 0,
          lastActivity: progressMap.get('applications')?.last_activity_at || null,
          route: '/application-queue',
          description: 'Track your application pipeline'
        },
        {
          name: 'Networking',
          icon: Users,
          completion: progressMap.get('networking')?.milestone_percentage || 0,
          lastActivity: progressMap.get('networking')?.last_activity_at || null,
          route: '/agents/networking',
          description: 'Build strategic connections'
        },
        {
          name: 'Resume Prep',
          icon: FileText,
          completion: progressMap.get('resume_prep')?.milestone_percentage || 0,
          lastActivity: progressMap.get('resume_prep')?.last_activity_at || null,
          route: '/agents/resume-builder',
          description: 'AI-optimized resume generation'
        },
        {
          name: 'Interview Prep',
          icon: MessageSquare,
          completion: progressMap.get('interview')?.milestone_percentage || 0,
          lastActivity: progressMap.get('interview')?.last_activity_at || null,
          route: '/agents/interview-prep',
          description: 'Practice and master interviews'
        },
        {
          name: 'LinkedIn',
          icon: Linkedin,
          completion: progressMap.get('linkedin')?.milestone_percentage || 0,
          lastActivity: progressMap.get('linkedin')?.last_activity_at || null,
          route: '/agents/linkedin-profile',
          description: 'Optimize your professional presence'
        },
        {
          name: 'Coaching',
          icon: MessageSquare,
          completion: progressMap.get('coaching')?.milestone_percentage || 0,
          lastActivity: progressMap.get('coaching')?.last_activity_at || null,
          route: '/coaching',
          description: 'Personalized career guidance'
        },
        {
          name: 'Agencies',
          icon: Building2,
          completion: progressMap.get('agencies')?.milestone_percentage || 0,
          lastActivity: progressMap.get('agencies')?.last_activity_at || null,
          route: '/agencies',
          description: 'Connect with staffing agencies'
        },
        {
          name: 'Templates',
          icon: BookOpen,
          completion: progressMap.get('templates')?.milestone_percentage || 100,
          lastActivity: progressMap.get('templates')?.last_activity_at || null,
          route: '/templates',
          description: 'Communication templates library'
        },
        {
          name: 'Market Intel',
          icon: TrendingUp,
          completion: progressMap.get('market_intel')?.milestone_percentage || 0,
          lastActivity: progressMap.get('market_intel')?.last_activity_at || null,
          route: '/agents/career-trends',
          description: 'Industry trends and insights'
        },
        {
          name: 'Projects',
          icon: Calendar,
          completion: progressMap.get('projects')?.milestone_percentage || 0,
          lastActivity: progressMap.get('projects')?.last_activity_at || null,
          route: '/projects',
          description: 'Manage job pursuit projects'
        }
      ];

      setFeatures(featureList);
    } catch (error) {
      console.error('Error loading feature progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionColor = (completion: number) => {
    if (completion === 0) return 'text-muted-foreground';
    if (completion < 50) return 'text-yellow-600';
    if (completion < 100) return 'text-blue-600';
    return 'text-green-600';
  };

  const getCompletionIcon = (completion: number) => {
    if (completion === 0) return '❌';
    if (completion < 50) return '⚠️';
    if (completion < 100) return '⏳';
    return '✅';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading your career command center...</p>
      </div>
    );
  }

  const overallCompletion = Math.round(
    features.reduce((sum, f) => sum + f.completion, 0) / features.length
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Career Command Center</h1>
          <p className="text-muted-foreground text-lg">
            Your complete career intelligence dashboard
          </p>
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
                {features.filter(f => f.completion === 100).length} of {features.length} features completed
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.name}
                className="hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate(feature.route)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{feature.name}</CardTitle>
                    </div>
                    <span className="text-2xl">
                      {getCompletionIcon(feature.completion)}
                    </span>
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className={`font-semibold ${getCompletionColor(feature.completion)}`}>
                        {feature.completion}%
                      </span>
                    </div>
                    <Progress value={feature.completion} className="h-2" />
                  </div>

                  {feature.lastActivity && (
                    <p className="text-xs text-muted-foreground">
                      Last used: {new Date(feature.lastActivity).toLocaleDateString()}
                    </p>
                  )}

                  <Button variant="outline" size="sm" className="w-full">
                    {feature.completion === 0 ? 'Start' : feature.completion === 100 ? 'View' : 'Continue'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CareerCommandCenter;
