import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CompetencyQuizResultsProps {
  vaultId: string;
  role: string;
  industry: string;
  onContinue: () => void;
}

interface CompetencyScore {
  competency_name: string;
  category: string;
  proficiency_level?: number;
  has_experience: boolean;
  required_percentage?: number;
  differentiator_weight?: number;
  percentile?: number; // Calculated from benchmarks
}

export const CompetencyQuizResults = ({
  vaultId,
  role,
  industry,
  onContinue
}: CompetencyQuizResultsProps) => {
  const [competencies, setCompetencies] = useState<CompetencyScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    loadResults();
  }, [vaultId]);

  const loadResults = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user's competency profile
      const { data: profile, error } = await supabase
        .from('user_competency_profile' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('vault_id', vaultId);

      if (error) throw error;

      // Load benchmarks for comparison
      const { data: benchmarks } = await supabase
        .from('competency_benchmarks' as any)
        .select('*')
        .eq('role', role)
        .eq('industry', industry);

      // Calculate percentiles
      const enrichedCompetencies = (profile || []).map((comp: any) => {
        const benchmark = benchmarks?.find((b: any) => b.competency_name === comp.competency_name);

        let percentile = 50; // Default to median
        if (benchmark && comp.proficiency_level && typeof benchmark === 'object') {
          // Simple percentile calculation (would be more sophisticated in production)
          const b = benchmark as any;
          if (comp.proficiency_level >= (b.percentile_90 || 4)) percentile = 90;
          else if (comp.proficiency_level >= (b.percentile_75 || 3.5)) percentile = 75;
          else if (comp.proficiency_level >= (b.percentile_50 || 3)) percentile = 50;
          else percentile = 25;
        }

        return {
          ...comp,
          percentile
        };
      });

      setCompetencies(enrichedCompetencies);

      // Calculate overall score
      const avgPercentile = enrichedCompetencies.reduce((sum, c) => sum + (c.percentile || 50), 0) / enrichedCompetencies.length;
      setOverallScore(avgPercentile);

    } catch (error: any) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group competencies by category
  const groupedCompetencies = competencies.reduce((acc, comp) => {
    if (!acc[comp.category]) {
      acc[comp.category] = [];
    }
    acc[comp.category].push(comp);
    return acc;
  }, {} as Record<string, CompetencyScore[]>);

  // Calculate category scores
  const categoryScores = Object.entries(groupedCompetencies).map(([category, comps]) => ({
    category,
    score: comps.reduce((sum, c) => sum + (c.percentile || 50), 0) / comps.length,
    competencies: comps
  }));

  // Identify strengths and development areas
  const strengths = categoryScores.filter(c => c.score >= 75).sort((a, b) => b.score - a.score);
  const developmentAreas = categoryScores.filter(c => c.score < 60).sort((a, b) => a.score - b.score);

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Analyzing your competencies...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Overall Score */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Your Competency Profile
          </CardTitle>
          <CardDescription>
            Compared to {role.replace(/_/g, ' ')} professionals in {industry}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="text-5xl font-bold text-primary mb-2">
              {Math.round(overallScore)}th
            </div>
            <p className="text-muted-foreground">Percentile Overall</p>
            <p className="text-sm text-muted-foreground mt-2">
              You're in the top {100 - Math.round(overallScore)}% of candidates
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Strengths */}
      {strengths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Your Strengths
            </CardTitle>
            <CardDescription>
              Areas where you excel compared to peers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {strengths.map(({ category, score, competencies: comps }) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{category}</h4>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {Math.round(score)}th percentile
                    </Badge>
                    {score >= 90 && (
                      <Badge variant="default">⭐⭐ Exceptional</Badge>
                    )}
                    {score >= 75 && score < 90 && (
                      <Badge variant="default">⭐ Strong</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {comps.length} {comps.length === 1 ? 'competency' : 'competencies'}
                  </div>
                </div>
                <Progress value={score} className="h-2" />
                <div className="flex flex-wrap gap-2 mt-2">
                  {comps.slice(0, 5).map(comp => (
                    <Badge key={comp.competency_name} variant="secondary" className="text-xs">
                      {comp.competency_name}
                    </Badge>
                  ))}
                  {comps.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{comps.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Development Areas */}
      {developmentAreas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              Development Opportunities
            </CardTitle>
            <CardDescription>
              Areas to enhance for competitive advantage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {developmentAreas.map(({ category, score, competencies: comps }) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{category}</h4>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      {Math.round(score)}th percentile
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {comps.length} {comps.length === 1 ? 'competency' : 'competencies'}
                  </div>
                </div>
                <Progress value={score} className="h-2" />
                <div className="flex flex-wrap gap-2 mt-2">
                  {comps.map(comp => (
                    <Badge key={comp.competency_name} variant="outline" className="text-xs">
                      {comp.competency_name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* All Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Competency Breakdown</CardTitle>
          <CardDescription>
            All {Object.keys(groupedCompetencies).length} competency categories assessed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {categoryScores.sort((a, b) => b.score - a.score).map(({ category, score }) => (
            <div key={category} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{category}</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(score)}th percentile
                  </span>
                </div>
                <Progress value={score} className="h-1.5" />
              </div>
              {score >= 75 && <TrendingUp className="h-4 w-4 text-green-600" />}
              {score < 60 && <TrendingDown className="h-4 w-4 text-orange-600" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Competitive Positioning */}
      <Card>
        <CardHeader>
          <CardTitle>Competitive Positioning Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {strengths.length > 0 && (
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-md">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Highlight Your Strengths</p>
                <p className="text-sm text-green-700">
                  Your {strengths[0].category} skills are exceptional (top {100 - Math.round(strengths[0].score)}%).
                  Lead with these in your resume and interviews.
                </p>
              </div>
            </div>
          )}

          {developmentAreas.length > 0 && (
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-md">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900">Address Gaps Strategically</p>
                <p className="text-sm text-orange-700">
                  {developmentAreas[0].category} is below average for {role} roles.
                  Consider downplaying this or highlighting compensating strengths.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-md">
            <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Smart Application Strategy</p>
              <p className="text-sm text-blue-700">
                Your profile is strongest for roles emphasizing {strengths[0]?.category.toLowerCase()}.
                We'll automatically match you to roles that play to your strengths.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button size="lg" onClick={onContinue}>
          Continue to Resume Builder
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
