import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useOptimizerStore } from '@/stores/optimizerStore';
import { IntensityLevel, TonePreference } from '../types';
import { ArrowRight, ArrowLeft, Shield, Zap, Flame, MessageSquare, Code, User, Crown, ChevronDown, UserCheck, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const INTENSITY_OPTIONS: { value: IntensityLevel; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'conservative',
    label: 'Conservative',
    description: 'Minimal changes, preserves original voice',
    icon: <Shield className="h-5 w-5" />
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: 'Balanced optimization with clear improvements',
    icon: <Zap className="h-5 w-5" />
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    description: 'Maximum impact, significant rewrites',
    icon: <Flame className="h-5 w-5" />
  }
];

const TONE_OPTIONS: { value: TonePreference; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'formal',
    label: 'Formal',
    description: 'Professional, traditional business language',
    icon: <User className="h-5 w-5" />
  },
  {
    value: 'conversational',
    label: 'Conversational',
    description: 'Approachable, personable tone',
    icon: <MessageSquare className="h-5 w-5" />
  },
  {
    value: 'technical',
    label: 'Technical',
    description: 'Precise, industry-specific terminology',
    icon: <Code className="h-5 w-5" />
  },
  {
    value: 'executive',
    label: 'Executive',
    description: 'Strategic, leadership-focused language',
    icon: <Crown className="h-5 w-5" />
  }
];

