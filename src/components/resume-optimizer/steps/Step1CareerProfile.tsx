import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useOptimizer } from '../context/OptimizerContext';
import { CareerProfile } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Pencil, Check, X, ArrowRight, Briefcase, Award, Target, Lightbulb } from 'lucide-react';

export function Step1CareerProfile() {
  const { state, dispatch, goToNextStep } = useOptimizer();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [editingField, setEditingField] = useState<keyof CareerProfile | null>(null);
  const [localProfile, setLocalProfile] = useState<CareerProfile | null>(state.careerProfile);
  
  // Fetch career analysis on mount if we don't have one
  useEffect(() => {
    if (!state.careerProfile && state.resumeText) {
      analyzeCareer();
    }
  }, [state.resumeText]);
  
  const analyzeCareer = async () => {
    if (!state.resumeText) return;
    
    setIsLoading(true);
    dispatch({ type: 'SET_PROCESSING', isProcessing: true, message: 'Analyzing your career trajectory...' });
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-resume-initial', {
        body: { resumeText: state.resumeText }
      });
      
      if (error) throw error;
      
      const profile: CareerProfile = {
        yearsOfExperience: data?.yearsOfExperience || 0,
        seniority: data?.seniority || 'Mid-level',
        industries: data?.industries || [],
        leadershipRoles: data?.leadershipRoles || [],
        technicalExpertise: data?.technicalExpertise || data?.skills || [],
        softSkills: data?.softSkills || [],
        careerTrajectory: data?.careerTrajectory || data?.narrative || '',
        uniqueValueProposition: data?.uniqueValueProposition || data?.uvp || '',
        certifications: data?.certifications || [],
        education: data?.education || []
      };
      
      setLocalProfile(profile);
      dispatch({ type: 'SET_CAREER_PROFILE', profile });
    } catch (error: any) {
      console.error('Career analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Could not analyze your career profile',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      dispatch({ type: 'SET_PROCESSING', isProcessing: false });
    }
  };
  
  const handleConfirm = () => {
    if (localProfile) {
      dispatch({ type: 'SET_CAREER_PROFILE', profile: localProfile });
      dispatch({ type: 'CONFIRM_PROFILE' });
      goToNextStep();
    }
  };
  
  const handleFieldSave = (field: keyof CareerProfile, value: any) => {
    if (localProfile) {
      setLocalProfile({ ...localProfile, [field]: value });
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
                {(value as string[])?.map((item, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            ) : (
              <p>{value as string}</p>
            )}
          </div>
        )}
      </div>
    );
  };
  
  if (isLoading || !localProfile) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Analyzing your career trajectory...</p>
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
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-primary">{localProfile.yearsOfExperience}</div>
              <div className="text-xs text-muted-foreground">Years Experience</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-primary">{localProfile.seniority}</div>
              <div className="text-xs text-muted-foreground">Seniority Level</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-2xl font-bold text-primary">{localProfile.industries.length}</div>
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
