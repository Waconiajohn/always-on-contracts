import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, MessageSquare, Target, TrendingUp } from 'lucide-react';

interface CategoryStats {
  resumeContent: {
    achievements: number;
    powerPhrases: number;
    skills: number;
    education: number;
  };
  interviewPrep: {
    leadershipStories: number;
    softSkills: number;
    problemSolving: number;
    competencies: number;
  };
  targeting: {
    differentiators: number;
    cultureFit: number;
    personalityTraits: number;
    workStyle: number;
  };
}

interface CategoryOrganizerProps {
  stats: CategoryStats;
  onCategoryClick: (category: string) => void;
}

export const CategoryOrganizer = ({ stats, onCategoryClick }: CategoryOrganizerProps) => {
  const totalResumeContent = Object.values(stats.resumeContent).reduce((a, b) => a + b, 0);
  const totalInterviewPrep = Object.values(stats.interviewPrep).reduce((a, b) => a + b, 0);
  const totalTargeting = Object.values(stats.targeting).reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vault Organization</CardTitle>
        <p className="text-sm text-muted-foreground">
          Your vault organized by how you'll use it
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="resume" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="resume" className="gap-2">
              <FileText className="h-4 w-4" />
              Resume Content
              <Badge variant="secondary">{totalResumeContent}</Badge>
            </TabsTrigger>
            <TabsTrigger value="interview" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Interview Prep
              <Badge variant="secondary">{totalInterviewPrep}</Badge>
            </TabsTrigger>
            <TabsTrigger value="targeting" className="gap-2">
              <Target className="h-4 w-4" />
              Targeting
              <Badge variant="secondary">{totalTargeting}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resume" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Content that appears directly on your resumes
            </p>
            
            <div
              className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => onCategoryClick('achievements')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">💪 Achievements</h4>
                  <p className="text-xs text-muted-foreground">
                    Impact statements with metrics
                  </p>
                </div>
                <Badge>{stats.resumeContent.achievements}</Badge>
              </div>
            </div>

            <div
              className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => onCategoryClick('power_phrases')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">⚡ Power Phrases</h4>
                  <p className="text-xs text-muted-foreground">
                    Strong action verbs and accomplishments
                  </p>
                </div>
                <Badge>{stats.resumeContent.powerPhrases}</Badge>
              </div>
            </div>

            <div
              className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => onCategoryClick('skills')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">🛠️ Skills</h4>
                  <p className="text-xs text-muted-foreground">
                    Technical and transferable skills
                  </p>
                </div>
                <Badge>{stats.resumeContent.skills}</Badge>
              </div>
            </div>

            <div
              className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => onCategoryClick('education')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">🎓 Education</h4>
                  <p className="text-xs text-muted-foreground">
                    Degrees, certifications, training
                  </p>
                </div>
                <Badge>{stats.resumeContent.education}</Badge>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="interview" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Stories and examples for behavioral interviews
            </p>
            
            <div
              className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => onCategoryClick('leadership_examples')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">🎯 Leadership Stories</h4>
                  <p className="text-xs text-muted-foreground">
                    Team leadership and management
                  </p>
                </div>
                <Badge>{stats.interviewPrep.leadershipStories}</Badge>
              </div>
            </div>

            <div
              className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => onCategoryClick('soft_skills')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">🧠 Soft Skills</h4>
                  <p className="text-xs text-muted-foreground">
                    Communication, teamwork, adaptability
                  </p>
                </div>
                <Badge>{stats.interviewPrep.softSkills}</Badge>
              </div>
            </div>

            <div
              className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => onCategoryClick('problem_solving_examples')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">🔧 Problem-Solving</h4>
                  <p className="text-xs text-muted-foreground">
                    Complex challenges you've overcome
                  </p>
                </div>
                <Badge>{stats.interviewPrep.problemSolving}</Badge>
              </div>
            </div>

            <div
              className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => onCategoryClick('hidden_competencies')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">💡 Core Competencies</h4>
                  <p className="text-xs text-muted-foreground">
                    Strategic planning, analysis, innovation
                  </p>
                </div>
                <Badge>{stats.interviewPrep.competencies}</Badge>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="targeting" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              What makes you unique and culturally aligned
            </p>
            
            <div
              className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => onCategoryClick('differentiators')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">✨ Differentiators</h4>
                  <p className="text-xs text-muted-foreground">
                    What sets you apart from other candidates
                  </p>
                </div>
                <Badge>{stats.targeting.differentiators}</Badge>
              </div>
            </div>

            <div
              className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => onCategoryClick('culture_fit')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">🤝 Culture Fit</h4>
                  <p className="text-xs text-muted-foreground">
                    Values, work style, team dynamics
                  </p>
                </div>
                <Badge>{stats.targeting.cultureFit}</Badge>
              </div>
            </div>

            <div
              className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => onCategoryClick('personality_traits')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">🎭 Personality</h4>
                  <p className="text-xs text-muted-foreground">
                    Natural tendencies and characteristics
                  </p>
                </div>
                <Badge>{stats.targeting.personalityTraits}</Badge>
              </div>
            </div>

            <div
              className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => onCategoryClick('work_style')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">⚙️ Work Style</h4>
                  <p className="text-xs text-muted-foreground">
                    How you prefer to work and collaborate
                  </p>
                </div>
                <Badge>{stats.targeting.workStyle}</Badge>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-primary mb-1">Smart Organization</p>
              <p className="text-muted-foreground text-xs">
                Your vault items are automatically categorized by how you'll use them: 
                building resumes, preparing for interviews, or targeting specific roles and companies.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
