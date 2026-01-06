import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useOptimizer } from '../context/OptimizerContext';
import { IntensityLevel, TonePreference } from '../types';
import { ArrowRight, ArrowLeft, Shield, Zap, Flame, MessageSquare, Code, User, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const { state, dispatch, goToNextStep, goToPrevStep } = useOptimizer();
  
  const handleIntensityChange = (value: IntensityLevel) => {
    dispatch({
      type: 'SET_CUSTOMIZATION',
      settings: { ...state.customization, intensity: value }
    });
  };
  
  const handleToneChange = (value: TonePreference) => {
    dispatch({
      type: 'SET_CUSTOMIZATION',
      settings: { ...state.customization, tone: value }
    });
  };
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
            value={state.customization.intensity}
            onValueChange={(v) => handleIntensityChange(v as IntensityLevel)}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {INTENSITY_OPTIONS.map((option) => (
              <Label
                key={option.value}
                htmlFor={option.value}
                className={cn(
                  'flex flex-col items-center gap-3 p-6 rounded-lg border-2 cursor-pointer transition-all',
                  state.customization.intensity === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/50'
                )}
              >
                <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                <div className={cn(
                  'p-3 rounded-full',
                  state.customization.intensity === option.value
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
            value={state.customization.tone}
            onValueChange={(v) => handleToneChange(v as TonePreference)}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {TONE_OPTIONS.map((option) => (
              <Label
                key={option.value}
                htmlFor={`tone-${option.value}`}
                className={cn(
                  'flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                  state.customization.tone === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/50'
                )}
              >
                <RadioGroupItem value={option.value} id={`tone-${option.value}`} className="sr-only" />
                <div className={cn(
                  'p-2 rounded-full',
                  state.customization.tone === option.value
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
      
      {/* Preview hint */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <p className="text-sm text-center text-muted-foreground">
            Your resume will be generated with <strong>{state.customization.intensity}</strong> optimization 
            and a <strong>{state.customization.tone}</strong> tone.
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
          Generate Strategic Versions
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
