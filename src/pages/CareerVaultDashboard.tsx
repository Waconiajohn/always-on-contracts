import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { useVaultData } from '@/hooks/useVaultData';
import { useVaultStats } from '@/hooks/useVaultStats';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Loader2, Upload, ArrowRight, Trophy, TrendingUp,
  Target, Brain, Sparkles, ChevronDown
} from "lucide-react";
import { UploadResumeModal } from '@/components/career-vault/modals/UploadResumeModal';
import { ExtractionProgressModal } from '@/components/career-vault/modals/ExtractionProgressModal';
import { GapAnalysisModal } from '@/components/career-vault/modals/GapAnalysisModal';
import { MarketResearchModal } from '@/components/career-vault/modals/MarketResearchModal';
import { EnhanceItemsDrawer } from '@/components/career-vault/modals/EnhanceItemsDrawer';
import { SmartNextSteps } from '@/components/career-vault/SmartNextSteps';
import { VaultNuclearReset } from '@/components/career-vault/VaultNuclearReset';

/**
 * Simplified Career Vault Dashboard
 * 
 * Flow:
 * 1. Upload Resume → Extracts data + pulls 25 job descriptions + benchmarks
 * 2. Dashboard shows 10 categories with item counts and progress
 * 3. "View Intelligence Library" to see and enhance items
 */
