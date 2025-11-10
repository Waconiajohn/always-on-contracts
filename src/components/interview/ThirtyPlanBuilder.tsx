import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, TrendingUp, Sparkles } from "lucide-react";
import { validateInput, invokeEdgeFunction, Generate3060Plan } from "@/lib/edgeFunction";
import { logger } from "@/lib/logger";

interface ThirtyPlanBuilderProps {
  jobDescription: string;
  companyResearch: any;
  vaultId: string;
}

export function ThirtyPlanBuilder({ jobDescription, companyResearch, vaultId }: ThirtyPlanBuilderProps) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const validated = validateInput(Generate3060Plan, {
        jobDescription,
        vaultId
      });

      const { data, error } = await invokeEdgeFunction(
        'generate-30-60-90-plan',
        { ...validated, companyResearch }
      );

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Generation failed');
      }

      setPlan(data.plan);
    } catch (error: any) {
      logger.error('30-60-90 plan generation failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!plan ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              30-60-90 Day Plan
            </CardTitle>
            <CardDescription>
              Create a strategic onboarding roadmap tailored to this role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={generatePlan} disabled={loading} className="w-full">
              {loading ? "Generating..." : "Generate 30-60-90 Day Plan"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Accordion type="single" collapsible defaultValue="30" className="w-full">
            <AccordionItem value="30">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                    <Target className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">First 30 Days</div>
                    <div className="text-sm text-muted-foreground">Foundation & Learning</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div>
                    <Badge variant="outline" className="mb-2">Learning Objectives</Badge>
                    <ul className="space-y-2 ml-4">
                      {plan.first_30_days?.learning_objectives?.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground">• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">Relationship Building</Badge>
                    <ul className="space-y-2 ml-4">
                      {plan.first_30_days?.relationships?.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground">• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">Technical Goals</Badge>
                    <ul className="space-y-2 ml-4">
                      {plan.first_30_days?.technical_goals?.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground">• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="60">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Days 31-60</div>
                    <div className="text-sm text-muted-foreground">Early Wins & Contribution</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div>
                    <Badge variant="outline" className="mb-2">Early Wins</Badge>
                    <ul className="space-y-2 ml-4">
                      {plan.days_31_60?.early_wins?.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground">• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">Key Contributions</Badge>
                    <ul className="space-y-2 ml-4">
                      {plan.days_31_60?.contributions?.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground">• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">Feedback Loops</Badge>
                    <ul className="space-y-2 ml-4">
                      {plan.days_31_60?.feedback_loops?.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground">• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="90">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Days 61-90</div>
                    <div className="text-sm text-muted-foreground">Value Creation & Integration</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div>
                    <Badge variant="outline" className="mb-2">Value Creation</Badge>
                    <ul className="space-y-2 ml-4">
                      {plan.days_61_90?.value_creation?.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground">• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">Team Integration</Badge>
                    <ul className="space-y-2 ml-4">
                      {plan.days_61_90?.integration?.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground">• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">Long-term Planning</Badge>
                    <ul className="space-y-2 ml-4">
                      {plan.days_61_90?.long_term_planning?.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground">• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Button onClick={generatePlan} variant="outline" className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            Regenerate Plan
          </Button>
        </div>
      )}
    </div>
  );
}
