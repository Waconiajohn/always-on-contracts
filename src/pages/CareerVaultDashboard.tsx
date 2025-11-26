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
import { 
  Loader2, Upload, ArrowRight, Trophy, TrendingUp,
  Target, Brain, Sparkles
} from "lucide-react";
import { UploadResumeModal } from '@/components/career-vault/modals/UploadResumeModal';
import { ExtractionProgressModal } from '@/components/career-vault/modals/ExtractionProgressModal';

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
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-full">
          <Trophy className="h-5 w-5 text-purple-600" />
          <span className="font-semibold text-purple-700 dark:text-purple-300">Career Intelligence Vault</span>
        </div>
        <h1 className="text-4xl font-bold">Your Career Intelligence</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {totalItems} intelligence items extracted and organized across 10 categories
        </p>
      </div>

      {/* Overall Progress Card */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Vault Strength: {strengthScore}%</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Level: <Badge variant="outline">{strengthLevel}</Badge>
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{totalItems}</div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={strengthScore} className="h-3" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {strengthScore < 60 && "Keep building your vault to reach market readiness"}
              {strengthScore >= 60 && strengthScore < 85 && "You're making great progress!"}
              {strengthScore >= 85 && "Your vault is market ready! 🎉"}
            </span>
            <Button onClick={() => navigate('/career-intelligence')} variant="default" className="gap-2">
              View Intelligence Library
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 10 Category Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Intelligence Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card 
              key={category.key}
              className={`hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br ${category.color}`}
              onClick={() => navigate('/career-intelligence')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{category.icon}</span>
                  <Badge variant={category.count > 0 ? "default" : "secondary"}>
                    {category.count} items
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-1">{category.title}</h3>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Enhance Items</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use AI to upgrade quality and add strategic keywords
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 hover:border-blue-500/40 transition-colors cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Gap Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Compare your profile to market benchmarks
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 hover:border-green-500/40 transition-colors cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Market Research</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View job market insights and trends
            </p>
          </CardContent>
        </Card>
      </div>

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
