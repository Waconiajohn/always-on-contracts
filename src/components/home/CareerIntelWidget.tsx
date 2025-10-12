import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, Lightbulb } from "lucide-react";

const POWER_PHRASES = [
  "Spearheaded cross-functional initiatives that drove measurable results",
  "Architected scalable solutions that reduced operational costs by 30%",
  "Led high-performing teams to exceed quarterly targets consistently",
  "Transformed legacy systems into modern, efficient workflows",
  "Pioneered innovative approaches that increased customer satisfaction"
];

const MARKET_TRENDS = [
  { icon: "🔥", text: "AI roles +45%", type: "hot" },
  { icon: "⚡", text: "Remote jobs +32%", type: "growing" },
  { icon: "📈", text: "Tech salaries +18%", type: "rising" },
  { icon: "🎯", text: "Contract roles +25%", type: "opportunity" }
];

const TIPS = [
  "Update your vault weekly for best AI matching",
  "Customize resumes for each role using AI optimizer",
  "Use STAR stories to demonstrate impact",
  "Network consistently for hidden opportunities",
  "Review and refine your power phrases monthly"
];

export const CareerIntelWidget = () => {
  const randomPhrase = POWER_PHRASES[Math.floor(Math.random() * POWER_PHRASES.length)];
  const randomTrend = MARKET_TRENDS[Math.floor(Math.random() * MARKET_TRENDS.length)];
  const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];

  return (
    <Card className="glass">
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Today's Intel
        </h3>
        
        <div className="space-y-2 text-xs">
          <div className="p-2 rounded bg-primary/10 border border-primary/20">
            <p className="italic text-foreground/90">"{randomPhrase}"</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              <TrendingUp className="h-3 w-3 mr-1" />
              {randomTrend.icon} Trending
            </Badge>
            <span className="text-muted-foreground">{randomTrend.text}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              <Lightbulb className="h-3 w-3 mr-1" />
              💡 Tip
            </Badge>
            <span className="text-muted-foreground">{randomTip}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
