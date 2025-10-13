import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building2, TrendingUp, AlertTriangle, Users, ChevronDown, RefreshCw } from "lucide-react";

interface CompanyResearchPanelProps {
  companyName: string;
  jobDescription: string;
}

export function CompanyResearchPanel({ companyName, jobDescription }: CompanyResearchPanelProps) {
  const [loading, setLoading] = useState(false);
  const [research, setResearch] = useState<any>(null);
  const { toast } = useToast();

  const generateResearch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-company-research', {
        body: { companyName, jobDescription }
      });

      if (error) throw error;

      if (data.success) {
        setResearch(data);
        toast({
          title: "Research Complete",
          description: `Company intelligence gathered for ${companyName}`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Research Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!research ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Research
            </CardTitle>
            <CardDescription>
              Get AI-powered company intelligence to prepare for your interview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={generateResearch} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Researching {companyName}...
                </>
              ) : (
                <>
                  <Building2 className="mr-2 h-4 w-4" />
                  Generate Company Research
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Company Intelligence: {research.companyName}</h3>
            <Button onClick={generateResearch} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <Collapsible defaultOpen>
            <Card>
              <CardHeader className="pb-3">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-base">Company Overview</CardTitle>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {research.research.overview || 'No overview available'}
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible defaultOpen>
            <Card>
              <CardHeader className="pb-3">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-base">Growth Plans</CardTitle>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {research.research.growth_plans || 'No growth plans available'}
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible defaultOpen>
            <Card>
              <CardHeader className="pb-3">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <CardTitle className="text-base">Potential Risks</CardTitle>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {research.research.risks || 'No risks identified'}
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible defaultOpen>
            <Card>
              <CardHeader className="pb-3">
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    <CardTitle className="text-base">Competitor Landscape</CardTitle>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {research.research.competitors || 'No competitors listed'}
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}
    </div>
  );
}