const CareerVaultDashboardContent = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [extractionModalOpen, setExtractionModalOpen] = useState(false);
  const [gapAnalysisOpen, setGapAnalysisOpen] = useState(false);
  const [marketResearchOpen, setMarketResearchOpen] = useState(false);
  const [enhanceDrawerOpen, setEnhanceDrawerOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const { data: vaultData, isLoading, refetch } = useVaultData(userId);
  const stats = useVaultStats(vaultData);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        navigate('/auth');
      }
    };
    getUserId();
  }, [navigate]);

  const handleUploadComplete = async () => {
    setUploadModalOpen(false);
    setExtractionModalOpen(true);
    await refetch();
  };

  const handleExtractionComplete = async () => {
    setExtractionModalOpen(false);
    await refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Empty state - no resume uploaded yet
  if (!vaultData?.vault || !vaultData.vault.resume_raw_text) {
    return (
      <div className="container mx-auto max-w-4xl py-12">
        <Card>
          <CardContent className="pt-12 pb-12 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-full mb-4">
              <Brain className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-purple-700 dark:text-purple-300">AI-Powered Career Intelligence</span>
            </div>
            <Upload className="h-16 w-16 text-primary mx-auto" />
            <div>
              <h1 className="text-3xl font-bold mb-2">Build Your Career Vault</h1>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Upload your resume and our AI will extract insights, analyze 25+ job postings, 
                identify gaps, and help you build a market-ready career profile.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><span className="text-primary">1.</span> Upload Resume</span>
              <ArrowRight className="h-4 w-4" />
              <span className="flex items-center gap-1"><span className="text-primary">2.</span> AI Extracts Data</span>
              <ArrowRight className="h-4 w-4" />
              <span className="flex items-center gap-1"><span className="text-primary">3.</span> Analyze 25 Jobs</span>
              <ArrowRight className="h-4 w-4" />
              <span className="flex items-center gap-1"><span className="text-primary">4.</span> Track Progress</span>
            </div>
            <Button size="lg" onClick={() => setUploadModalOpen(true)}>
              <Upload className="h-5 w-5 mr-2" />
              Upload Resume to Get Started
            </Button>
          </CardContent>
        </Card>

        <UploadResumeModal
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onUploadComplete={handleUploadComplete}
        />
      </div>
    );
  }

  // Calculate overall vault strength
  const totalItems = stats?.totalItems || 0;
  const strengthScore = stats?.strengthScore?.total || 0;
  const strengthLevel = stats?.strengthScore?.level || 'Developing';

  // Define all 10 intelligence categories
  const categories = [
    {
      key: 'achievements',
      title: 'Career Achievements',
      icon: '🎯',
      description: 'Quantified accomplishments',
      count: stats?.categoryCounts?.powerPhrases || 0,
      color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20'
    },
    {
      key: 'skills',
      title: 'Skills & Expertise',
      icon: '💼',
      description: 'Technical capabilities',
      count: stats?.categoryCounts?.transferableSkills || 0,
      color: 'from-purple-500/10 to-pink-500/10 border-purple-500/20'
    },
    {
      key: 'competencies',
      title: 'Strategic Capabilities',
      icon: '🧩',
      description: 'Hidden strengths',
      count: stats?.categoryCounts?.hiddenCompetencies || 0,
      color: 'from-green-500/10 to-emerald-500/10 border-green-500/20'
    },
    {
      key: 'strengths',
      title: 'Professional Strengths',
      icon: '💪',
      description: 'Core soft skills',
      count: stats?.categoryCounts?.softSkills || 0,
      color: 'from-orange-500/10 to-red-500/10 border-orange-500/20'
    },
    {
      key: 'leadership',
      title: 'Leadership Philosophy',
      icon: '🎓',
      description: 'Leadership approach',
      count: stats?.categoryCounts?.leadershipPhilosophy || 0,
      color: 'from-indigo-500/10 to-blue-500/10 border-indigo-500/20'
    },
    {
      key: 'executive',
      title: 'Executive Presence',
      icon: '✨',
      description: 'Professional gravitas',
      count: stats?.categoryCounts?.executivePresence || 0,
      color: 'from-yellow-500/10 to-amber-500/10 border-yellow-500/20'
    },
    {
      key: 'personality',
      title: 'Personality Traits',
      icon: '🎭',
      description: 'Work personality',
      count: stats?.categoryCounts?.personalityTraits || 0,
      color: 'from-pink-500/10 to-rose-500/10 border-pink-500/20'
    },
    {
      key: 'workstyle',
      title: 'Work Style',
      icon: '⚙️',
      description: 'How you work best',
      count: stats?.categoryCounts?.workStyle || 0,
      color: 'from-teal-500/10 to-cyan-500/10 border-teal-500/20'
    },
    {
      key: 'values',
      title: 'Core Values',
      icon: '❤️',
      description: 'What drives you',
      count: stats?.categoryCounts?.values || 0,
      color: 'from-red-500/10 to-pink-500/10 border-red-500/20'
    },
    {
      key: 'behavioral',
      title: 'Behavioral Indicators',
      icon: '🔍',
      description: 'Observable patterns',
      count: stats?.categoryCounts?.behavioralIndicators || 0,
      color: 'from-violet-500/10 to-purple-500/10 border-violet-500/20'
    }
  ];

  return (
    <div className="container mx-auto max-w-7xl py-8 space-y-8">
      {/* Compact Hero + Vault Strength */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-full">
                <Trophy className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">Career Intelligence Vault</span>
              </div>
              <h1 className="text-3xl font-bold">Your Career Intelligence</h1>
              <p className="text-muted-foreground">
                {totalItems} items • Level: <Badge variant="outline" className="ml-1">{strengthLevel}</Badge>
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-1">{strengthScore}%</div>
              <div className="text-sm text-muted-foreground">Vault Strength</div>
              <Progress value={strengthScore} className="h-2 w-32 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart Next Steps - Primary Guide */}
      <SmartNextSteps
        interviewProgress={vaultData.vault.interview_completion_percentage || 0}
        strengthScore={strengthScore}
        totalItems={totalItems}
        hasLeadership={(stats?.categoryCounts?.leadershipPhilosophy || 0) > 0}
        hasExecutivePresence={(stats?.categoryCounts?.executivePresence || 0) > 0}
      />

      {/* 3 Prominent Action Boxes */}
      <div>
        <h2 className="text-xl font-bold mb-4">Take Action</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card 
            className="border-2 border-primary/30 hover:border-primary/60 hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => setEnhanceDrawerOpen(true)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl">Enhance Items</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Use AI to upgrade quality, add strategic keywords, and strengthen weak items
              </p>
              <Button className="w-full" variant="outline">
                Start Enhancing
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="border-2 border-blue-500/30 hover:border-blue-500/60 hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => setGapAnalysisOpen(true)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                  <Target className="h-7 w-7 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Gap Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Compare your profile to market benchmarks and identify areas to strengthen
              </p>
              <Button className="w-full" variant="outline">
                Run Analysis
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="border-2 border-green-500/30 hover:border-green-500/60 hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => setMarketResearchOpen(true)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors">
                  <TrendingUp className="h-7 w-7 text-green-600" />
                </div>
                <CardTitle className="text-xl">Market Research</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                View job market insights, trends, and data from analyzed positions
              </p>
              <Button className="w-full" variant="outline">
                View Research
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Compact Category Chips */}
      <div>
        <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Intelligence Categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category.key}
              variant="outline"
              size="sm"
              className="h-auto py-2 px-3 gap-2 hover:shadow-md transition-all"
              onClick={() => navigate(`/career-intelligence?section=${category.key}`)}
            >
              <span className="text-lg">{category.icon}</span>
              <span className="font-medium">{category.title}</span>
              <Badge variant={category.count > 0 ? "default" : "secondary"} className="ml-1">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* View Full Library Button */}
      <div className="flex justify-center">
        <Button 
          size="lg" 
          onClick={() => navigate('/career-intelligence')}
          className="gap-2 shadow-lg"
        >
          View Full Intelligence Library
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Advanced Options */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full gap-2">
            <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
            Advanced Options
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          <VaultNuclearReset vaultId={vaultData.vault.id} onResetComplete={() => refetch()} />
        </CollapsibleContent>
      </Collapsible>

      {/* Modals */}
      <UploadResumeModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
      <ExtractionProgressModal
        open={extractionModalOpen}
        onComplete={handleExtractionComplete}
        vaultId={vaultData?.vault?.id}
      />
      <GapAnalysisModal
        open={gapAnalysisOpen}
        onClose={() => setGapAnalysisOpen(false)}
        vaultId={vaultData?.vault?.id || ''}
      />
      <MarketResearchModal
        open={marketResearchOpen}
        onClose={() => setMarketResearchOpen(false)}
        vaultId={vaultData?.vault?.id || ''}
      />
      <EnhanceItemsDrawer
        open={enhanceDrawerOpen}
        onClose={() => setEnhanceDrawerOpen(false)}
        vaultId={vaultData?.vault?.id || ''}
        onItemUpdated={() => refetch()}
      />
    </div>
  );
};

export default function CareerVaultDashboard() {
  return (
    <ProtectedRoute>
      <ContentLayout>
        <CareerVaultDashboardContent />
      </ContentLayout>
    </ProtectedRoute>
  );
}
