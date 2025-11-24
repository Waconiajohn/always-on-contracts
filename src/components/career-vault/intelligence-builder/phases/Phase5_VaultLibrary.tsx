import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Linkedin,
  MessageSquare,
  TrendingUp,
  RefreshCw,
  Briefcase,
  Award
} from "lucide-react";

interface Phase5Props {
  vaultId: string;
  vaultData: any;
  onRestartWizard: () => void;
}

export const Phase5_VaultLibrary = ({
  vaultId: _vaultId,
  vaultData,
  onRestartWizard
}: Phase5Props) => {
  const [activeTab, setActiveTab] = useState<'positions' | 'skills' | 'achievements'>('positions');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Your Career Intelligence Library</h1>
          <p className="text-lg text-muted-foreground">
            Your career data is now organized and ready to power your job search
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary">
              {vaultData?.overall_strength_score || 0}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">Market Readiness</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary">
              {vaultData?.total_power_phrases || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Power Phrases</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary">
              {vaultData?.total_transferable_skills || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Transferable Skills</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary">
              {vaultData?.total_hidden_competencies || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Hidden Strengths</p>
          </Card>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Resume Builder */}
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Resume Builder</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Generate tailored resumes with AI-optimized bullets from your vault
            </p>
            <Button className="w-full" variant="default">
              Create Resume
            </Button>
          </Card>

          {/* LinkedIn Optimizer */}
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Linkedin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">LinkedIn Optimizer</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Optimize your LinkedIn profile with strategic positioning
            </p>
            <Button className="w-full" variant="default">
              Optimize Profile
            </Button>
          </Card>

          {/* Interview Prep */}
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Interview Prep</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Practice with AI-powered interview coaching and feedback
            </p>
            <Button className="w-full" variant="default">
              Start Prep
            </Button>
          </Card>
        </div>

        {/* Vault Content Browser */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Browse Your Vault</h2>
            <Button onClick={onRestartWizard} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-run Analysis
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('positions')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'positions'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Briefcase className="h-4 w-4 inline mr-2" />
              Positions
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'skills'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp className="h-4 w-4 inline mr-2" />
              Skills
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'achievements'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Award className="h-4 w-4 inline mr-2" />
              Achievements
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">
            {activeTab === 'positions' && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Your work history with AI-enhanced bullets and strategic positioning
                </p>
                <Badge variant="secondary">Feature coming soon</Badge>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Technical and transferable skills organized by proficiency and relevance
                </p>
                <Badge variant="secondary">Feature coming soon</Badge>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Quantified achievements and impact metrics ready for any application
                </p>
                <Badge variant="secondary">Feature coming soon</Badge>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
