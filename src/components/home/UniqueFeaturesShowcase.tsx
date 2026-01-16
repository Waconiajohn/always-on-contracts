import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Brain, Gem, TrendingUp, Star, Layers, DollarSign, Target } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Feature {
  icon: React.ReactNode;
  title: string;
  shortDesc: string;
  uniqueInsight: string;
}

const features: Feature[] = [
  {
    icon: <Bot className="h-6 w-6" />,
    title: "Dual-AI Verification",
    shortDesc: "Two AI systems verify every claim",
    uniqueInsight: "Only platform that double-checks every achievement before it goes on your resume"
  },
  {
    icon: <Brain className="h-6 w-6" />,
    title: "17-Category Intelligence Profile",
    shortDesc: "Most comprehensive career profiling",
    uniqueInsight: "Other platforms parse your resume. We build a complete intelligence profile."
  },
  {
    icon: <Gem className="h-6 w-6" />,
    title: "Dual Generation System",
    shortDesc: "Ideal example + your personalized version",
    uniqueInsight: "See what excellence looks like, then match it with your real achievements"
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Live Industry Research",
    shortDesc: "Real-time market intelligence",
    uniqueInsight: "Your resume reflects TODAY's market, not last year's trends"
  },
  {
    icon: <Star className="h-6 w-6" />,
    title: "Quality Tier System",
    shortDesc: "Gold/Silver/Bronze confidence scoring",
    uniqueInsight: "We never use guessed data without telling you"
  },
  {
    icon: <Layers className="h-6 w-6" />,
    title: "11-Phase Resume Workflow",
    shortDesc: "From blank page to interview-ready",
    uniqueInsight: "From blank page to interview-ready in one seamless workflow"
  },
  {
    icon: <DollarSign className="h-6 w-6" />,
    title: "Contract Rate Intelligence",
    shortDesc: "Premium positioning for 50+ professionals",
    uniqueInsight: "Transform experience into premium value, not discount liability"
  },
  {
    icon: <Target className="h-6 w-6" />,
    title: "Resume-Powered Interview Prep",
    shortDesc: "Answers from your proven track record",
    uniqueInsight: "Your interview answers come from your proven track record, not generic scripts"
  }
];

export const UniqueFeaturesShowcase = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="mb-8 animate-fade-in">
      <div className="text-center mb-6">
        <Badge variant="outline" className="mb-3 text-sm px-4 py-1">
          🚀 Industry-First Features
        </Badge>
        <h2 className="text-2xl font-bold mb-2">Why CareerIQ is Different</h2>
        <p className="text-muted-foreground">Features you won't find anywhere else</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature, index) => (
          <Card
            key={index}
            className={cn(
              "p-4 transition-all duration-300 cursor-pointer",
              "hover:shadow-lg hover:scale-105",
              expandedIndex === index && "ring-2 ring-primary"
            )}
            onMouseEnter={() => setExpandedIndex(index)}
            onMouseLeave={() => setExpandedIndex(null)}
          >
            <div className="flex flex-col items-center text-center h-full">
              <div className="p-3 rounded-full bg-primary/10 text-primary mb-3">
                {feature.icon}
              </div>
              <h3 className="font-semibold mb-2 text-sm">{feature.title}</h3>
              <p className={cn(
                "text-xs text-muted-foreground transition-all duration-300",
                expandedIndex === index ? "opacity-0 h-0" : "opacity-100"
              )}>
                {feature.shortDesc}
              </p>
              <p className={cn(
                "text-xs text-primary font-medium transition-all duration-300 mt-auto",
                expandedIndex === index ? "opacity-100" : "opacity-0 h-0"
              )}>
                {feature.uniqueInsight}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
