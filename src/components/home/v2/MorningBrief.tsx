import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sun, Sparkles, Target, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MorningBriefProps {
  userName: string;
  vaultCompletion: number;
  activeApplications: number;
  upcomingInterviews: number;
}

export function MorningBrief({
  userName,
  vaultCompletion,
  activeApplications,
  upcomingInterviews
}: MorningBriefProps) {
  const navigate = useNavigate();

  // Determine Focus of the Day
  let focusTitle = "";
  let focusDescription = "";
  let primaryAction = "";
  let primaryLink = "";
  let FocusIcon = Sun;

  if (upcomingInterviews > 0) {
    focusTitle = "Prep Mode";
    focusDescription = `You have ${upcomingInterviews} interview${upcomingInterviews > 1 ? 's' : ''} coming up. Let's get you ready.`;
    primaryAction = "Start Interview Prep";
    primaryLink = "/agents/interview-prep";
    FocusIcon = Sparkles;
  } else if (vaultCompletion < 80) {
    focusTitle = "Build Your Foundation";
    focusDescription = "Your Career Vault is the key to better resumes. Let's boost your profile strength.";
    primaryAction = "Continue Vault Building";
    primaryLink = "/career-vault";
    FocusIcon = Target;
  } else if (activeApplications < 3) {
    focusTitle = "Growth Mode";
    focusDescription = "Your profile is strong. It's time to find opportunities that deserve you.";
    primaryAction = "Find New Jobs";
    primaryLink = "/job-search";
    FocusIcon = Sun;
  } else {
    focusTitle = "Track & Optimize";
    focusDescription = "You have active applications. Keep your momentum going.";
    primaryAction = "Check Applications";
    primaryLink = "/active-applications";
    FocusIcon = TrendingUp;
  }

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-background to-background border-none shadow-md overflow-hidden relative">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <CardContent className="p-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-primary font-medium text-sm uppercase tracking-wide">
              <FocusIcon className="h-4 w-4" />
              <span>Today's Focus: {focusTitle}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Good morning, {userName}.
            </h1>
            <p className="text-lg text-muted-foreground">
              {focusDescription}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 min-w-[200px]">
            <Button 
              size="lg" 
              className="group shadow-lg hover:shadow-xl transition-all"
              onClick={() => navigate(primaryLink)}
            >
              {primaryAction}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
