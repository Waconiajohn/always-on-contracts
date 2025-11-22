import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, AlertTriangle, Shield, Calendar, Briefcase, GraduationCap, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/lib/logger';

interface Milestone {
  id: string;
  vault_id: string;
  milestone_type: 'job' | 'education';
  company_name: string | null;
  job_title: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  graduation_date?: string | null;
  hidden_from_resume: boolean;
  hide_dates: boolean;
  date_display_preference: string;
  privacy_notes: string | null;
  work_position?: {
    id: string;
    company_name: string;
    job_title: string;
    start_date: string | null;
    end_date: string | null;
    is_current: boolean;
  } | null;
}

interface AgeRisk {
  milestoneId: string;
  type: 'old_graduation' | 'old_job';
  message: string;
  severity: 'high' | 'medium';
  suggestion: string;
  yearsAgo: number;
}

export function MilestoneManager({ vaultId }: { vaultId: string }) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [ageRisks, setAgeRisks] = useState<AgeRisk[]>([]);

  useEffect(() => {
    loadMilestones();
  }, [vaultId]);

  const loadMilestones = async () => {
    try {
      const { data, error } = await supabase
        .from('vault_resume_milestones')
        .select(`
          *,
          work_position:vault_work_positions!work_position_id (
            id,
            company_name,
            job_title,
            start_date,
            end_date,
            is_current
          )
        `)
        .eq('vault_id', vaultId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      
      const typedData = data as Milestone[];
      setMilestones(typedData);
      detectAgeRisks(typedData);
    } catch (error) {
      logger.error('Error loading milestones', error);
      toast.error('Failed to load career milestones');
    } finally {
      setLoading(false);
    }
  };

  const detectAgeRisks = (milestones: Milestone[]) => {
    const currentYear = new Date().getFullYear();
    const risks: AgeRisk[] = [];

    milestones.forEach(m => {
      // Check graduation dates > 20 years old
      if (m.milestone_type === 'education' && m.graduation_date) {
        const gradYear = parseInt(m.graduation_date.split('-')[0]);
        const yearsAgo = currentYear - gradYear;
        
        if (yearsAgo > 20) {
          risks.push({
            milestoneId: m.id,
            type: 'old_graduation',
            message: `Graduation date from ${gradYear} (${yearsAgo} years ago)`,
            severity: 'high',
            suggestion: 'Consider hiding the graduation date',
            yearsAgo
          });
        }
      }
      
      // Check jobs that started > 25 years ago
      if (m.milestone_type === 'job' && m.start_date) {
        const startYear = parseInt(m.start_date.split('-')[0]);
        const yearsAgo = currentYear - startYear;
        
        if (yearsAgo > 25) {
          risks.push({
            milestoneId: m.id,
            type: 'old_job',
            message: `Job from ${startYear} (${yearsAgo} years ago)`,
            severity: 'medium',
            suggestion: 'Consider hiding early career roles',
            yearsAgo
          });
        }
      }
    });

    setAgeRisks(risks);
  };

  const updateMilestone = async (id: string, updates: Partial<Milestone>) => {
    try {
      const { error } = await supabase
        .from('vault_resume_milestones')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setMilestones(prev => 
        prev.map(m => m.id === id ? { ...m, ...updates } : m)
      );
      toast.success('Privacy settings updated');
    } catch (error) {
      logger.error('Error updating milestone', error);
      toast.error('Failed to update settings');
    }
  };

  const deleteMilestone = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vault_resume_milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setMilestones(prev => prev.filter(m => m.id !== id));
      toast.success('Milestone deleted');
    } catch (error) {
      logger.error('Error deleting milestone', error);
      toast.error('Failed to delete milestone');
    }
  };

  const bulkHideBeforeYear = async (year: number) => {
    const toHide = milestones.filter(m => {
      if (m.milestone_type === 'job' && m.start_date) {
        const startYear = parseInt(m.start_date.split('-')[0]);
        return startYear < year;
      }
      return false;
    });

    try {
      for (const milestone of toHide) {
        await updateMilestone(milestone.id, { hidden_from_resume: true });
      }
      toast.success(`Hidden ${toHide.length} jobs before ${year}`);
    } catch (error) {
      toast.error('Failed to apply bulk changes');
    }
  };

  const bulkHideAllGraduationDates = async () => {
    const education = milestones.filter(m => m.milestone_type === 'education');
    
    try {
      for (const milestone of education) {
        await updateMilestone(milestone.id, { hide_dates: true });
      }
      toast.success('Hidden all graduation dates');
    } catch (error) {
      toast.error('Failed to hide dates');
    }
  };

  const formatDate = (m: Milestone) => {
    if (m.milestone_type === 'education' && m.graduation_date) {
      return m.graduation_date.split('-')[0];
    }
    if (m.start_date) {
      const start = m.start_date.split('-')[0];
      const end = m.end_date ? m.end_date.split('-')[0] : 'Present';
      return `${start} - ${end}`;
    }
    return 'Date unknown';
  };

  const jobs = milestones.filter(m => m.milestone_type === 'job');
  const education = milestones.filter(m => m.milestone_type === 'education');
  const visibleCount = milestones.filter(m => !m.hidden_from_resume).length;
  const hiddenCount = milestones.filter(m => m.hidden_from_resume).length;

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading career milestones...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Career History Manager</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {visibleCount} visible, {hiddenCount} hidden from resumes
          </p>
        </div>
        <Shield className="h-8 w-8 text-primary" />
      </div>

      {/* Age Discrimination Warnings */}
      {ageRisks.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Age Discrimination Risk Detected</AlertTitle>
          <AlertDescription>
            {ageRisks.length} milestone{ageRisks.length > 1 ? 's' : ''} may reveal your age and trigger unconscious bias. 
            Review the warnings below and adjust privacy settings as needed.
          </AlertDescription>
        </Alert>
      )}

      {/* Bulk Actions */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Quick Privacy Actions
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => bulkHideBeforeYear(2010)}
          >
            Hide jobs before 2010
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => bulkHideBeforeYear(2015)}
          >
            Hide jobs before 2015
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={bulkHideAllGraduationDates}
          >
            Hide all graduation dates
          </Button>
        </div>
      </Card>

      {/* Jobs Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Employment History ({jobs.length})</h3>
        </div>
        
        <div className="space-y-3">
          {jobs.map(job => {
            const risk = ageRisks.find(r => r.milestoneId === job.id);
            return (
              <Card key={job.id} className={`p-4 ${risk ? 'border-destructive' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold">{job.job_title}</h4>
                        <p className="text-sm text-muted-foreground">{job.company_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(job)}</p>
                        
                        {risk && (
                          <Alert variant="destructive" className="mt-3">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              {risk.message} - {risk.suggestion}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {job.hidden_from_resume ? (
                          <Badge variant="secondary" className="text-xs">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hidden
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            Visible
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!job.hidden_from_resume}
                          onCheckedChange={(checked) => 
                            updateMilestone(job.id, { hidden_from_resume: !checked })
                          }
                        />
                        <span className="text-sm">Include in resumes</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={job.hide_dates}
                          onCheckedChange={(checked) => 
                            updateMilestone(job.id, { hide_dates: checked })
                          }
                        />
                        <span className="text-sm">Hide dates</span>
                      </div>
                      
                      <Select
                        value={job.date_display_preference}
                        onValueChange={(value) => 
                          updateMilestone(job.id, { date_display_preference: value })
                        }
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="exact">Exact dates</SelectItem>
                          <SelectItem value="year_only">Year only</SelectItem>
                          <SelectItem value="vague">Vague (e.g., "Early 2010s")</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this job permanently?')) {
                            deleteMilestone(job.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Education Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Education ({education.length})</h3>
        </div>
        
        <div className="space-y-3">
          {education.map(edu => {
            const risk = ageRisks.find(r => r.milestoneId === edu.id);
            return (
              <Card key={edu.id} className={`p-4 ${risk ? 'border-destructive' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold">{edu.job_title}</h4>
                        <p className="text-sm text-muted-foreground">{edu.company_name}</p>
                        {edu.description && (
                          <p className="text-xs text-muted-foreground">{edu.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {edu.graduation_date ? `Graduated ${edu.graduation_date.split('-')[0]}` : 'Date unknown'}
                        </p>
                        
                        {risk && (
                          <Alert variant="destructive" className="mt-3">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              {risk.message} - {risk.suggestion}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {edu.hidden_from_resume ? (
                          <Badge variant="secondary" className="text-xs">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hidden
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            Visible
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!edu.hidden_from_resume}
                          onCheckedChange={(checked) => 
                            updateMilestone(edu.id, { hidden_from_resume: !checked })
                          }
                        />
                        <span className="text-sm">Include in resumes</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={edu.hide_dates}
                          onCheckedChange={(checked) => 
                            updateMilestone(edu.id, { hide_dates: checked })
                          }
                        />
                        <span className="text-sm">Hide graduation date</span>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this education entry permanently?')) {
                            deleteMilestone(edu.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {milestones.length === 0 && (
        <Card className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">No Career Milestones Yet</h3>
          <p className="text-sm text-muted-foreground">
            Upload a resume or complete the career vault interview to populate your career history.
          </p>
        </Card>
      )}
    </div>
  );
}