export function Step4Customization() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Zustand store
  const customization = useOptimizerStore(state => state.customization);
  const setCustomization = useOptimizerStore(state => state.setCustomization);
  const executive50PlusPrefs = useOptimizerStore(state => state.executive50PlusPrefs);
  const setExecutive50PlusPrefs = useOptimizerStore(state => state.setExecutive50PlusPrefs);
  const resumeMode = useOptimizerStore(state => state.resumeMode);
  const setResumeMode = useOptimizerStore(state => state.setResumeMode);
  const goToNextStep = useOptimizerStore(state => state.goToNextStep);
  const goToPrevStep = useOptimizerStore(state => state.goToPrevStep);
  
  const handleIntensityChange = (value: IntensityLevel) => {
    setCustomization({ ...customization, intensity: value });
  };
  
  const handleToneChange = (value: TonePreference) => {
    setCustomization({ ...customization, tone: value });
  };
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Resume Mode Selection */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Resume Mode
          </CardTitle>
          <CardDescription>
            Choose how the AI generates your resume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setResumeMode('interview-safe')}
              className={cn(
                'flex flex-col items-start gap-2 p-4 rounded-lg border-2 text-left transition-all',
                resumeMode === 'interview-safe'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                  : 'border-muted hover:border-muted-foreground/50'
              )}
            >
              <div className="flex items-center gap-2">
                <UserCheck className={cn(
                  'h-5 w-5',
                  resumeMode === 'interview-safe' ? 'text-emerald-600' : 'text-muted-foreground'
                )} />
                <span className="font-semibold">Interview-Safe</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Only verified claims backed by evidence. Every statement is defensible in an interview.
              </p>
              <span className="text-xs text-emerald-600 font-medium">Recommended</span>
            </button>
            
            <button
              onClick={() => setResumeMode('brainstorm')}
              className={cn(
                'flex flex-col items-start gap-2 p-4 rounded-lg border-2 text-left transition-all',
                resumeMode === 'brainstorm'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                  : 'border-muted hover:border-muted-foreground/50'
              )}
            >
              <div className="flex items-center gap-2">
                <Sparkles className={cn(
                  'h-5 w-5',
                  resumeMode === 'brainstorm' ? 'text-amber-600' : 'text-muted-foreground'
                )} />
                <span className="font-semibold">Brainstorm</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Includes suggestions and inferences. Great for ideation but needs review.
              </p>
              <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Review before using
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Intensity Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Intensity</CardTitle>
          <CardDescription>
            How aggressively should we optimize your resume?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={customization.intensity}
            onValueChange={(v) => handleIntensityChange(v as IntensityLevel)}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {INTENSITY_OPTIONS.map((option) => (
              <Label
                key={option.value}
                htmlFor={option.value}
                className={cn(
                  'flex flex-col items-center gap-3 p-6 rounded-lg border-2 cursor-pointer transition-all',
                  customization.intensity === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/50'
                )}
              >
                <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                <div className={cn(
                  'p-3 rounded-full',
                  customization.intensity === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}>
                  {option.icon}
                </div>
                <div className="text-center">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{option.description}</div>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
      
      {/* Tone Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Tone</CardTitle>
          <CardDescription>
            What voice should your resume have?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={customization.tone}
            onValueChange={(v) => handleToneChange(v as TonePreference)}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {TONE_OPTIONS.map((option) => (
              <Label
                key={option.value}
                htmlFor={`tone-${option.value}`}
                className={cn(
                  'flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                  customization.tone === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/50'
                )}
              >
                <RadioGroupItem value={option.value} id={`tone-${option.value}`} className="sr-only" />
                <div className={cn(
                  'p-2 rounded-full',
                  customization.tone === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}>
                  {option.icon}
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{option.description}</div>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Executive 50+ Settings (Advanced) */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Executive 50+ Formatting</CardTitle>
                  <CardDescription className="text-xs">
                    Age-friendly formatting options for senior professionals
                  </CardDescription>
                </div>
                <ChevronDown className={cn(
                  'h-5 w-5 transition-transform',
                  showAdvanced && 'rotate-180'
                )} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6 pt-0">
              {/* Hide Graduation Years */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Hide Graduation Years</Label>
                  <p className="text-xs text-muted-foreground">
                    Remove graduation dates from education section
                  </p>
                </div>
                <Switch
                  checked={executive50PlusPrefs.hideGraduationYears}
                  onCheckedChange={(checked) => 
                    setExecutive50PlusPrefs({ ...executive50PlusPrefs, hideGraduationYears: checked })
                  }
                />
              </div>

              {/* Experience Condensation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Condense Experience After</Label>
                    <p className="text-xs text-muted-foreground">
                      {executive50PlusPrefs.experienceCondensationYears} years - older roles become "Additional Experience"
                    </p>
                  </div>
                  <span className="text-sm font-medium">{executive50PlusPrefs.experienceCondensationYears} years</span>
                </div>
                <Slider
                  value={[executive50PlusPrefs.experienceCondensationYears]}
                  onValueChange={([value]) => 
                    setExecutive50PlusPrefs({ ...executive50PlusPrefs, experienceCondensationYears: value })
                  }
                  min={10}
                  max={25}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Include Additional Experience */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Include Additional Experience Section</Label>
                  <p className="text-xs text-muted-foreground">
                    Show condensed older roles in a separate section
                  </p>
                </div>
                <Switch
                  checked={executive50PlusPrefs.includeAdditionalExperience}
                  onCheckedChange={(checked) => 
                    setExecutive50PlusPrefs({ ...executive50PlusPrefs, includeAdditionalExperience: checked })
                  }
                />
              </div>

              {/* Signature Wins Position */}
              <div className="space-y-2">
                <Label>Signature Wins Position</Label>
                <RadioGroup
                  value={executive50PlusPrefs.signatureWinsPosition}
                  onValueChange={(v) => 
                    setExecutive50PlusPrefs({ ...executive50PlusPrefs, signatureWinsPosition: v as 'top' | 'inline' })
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="top" id="wins-top" />
                    <Label htmlFor="wins-top" className="text-sm font-normal cursor-pointer">
                      Top of resume (recommended)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="inline" id="wins-inline" />
                    <Label htmlFor="wins-inline" className="text-sm font-normal cursor-pointer">
                      Inline with experience
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      
      {/* Preview hint */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <p className="text-sm text-center text-muted-foreground">
            Your resume will be generated in <strong>{resumeMode === 'interview-safe' ? 'Interview-Safe' : 'Brainstorm'}</strong> mode 
            with <strong>{customization.intensity}</strong> optimization 
            and a <strong>{customization.tone}</strong> tone.
          </p>
        </CardContent>
      </Card>
      
      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={goToPrevStep} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={goToNextStep} className="gap-2">
          Generate Benchmark Resume
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
