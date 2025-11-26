import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Briefcase, DollarSign, MapPin, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MarketResearchModalProps {
  open: boolean;
  onClose: () => void;
  vaultId: string;
}

export const MarketResearchModal = ({ open, onClose, vaultId }: MarketResearchModalProps) => {
  const [loading, setLoading] = useState(false);
  const [research, setResearch] = useState<any[]>([]);

  useEffect(() => {
    if (open && vaultId) {
      loadMarketResearch();
    }
  }, [open, vaultId]);

  const loadMarketResearch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vault_market_research')
        .select('*')
        .eq('vault_id', vaultId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResearch(data || []);
    } catch (error) {
      console.error('Error loading market research:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (research.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Market Research</DialogTitle>
            <DialogDescription>
              View collected job market data and insights
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center space-y-4">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              No market research data found. Market research is automatically collected when you upload your resume.
            </p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Calculate common skills and requirements
  const allSkills: string[] = [];
  research.forEach(job => {
    if (job.required_skills) allSkills.push(...job.required_skills);
  });

  const skillCounts = allSkills.reduce((acc: Record<string, number>, skill) => {
    acc[skill] = (acc[skill] || 0) + 1;
    return acc;
  }, {});

  const topSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Calculate match score summary
  const matchScoreSummary = research.length > 0 ? {
    averageMatch: Math.round(
      research.reduce((sum, job) => sum + (job.match_score || 0), 0) / research.length
    ),
    highMatchCount: research.filter(job => (job.match_score || 0) >= 80).length,
    mediumMatchCount: research.filter(job => (job.match_score || 0) >= 60 && (job.match_score || 0) < 80).length,
  } : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Market Research Insights</DialogTitle>
              <DialogDescription>
                {research.length} job postings analyzed from your target market
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {matchScoreSummary && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200">
              <div className="text-sm font-semibold">Your Match Score Summary</div>
              <div className="text-xs text-muted-foreground mt-1">
                Average match: <span className="font-semibold text-blue-700 dark:text-blue-300">{matchScoreSummary.averageMatch}%</span> across {research.length} job postings
              </div>
              <div className="flex gap-4 mt-2 text-xs">
                <div>High Match (80%+): <span className="font-semibold">{matchScoreSummary.highMatchCount}</span></div>
                <div>Medium Match (60-79%): <span className="font-semibold">{matchScoreSummary.mediumMatchCount}</span></div>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Market Insights Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Most In-Demand Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topSkills.map(([skill, count]) => (
                  <div key={skill} className="flex items-center justify-between">
                    <span className="text-sm">{skill}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(count / research.length) * 100}%` }}
                        />
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Job Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                Job Market Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Jobs Analyzed</span>
                <Badge variant="default">{research.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg. Salary Range</span>
                <Badge variant="secondary">
                  {research.filter(j => j.salary_min).length > 0 ? 'Available' : 'N/A'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Remote Positions</span>
                <Badge variant="secondary">
                  {research.filter(j => j.remote_type === 'remote').length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Listings */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Collected Job Postings</h3>
          <div className="space-y-4">
            {research.map((job, idx) => (
              <Card key={idx} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{job.job_title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{job.company_name}</p>
                    </div>
                    {job.match_score && (
                      <Badge variant="default">{Math.round(job.match_score)}% match</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Location and Type */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                    )}
                    {job.remote_type && (
                      <Badge variant="outline">{job.remote_type}</Badge>
                    )}
                    {job.employment_type && (
                      <Badge variant="outline">{job.employment_type}</Badge>
                    )}
                  </div>

                  {/* Salary */}
                  {(job.salary_min || job.salary_max) && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span>
                        {job.salary_min && `$${job.salary_min.toLocaleString()}`}
                        {job.salary_min && job.salary_max && ' - '}
                        {job.salary_max && `$${job.salary_max.toLocaleString()}`}
                        {job.salary_period && ` / ${job.salary_period}`}
                      </span>
                    </div>
                  )}

                  {/* Required Skills */}
                  {job.required_skills && job.required_skills.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-2">Required Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {job.required_skills.slice(0, 8).map((skill: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {job.required_skills.length > 8 && (
                          <Badge variant="outline" className="text-xs">
                            +{job.required_skills.length - 8} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description Preview */}
                  {job.job_description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {job.job_description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
