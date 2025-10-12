import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Target, Wrench, Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VaultPowerWidgetProps {
  completion: number;
}

interface VaultStats {
  powerPhrases: number;
  skills: number;
  competencies: number;
}

const getPowerLevel = (completion: number): { level: string; color: string; next: string } => {
  if (completion >= 90) return { level: "Exceptional", color: "bg-ai-complete/10 text-ai-complete border-ai-complete/20", next: "Maximum power!" };
  if (completion >= 75) return { level: "Elite", color: "bg-ai-primary/10 text-ai-primary border-ai-primary/20", next: "90% for Exceptional" };
  if (completion >= 60) return { level: "Strong", color: "bg-ai-active/10 text-ai-active border-ai-active/20", next: "75% for Elite" };
  if (completion >= 40) return { level: "Solid", color: "bg-ai-secondary/10 text-ai-secondary border-ai-secondary/20", next: "60% for Strong" };
  return { level: "Developing", color: "bg-muted/50 text-muted-foreground border-border", next: "40% for Solid" };
};

export const VaultPowerWidget = ({ completion }: VaultPowerWidgetProps) => {
  const { level, color, next } = getPowerLevel(completion);
  const [stats, setStats] = useState<VaultStats>({ powerPhrases: 0, skills: 0, competencies: 0 });
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (completion / 100) * circumference;

  useEffect(() => {
    const fetchVaultStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('career_vault')
        .select('total_power_phrases, total_transferable_skills, total_hidden_competencies')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setStats({
          powerPhrases: data.total_power_phrases || 0,
          skills: data.total_transferable_skills || 0,
          competencies: data.total_hidden_competencies || 0,
        });
      }
    };

    fetchVaultStats();
  }, []);

  return (
    <Card className="glass border-ai-primary/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-ai-primary" />
            Vault Intelligence
          </h3>
          <Badge variant="secondary" className={`text-[10px] ${color}`}>
            {level}
          </Badge>
        </div>

        {/* Circular Progress */}
        <div className="flex justify-center">
          <div className="relative w-24 h-24">
            <svg className="transform -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                className="text-muted/30"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                className="text-ai-primary"
                strokeWidth="6"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold">{completion}%</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Target className="h-3 w-3 text-ai-primary" />
              <span className="text-muted-foreground">Power Phrases</span>
            </div>
            <span className="font-semibold">{stats.powerPhrases}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Wrench className="h-3 w-3 text-ai-secondary" />
              <span className="text-muted-foreground">Skills Mapped</span>
            </div>
            <span className="font-semibold">{stats.skills}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Lightbulb className="h-3 w-3 text-ai-accent" />
              <span className="text-muted-foreground">Competencies</span>
            </div>
            <span className="font-semibold">{stats.competencies}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-border/50 text-center">
          <p className="text-[10px] text-muted-foreground">
            {next}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
