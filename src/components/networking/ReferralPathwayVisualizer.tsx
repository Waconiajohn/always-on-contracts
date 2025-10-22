import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Network, Users, Building2, ArrowRight, Star } from "lucide-react";
import { useNetworkingContacts } from "@/hooks/useNetworkingContacts";

interface ReferralPath {
  targetCompany: string;
  jobTitle: string;
  connections: {
    name: string;
    relationship: string;
    strength: 'strong' | 'medium' | 'weak';
    companyConnection: string;
  }[];
  priority: 'high' | 'medium' | 'low';
}

export function ReferralPathwayVisualizer() {
  const { contacts } = useNetworkingContacts();
  const [paths, setPaths] = useState<ReferralPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzeReferralPaths();
  }, [contacts]);

  const analyzeReferralPaths = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch jobs from application queue with job_opportunities
      const { data: jobs } = await supabase
        .from('application_queue')
        .select('*, job_opportunities(company_name, job_title)')
        .eq('user_id', user.id)
        .in('status', ['saved', 'applied', 'interviewing']);

      if (!jobs || jobs.length === 0) {
        setPaths([]);
        return;
      }

      // Map contacts to companies (mock analysis)
      const analyzedPaths: ReferralPath[] = jobs.slice(0, 5).map((job: any) => {
        // Find contacts that might have connections (mock for now)
        const relevantContacts = contacts
          .filter(c => c.contact_name && Math.random() > 0.3)
          .slice(0, 3)
          .map(c => ({
            name: c.contact_name,
            relationship: 'Professional contact',
            strength: Math.random() > 0.5 ? 'strong' : Math.random() > 0.5 ? 'medium' : 'weak' as any,
            companyConnection: c.contact_name || 'Unknown'
          }));

        return {
          targetCompany: job.job_opportunities?.company_name || 'Unknown Company',
          jobTitle: job.job_opportunities?.job_title || 'Unknown Position',
          connections: relevantContacts,
          priority: 'medium' as any
        };
      });

      setPaths(analyzedPaths);
    } catch (error) {
      console.error('Error analyzing referral paths:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'weak': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) return null;
  if (paths.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Network className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="mb-2">No active job applications found</p>
          <p className="text-xs">Add jobs to your pipeline to see referral pathways</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Referral Pathway Mapping
        </CardTitle>
        <CardDescription>
          Identify connections to your target companies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {paths.map((path, idx) => (
          <div key={idx} className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4" />
                  <h3 className="font-semibold">{path.targetCompany}</h3>
                  {path.priority === 'high' && (
                    <Badge variant="destructive" className="text-xs">High Priority</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{path.jobTitle}</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {path.connections.length} {path.connections.length === 1 ? 'connection' : 'connections'}
              </Badge>
            </div>

            {path.connections.length > 0 ? (
              <div className="space-y-2">
                {path.connections.map((conn, connIdx) => (
                  <div key={connIdx} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 flex-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{conn.name}</p>
                        <p className="text-xs text-muted-foreground">{conn.relationship}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs">{conn.companyConnection}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <div className={`w-2 h-2 rounded-full ${getStrengthColor(conn.strength)}`} />
                          <span className="text-xs text-muted-foreground capitalize">{conn.strength}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Request Introduction
                </Button>
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No direct connections found. Consider expanding your network in this industry.
              </div>
            )}
          </div>
        ))}

        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex gap-2">
            <Star className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Pro Tip</p>
              <p className="text-xs text-muted-foreground mt-1">
                Connections at target companies are 4x more likely to result in interviews. 
                Prioritize networking with companies in your pipeline.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
