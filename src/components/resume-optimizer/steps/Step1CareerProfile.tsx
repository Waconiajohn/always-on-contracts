import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useOptimizerStore } from '@/stores/optimizerStore';
import { CareerProfile } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Pencil, Check, X, ArrowRight, Briefcase, Award, Target, Lightbulb, User } from 'lucide-react';

export function Step1CareerProfile() {
  const { toast } = useToast();
  
  // Zustand store
  const resumeText = useOptimizerStore(state => state.resumeText);
  const careerProfile = useOptimizerStore(state => state.careerProfile);
  const setCareerProfile = useOptimizerStore(state => state.setCareerProfile);
  const confirmProfile = useOptimizerStore(state => state.confirmProfile);
  const setProcessing = useOptimizerStore(state => state.setProcessing);
  const goToNextStep = useOptimizerStore(state => state.goToNextStep);
  
  const [isLoading, setIsLoading] = useState(false);
  const [editingField, setEditingField] = useState<keyof CareerProfile | null>(null);
  const [localProfile, setLocalProfile] = useState<CareerProfile | null>(careerProfile);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch career analysis on mount if we don't have one
  useEffect(() => {
    if (!careerProfile && resumeText) {
      analyzeCareer();
    } else if (careerProfile) {
      setLocalProfile(careerProfile);
    }
  }, [resumeText, careerProfile]);
  
  const analyzeCareer = async () => {
    if (!resumeText) return;
    
    setIsLoading(true);
    setError(null);
    setProcessing(true, 'Analyzing your career trajectory...');
    
    try {
      const { data, error: apiError } = await supabase.functions.invoke('analyze-resume-initial', {
        body: { resumeText }
      });
      
      if (apiError) {
        // Handle rate limit and payment errors
        if (apiError.message?.includes('429') || apiError.message?.includes('rate limit')) {
          setError('You\'ve reached your usage limit. Please try again later or upgrade your plan.');
          toast({
            title: 'Rate Limit Reached',
            description: 'Please wait a moment before trying again.',
            variant: 'destructive'
          });
          return;
        }
        if (apiError.message?.includes('402') || apiError.message?.includes('payment')) {
          setError('This feature requires an active subscription.');
          toast({
            title: 'Subscription Required',
            description: 'Please upgrade to access this feature.',
            variant: 'destructive'
          });
          return;
        }
        throw apiError;
      }
      
      // Map edge function response to CareerProfile
      // The edge function returns: detectedRole, detectedIndustry, yearsExperience, seniorityLevel, 
      // keyAchievements, previousRoles, educationHighlights, careerTrajectory, executiveSummary
      const analysisData = data?.data || data;
      
      const profile: CareerProfile = {
        fullName: '', // User can fill this in
        yearsOfExperience: analysisData?.yearsExperience || analysisData?.yearsOfExperience || 0,
        seniority: mapSeniorityLevel(analysisData?.seniorityLevel || analysisData?.seniority),
        industries: analysisData?.detectedIndustry 
          ? [analysisData.detectedIndustry] 
          : analysisData?.industries || [],
        leadershipRoles: extractLeadershipRoles(analysisData?.previousRoles) || analysisData?.leadershipRoles || [],
        technicalExpertise: analysisData?.technicalExpertise || analysisData?.skills || [],
        softSkills: analysisData?.softSkills || [],
        careerTrajectory: analysisData?.executiveSummary || analysisData?.careerTrajectory || '',
        uniqueValueProposition: generateUVP(analysisData) || analysisData?.uniqueValueProposition || '',
        certifications: analysisData?.certifications || [],
        education: analysisData?.educationHighlights || analysisData?.education || []
      };
      
      setLocalProfile(profile);
      setCareerProfile(profile);
    } catch (err: any) {
      console.error('Career analysis error:', err);
      setError(err.message || 'Could not analyze your career profile');
      toast({
        title: 'Analysis Failed',
        description: err.message || 'Could not analyze your career profile',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setProcessing(false);
    }
  };
  
  // Helper to map seniority level from edge function format
  const mapSeniorityLevel = (level: string): string => {
    const mapping: Record<string, string> = {
      'entry': 'Entry-level',
      'mid': 'Mid-level',
      'senior': 'Senior',
      'executive': 'Executive'
    };
    return mapping[level?.toLowerCase()] || level || 'Mid-level';
  };
  
  // Helper to extract leadership roles from previous roles
  const extractLeadershipRoles = (previousRoles: Array<{ title: string; company: string; years: number }> | undefined): string[] => {
    if (!previousRoles) return [];
    return previousRoles
      .filter(role => 
        role.title?.toLowerCase().includes('lead') ||
        role.title?.toLowerCase().includes('manager') ||
        role.title?.toLowerCase().includes('director') ||
        role.title?.toLowerCase().includes('head') ||
        role.title?.toLowerCase().includes('vp') ||
        role.title?.toLowerCase().includes('chief')
      )
      .map(role => `${role.title} at ${role.company}`);
  };
  
  // Helper to generate UVP from analysis data
  const generateUVP = (data: any): string => {
    if (!data) return '';
    const role = data.detectedRole || '';
    const industry = data.detectedIndustry || '';
    const years = data.yearsExperience || 0;
    const trajectory = data.careerTrajectory || '';
    
    if (role && industry && years) {
      const trajectoryText = trajectory === 'rapid_advancement' ? 'rapidly advancing' : 
                            trajectory === 'specialist' ? 'specialized' : 'experienced';
      return `${trajectoryText} ${role} with ${years}+ years in ${industry}`;
    }
    return data.executiveSummary || '';
  };
  
  const handleConfirm = () => {
    if (localProfile) {
      setCareerProfile(localProfile);
      confirmProfile();
      goToNextStep();
    }
  };
  
  const handleFieldSave = (field: keyof CareerProfile, value: any) => {
    if (localProfile) {
      const updatedProfile = { ...localProfile, [field]: value };
      setLocalProfile(updatedProfile);
    }
    setEditingField(null);
  };
  
  const renderEditableField = (
    label: string,
    field: keyof CareerProfile,
    icon: React.ReactNode,
    isArray = false
  ) => {
    const value = localProfile?.[field];
    const isEditing = editingField === field;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            {icon}
            {label}
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingField(field)}
              className="h-7 text-xs"
            >
              <Pencil className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
        </div>
        
        {isEditing ? (
          <div className="flex gap-2">
            {isArray ? (
              <Input
                defaultValue={(value as string[])?.join(', ')}
                placeholder="Separate items with commas"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleFieldSave(field, (e.target as HTMLInputElement).value.split(',').map(s => s.trim()));
                  }
                }}
              />
            ) : typeof value === 'number' ? (
              <Input
                type="number"
                defaultValue={value}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleFieldSave(field, parseInt((e.target as HTMLInputElement).value));
                  }
                }}
              />
            ) : (
              <Textarea
                defaultValue={value as string}
                className="flex-1 min-h-[80px]"
              />
            )}
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingField(null)}
                className="h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFieldSave(field, value)}
                className="h-7 w-7 p-0 text-green-600"
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {isArray ? (
              <div className="flex flex-wrap gap-1">
                {(value as string[])?.length > 0 ? (
                  (value as string[]).map((item, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {item}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground/50 italic">Not specified</span>
                )}
              </div>
            ) : (
              <p>{(value as string) || <span className="text-muted-foreground/50 italic">Not specified</span>}</p>
            )}
          </div>
        )}
      </div>
    );
  };
  
  if (isLoading || (!localProfile && !error)) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Analyzing your career trajectory...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={analyzeCareer} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Career Profile</CardTitle>
          <CardDescription>
            Review and edit this analysis of your career trajectory. Accuracy here ensures better optimization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Full Name Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Full Name
            </div>
            <Input
              value={localProfile?.fullName || ''}
              onChange={(e) => setLocalProfile(prev => prev ? { ...prev, fullName: e.target.value } : null)}
              placeholder="Enter your full name"
              className="max-w-md"
            />
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-primary">{localProfile?.yearsOfExperience || 0}</div>
              <div className="text-xs text-muted-foreground">Years Experience</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-primary">{localProfile?.seniority || 'N/A'}</div>
              <div className="text-xs text-muted-foreground">Seniority Level</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-primary">{localProfile?.industries?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Industries</div>
            </div>
          </div>
          
          {/* Editable Fields */}
          <div className="grid gap-6">
            {renderEditableField(
              'Industries',
              'industries',
              <Briefcase className="h-4 w-4" />,
              true
            )}
            
            {renderEditableField(
              'Leadership Roles',
              'leadershipRoles',
              <Award className="h-4 w-4" />,
              true
            )}
            
            {renderEditableField(
              'Technical Expertise',
              'technicalExpertise',
              <Target className="h-4 w-4" />,
              true
            )}
            
            {renderEditableField(
              'Career Trajectory',
              'careerTrajectory',
              <Lightbulb className="h-4 w-4" />
            )}
            
            {renderEditableField(
              'Unique Value Proposition',
              'uniqueValueProposition',
              <Lightbulb className="h-4 w-4" />
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={handleConfirm} size="lg" className="gap-2">
          Confirm & Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
