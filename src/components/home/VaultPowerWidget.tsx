import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

interface VaultPowerWidgetProps {
  completion: number;
}

const getPowerLevel = (completion: number): { level: string; color: string; next: string } => {
  if (completion >= 90) return { level: "Exceptional", color: "text-purple-500", next: "Maximum power!" };
  if (completion >= 75) return { level: "Elite", color: "text-primary", next: "90% for Exceptional" };
  if (completion >= 50) return { level: "Strong", color: "text-accent", next: "75% for Elite" };
  if (completion >= 25) return { level: "Solid", color: "text-green-500", next: "50% for Strong" };
  return { level: "Developing", color: "text-muted-foreground", next: "25% for Solid" };
};

export const VaultPowerWidget = ({ completion }: VaultPowerWidgetProps) => {
  const { level, color, next } = getPowerLevel(completion);
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (completion / 100) * circumference;

  return (
    <Card className="glass">
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Vault Power
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="relative w-20 h-20">
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
                strokeWidth="6"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={`${color} transition-all duration-1000`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold">{completion}%</span>
            </div>
          </div>
          
          <div className="flex-1 ml-4">
            <Badge className={`${color} mb-1`}>{level}</Badge>
            <p className="text-xs text-muted-foreground">{next}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
