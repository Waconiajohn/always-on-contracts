import { Check, X, AlertTriangle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ComparisonRow {
  feature: string;
  resumeOptimizer: { value: string; type: "check" | "x" | "warning" | "text" };
  genericAI: { value: string; type: "check" | "x" | "warning" | "text" };
  traditional: { value: string; type: "check" | "x" | "warning" | "text" };
}

const comparisonData: ComparisonRow[] = [
  {
    feature: "Time to Complete",
    resumeOptimizer: { value: "15 minutes", type: "text" },
    genericAI: { value: "30+ min (manual)", type: "text" },
    traditional: { value: "3-7 days", type: "text" },
  },
  {
    feature: "Cost",
    resumeOptimizer: { value: "Included", type: "text" },
    genericAI: { value: "Free*", type: "text" },
    traditional: { value: "$200-500+", type: "text" },
  },
  {
    feature: "Job-Specific Analysis",
    resumeOptimizer: { value: "Yes", type: "check" },
    genericAI: { value: "No", type: "x" },
    traditional: { value: "Varies", type: "warning" },
  },
  {
    feature: "Zero Fabrication Risk",
    resumeOptimizer: { value: "Yes", type: "check" },
    genericAI: { value: "High Risk", type: "x" },
    traditional: { value: "Varies", type: "warning" },
  },
  {
    feature: "Evidence Tags",
    resumeOptimizer: { value: "Yes", type: "check" },
    genericAI: { value: "No", type: "x" },
    traditional: { value: "No", type: "x" },
  },
  {
    feature: "Maintains Your Voice",
    resumeOptimizer: { value: "Yes", type: "check" },
    genericAI: { value: "No", type: "x" },
    traditional: { value: "No", type: "x" },
  },
  {
    feature: "Editable After",
    resumeOptimizer: { value: "Yes", type: "check" },
    genericAI: { value: "Copy/paste", type: "warning" },
    traditional: { value: "Extra fees", type: "x" },
  },
  {
    feature: "ATS Optimization",
    resumeOptimizer: { value: "Yes", type: "check" },
    genericAI: { value: "No guarantee", type: "warning" },
    traditional: { value: "Varies", type: "warning" },
  },
  {
    feature: "Interview Prep",
    resumeOptimizer: { value: "Yes", type: "check" },
    genericAI: { value: "No", type: "x" },
    traditional: { value: "No", type: "x" },
  },
  {
    feature: "Unlimited Updates",
    resumeOptimizer: { value: "Yes", type: "check" },
    genericAI: { value: "Manual", type: "warning" },
    traditional: { value: "Extra fees", type: "x" },
  },
];

const ValueCell = ({ value, type }: { value: string; type: "check" | "x" | "warning" | "text" }) => {
  if (type === "check") {
    return (
      <div className="flex items-center justify-center gap-1.5">
        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check className="w-3 h-3 text-green-600" />
        </div>
        <span className="text-sm text-green-600 hidden sm:inline">{value}</span>
      </div>
    );
  }
  if (type === "x") {
    return (
      <div className="flex items-center justify-center gap-1.5">
        <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
          <X className="w-3 h-3 text-red-500" />
        </div>
        <span className="text-sm text-red-500 hidden sm:inline">{value}</span>
      </div>
    );
  }
  if (type === "warning") {
    return (
      <div className="flex items-center justify-center gap-1.5">
        <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
        </div>
        <span className="text-sm text-amber-500 hidden sm:inline">{value}</span>
      </div>
    );
  }
  return <span className="text-sm text-center block">{value}</span>;
};

export const ComparisonTable = () => {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">Compare Options</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Why Resume Optimizer Wins
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See how we stack up against generic AI tools and traditional resume services.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 border-b bg-background sticky left-0 z-10 min-w-[140px]">
                  Feature
                </th>
                <th className="p-4 border-b bg-primary/5 border-x-2 border-primary/20 min-w-[160px]">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-semibold text-primary">Resume Optimizer</span>
                    <Badge className="bg-primary">Best Value</Badge>
                  </div>
                </th>
                <th className="p-4 border-b min-w-[140px]">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
                      🤖
                    </div>
                    <span className="font-medium text-muted-foreground">Generic AI Tools</span>
                    <span className="text-xs text-muted-foreground">(ChatGPT, etc.)</span>
                  </div>
                </th>
                <th className="p-4 border-b min-w-[140px]">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
                      ✍️
                    </div>
                    <span className="font-medium text-muted-foreground">Traditional Services</span>
                    <span className="text-xs text-muted-foreground">(Resume writers)</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="p-4 border-b font-medium text-sm sticky left-0 bg-inherit z-10">
                    {row.feature}
                  </td>
                  <td className="p-4 border-b border-x-2 border-primary/20 bg-primary/5">
                    <ValueCell {...row.resumeOptimizer} />
                  </td>
                  <td className="p-4 border-b">
                    <ValueCell {...row.genericAI} />
                  </td>
                  <td className="p-4 border-b">
                    <ValueCell {...row.traditional} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          *Generic AI tools are free but require significant manual effort to format, verify accuracy, and optimize for ATS.
        </p>
      </div>
    </section>
  );
};
