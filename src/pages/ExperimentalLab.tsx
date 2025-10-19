import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { research } from "@/lib/mcp-client";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, TrendingUp, AlertCircle, ThumbsUp, ThumbsDown } from "lucide-react";

export default function ExperimentalLab() {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [userExperiments, setUserExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load active experiments
      const experimentsResult = await research.getActiveExperiments();
      setExperiments(experimentsResult.data || []);

      // Load user participation
      const { data: userExp } = await supabase
        .from('user_experiments')
        .select('*')
        .eq('user_id', user.id);
      setUserExperiments(userExp || []);

      // Load latest research findings
      const { data: researchFindings } = await supabase
        .from('research_findings')
        .select('*')
        .eq('is_verified', true)
        .order('discovered_at', { ascending: false })
        .limit(10);
      setFindings(researchFindings || []);
    } catch (error) {
      console.error('Error loading experimental data:', error);
      toast({
        title: "Error",
        description: "Failed to load experimental features",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleExperiment = async (experimentId: string, enabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (enabled) {
        // Opt in to experiment
        const experiment = experiments.find(e => e.id === experimentId);
        const variant = Math.random() > 0.5 ? experiment.test_variant : experiment.control_variant;

        await supabase.from('user_experiments').insert({
          user_id: user.id,
          experiment_id: experimentId,
          variant
        });
      } else {
        // Opt out of experiment
        await supabase
          .from('user_experiments')
          .update({ opted_out_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('experiment_id', experimentId);
      }

      await loadData();
      
      toast({
        title: enabled ? "Experiment Enabled" : "Experiment Disabled",
        description: enabled 
          ? "You're now testing this experimental feature" 
          : "Experimental feature has been disabled",
      });
    } catch (error) {
      console.error('Error toggling experiment:', error);
      toast({
        title: "Error",
        description: "Failed to update experiment status",
        variant: "destructive",
      });
    }
  };

  const submitFeedback = async (experimentId: string, rating: number, feedback: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_experiments')
        .update({
          feedback_rating: rating,
          feedback_text: feedback
        })
        .eq('user_id', user.id)
        .eq('experiment_id', experimentId);

      toast({
        title: "Feedback Submitted",
        description: "Thank you for helping us improve!",
      });

      await loadData();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    }
  };

  const isExperimentEnabled = (experimentId: string) => {
    const userExp = userExperiments.find(ue => ue.experiment_id === experimentId);
    return userExp && !userExp.opted_out_at;
  };

  const getExperimentVariant = (experimentId: string) => {
    const userExp = userExperiments.find(ue => ue.experiment_id === experimentId);
    return userExp?.variant;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      
      <main className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Experimental Lab</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Test cutting-edge job search strategies powered by AI research. These features are experimental 
            and may be promoted to the main platform based on performance.
          </p>
        </div>

        {/* Latest Research Findings */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Latest Research Findings
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {findings.map((finding) => (
              <Card key={finding.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge variant="outline" className="mb-2">
                      {finding.finding_type}
                    </Badge>
                    {finding.credibility_score && (
                      <span className="text-sm text-muted-foreground">
                        Credibility: {finding.credibility_score}/10
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg">{finding.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{finding.summary}</p>
                  {finding.relevance_tags && finding.relevance_tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {finding.relevance_tags.slice(0, 3).map((tag: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Active Experiments */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Active Experiments
          </h2>
          <div className="grid gap-6">
            {experiments.map((experiment) => {
              const enabled = isExperimentEnabled(experiment.id);
              const variant = getExperimentVariant(experiment.id);
              const userExp = userExperiments.find(ue => ue.experiment_id === experiment.id);

              return (
                <Card key={experiment.id} className={enabled ? "border-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle>{experiment.experiment_name}</CardTitle>
                          {enabled && (
                            <Badge variant="default">Active</Badge>
                          )}
                        </div>
                        <CardDescription>{experiment.description}</CardDescription>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => toggleExperiment(experiment.id, checked)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Hypothesis:</h4>
                      <p className="text-sm text-muted-foreground">{experiment.hypothesis}</p>
                    </div>

                    {enabled && variant && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Your Variant:</h4>
                        <Badge variant="outline">{variant}</Badge>
                      </div>
                    )}

                    {experiment.success_metrics && Array.isArray(experiment.success_metrics) && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Success Metrics:</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {experiment.success_metrics.map((metric: string, i: number) => (
                            <li key={i}>{metric}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {enabled && !userExp?.feedback_rating && (
                      <div className="pt-4 border-t space-y-3">
                        <h4 className="font-semibold text-sm">Share Your Feedback:</h4>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => submitFeedback(experiment.id, 5, "Helpful")}
                          >
                            <ThumbsUp className="h-4 w-4 mr-2" />
                            Helpful
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => submitFeedback(experiment.id, 1, "Not helpful")}
                          >
                            <ThumbsDown className="h-4 w-4 mr-2" />
                            Not Helpful
                          </Button>
                        </div>
                      </div>
                    )}

                    {userExp?.feedback_rating && (
                      <div className="pt-4 border-t">
                        <Badge variant="secondary">
                          Feedback submitted - Thank you!
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {experiments.length === 0 && !loading && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Active Experiments</h3>
                  <p className="text-muted-foreground">
                    Check back soon for new experimental features to test!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
