import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOptimizerStore } from '@/stores/optimizerStore';
import { ProofCollectorField } from '../types';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  SkipForward, 
  Users, 
  Target, 
  TrendingUp, 
  Building2, 
  Wrench, 
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  Scope: { icon: Users, label: 'Scope & Scale', color: 'bg-blue-500/10 text-blue-700 border-blue-200' },
  Leadership: { icon: Building2, label: 'Leadership & Ownership', color: 'bg-purple-500/10 text-purple-700 border-purple-200' },
  Outcomes: { icon: TrendingUp, label: 'Outcomes & Impact', color: 'bg-green-500/10 text-green-700 border-green-200' },
  Stakeholders: { icon: Users, label: 'Stakeholders', color: 'bg-orange-500/10 text-orange-700 border-orange-200' },
  Tools: { icon: Wrench, label: 'Tools & Systems', color: 'bg-slate-500/10 text-slate-700 border-slate-200' },
  Timeline: { icon: Clock, label: 'Timeline', color: 'bg-cyan-500/10 text-cyan-700 border-cyan-200' },
};

export function Step3ProofCollector() {
  const fitBlueprint = useOptimizerStore(state => state.fitBlueprint);
  const confirmedFacts = useOptimizerStore(state => state.confirmedFacts);
  const setConfirmedFact = useOptimizerStore(state => state.setConfirmedFact);
  const goToNextStep = useOptimizerStore(state => state.goToNextStep);
  const goToPrevStep = useOptimizerStore(state => state.goToPrevStep);
  
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Get proof collector fields from fit blueprint
  const proofCollectorFields = fitBlueprint?.proofCollectorFields || [];
  
  // Also extract validation questions from inference map
  const inferenceQuestions = useMemo(() => {
    if (!fitBlueprint?.inferenceMap) return [];
    
    return fitBlueprint.inferenceMap.flatMap(im => 
      (im.validationQuestions || []).map(vq => ({
        fieldKey: vq.fieldKey,
        label: vq.question,
        description: `Example: ${vq.exampleAnswer || 'Provide specific details'}`,
        fieldType: vq.fieldType || 'text',
        category: 'Outcomes' as const,
        priority: 'high' as const,
        examples: vq.exampleAnswer ? [vq.exampleAnswer] : [],
        requirementId: im.requirementId
      }))
    );
  }, [fitBlueprint?.inferenceMap]);

  // Combine and dedupe fields
  const allFields = useMemo(() => {
    const fieldMap = new Map<string, ProofCollectorField>();
    
    // Add proof collector fields first
    proofCollectorFields.forEach(f => {
      fieldMap.set(f.fieldKey, f);
    });
    
    // Add inference questions (don't overwrite existing)
    inferenceQuestions.forEach(f => {
      if (!fieldMap.has(f.fieldKey)) {
        fieldMap.set(f.fieldKey, f as ProofCollectorField);
      }
    });
    
    return Array.from(fieldMap.values());
  }, [proofCollectorFields, inferenceQuestions]);

  // Group fields by category
  const fieldsByCategory = useMemo(() => {
    const grouped: Record<string, ProofCollectorField[]> = {};
    
    allFields.forEach(field => {
      const category = field.category || 'Outcomes';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(field);
    });
    
    // Sort by priority within each category
    Object.keys(grouped).forEach(cat => {
      grouped[cat].sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
      });
    });
    
    return grouped;
  }, [allFields]);

  const categories = Object.keys(fieldsByCategory);
  
  // Calculate completion stats
  const completedCount = allFields.filter(f => 
    confirmedFacts[f.fieldKey] !== undefined && confirmedFacts[f.fieldKey] !== ''
  ).length;
  const highPriorityFields = allFields.filter(f => f.priority === 'high');
  const highPriorityCompleted = highPriorityFields.filter(f => 
    confirmedFacts[f.fieldKey] !== undefined && confirmedFacts[f.fieldKey] !== ''
  ).length;
  
  const progress = allFields.length > 0 ? (completedCount / allFields.length) * 100 : 0;

  // Get confirmable bullets for impact preview
  const confirmableBullets = useMemo(() => {
    if (!fitBlueprint?.bulletBankInferredPlaceholders) return [];
    
    return fitBlueprint.bulletBankInferredPlaceholders.map(placeholder => {
      const requiredFields = placeholder.requiredFields || [];
      const filledFields = requiredFields.filter(f => 
        confirmedFacts[f] !== undefined && confirmedFacts[f] !== ''
      );
      const canConfirm = requiredFields.length > 0 && filledFields.length === requiredFields.length;
      
      return {
        bullet: placeholder.bullet,
        requiredFields,
        filledFields,
        canConfirm,
        progress: requiredFields.length > 0 
          ? (filledFields.length / requiredFields.length) * 100 
          : 0
      };
    });
  }, [fitBlueprint?.bulletBankInferredPlaceholders, confirmedFacts]);

  const confirmedBullets = confirmableBullets.filter(b => b.canConfirm);

  const handleFieldChange = (fieldKey: string, value: string | number | string[]) => {
    setConfirmedFact(fieldKey, value);
  };

  const renderField = (field: ProofCollectorField) => {
    const value = confirmedFacts[field.fieldKey] || '';
    const isCompleted = value !== undefined && value !== '';
    
    return (
      <div key={field.fieldKey} className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Label htmlFor={field.fieldKey} className="text-sm font-medium">
            {field.label}
            {field.priority === 'high' && (
              <Badge variant="outline" className="ml-2 text-xs bg-amber-50 text-amber-700 border-amber-200">
                High Impact
              </Badge>
            )}
          </Label>
          {isCompleted && (
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          )}
        </div>
        
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
        
        {field.fieldType === 'text' && (
          <Textarea
            id={field.fieldKey}
            value={value as string}
            onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
            placeholder={field.examples?.join(', ') || 'Enter details...'}
            className="min-h-[80px] text-sm"
          />
        )}
        
        {field.fieldType === 'number' && (
          <Input
            id={field.fieldKey}
            type="number"
            value={value as string}
            onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
            placeholder={field.examples?.[0] || 'Enter number'}
            className="max-w-[200px]"
          />
        )}
        
        {field.fieldType === 'range' && (
          <div className="flex items-center gap-2">
            <Input
              id={field.fieldKey}
              value={value as string}
              onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
              placeholder="e.g., 10-15 or ~50"
              className="max-w-[200px]"
            />
            <span className="text-xs text-muted-foreground">Use ~ for approximate</span>
          </div>
        )}
        
        {field.fieldType === 'select' && field.options && (
          <Select
            value={value as string}
            onValueChange={(v) => handleFieldChange(field.fieldKey, v)}
          >
            <SelectTrigger className="max-w-[300px]">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {field.examples && field.examples.length > 0 && field.fieldType !== 'select' && (
          <div className="flex flex-wrap gap-1 mt-1">
            {field.examples.slice(0, 3).map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleFieldChange(field.fieldKey, ex)}
                className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // If no fields to collect, skip this step
  if (allFields.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Check className="h-12 w-12 text-emerald-600 mb-4" />
            <h3 className="font-medium text-lg">Your Profile is Complete!</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mt-2">
              We have all the information needed to create your benchmark resume.
            </p>
            <Button onClick={goToNextStep} className="mt-6 gap-2">
              Continue to Customization
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredFields = activeCategory === 'all' 
    ? allFields 
    : fieldsByCategory[activeCategory] || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Executive Proof Collector
              </CardTitle>
              <CardDescription className="mt-1">
                Quick questions to unlock your strongest resume bullets (2-5 minutes)
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{completedCount}/{allFields.length}</div>
              <div className="text-xs text-muted-foreground">fields completed</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {highPriorityCompleted}/{highPriorityFields.length} high-impact fields
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
                  <TabsTrigger value="all" className="text-xs">
                    All ({allFields.length})
                  </TabsTrigger>
                  {categories.map(cat => {
                    const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.Outcomes;
                    const Icon = config.icon;
                    const count = fieldsByCategory[cat]?.length || 0;
                    const completed = fieldsByCategory[cat]?.filter(f => 
                      confirmedFacts[f.fieldKey] !== undefined && confirmedFacts[f.fieldKey] !== ''
                    ).length || 0;
                    
                    return (
                      <TabsTrigger 
                        key={cat} 
                        value={cat}
                        className="text-xs gap-1"
                      >
                        <Icon className="h-3 w-3" />
                        {config.label} ({completed}/{count})
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                
                <div className="space-y-6">
                  {filteredFields.map(field => renderField(field))}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Impact Preview Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Impact Preview
              </CardTitle>
              <CardDescription className="text-xs">
                Bullets unlocked as you fill fields
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {confirmedBullets.length > 0 ? (
                confirmedBullets.slice(0, 5).map((b, i) => (
                  <div key={i} className="p-2 rounded bg-emerald-50 border border-emerald-200">
                    <div className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-emerald-600 mt-1 shrink-0" />
                      <p className="text-xs text-emerald-900">{b.bullet.substring(0, 120)}...</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Fill in fields to unlock verified resume bullets
                  </p>
                </div>
              )}
              
              {confirmableBullets.filter(b => !b.canConfirm && b.progress > 0).slice(0, 3).map((b, i) => (
                <div key={`partial-${i}`} className="p-2 rounded bg-amber-50 border border-amber-200">
                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 mt-1 shrink-0">
                      <Progress value={b.progress} className="h-1.5" />
                    </div>
                    <div>
                      <p className="text-xs text-amber-900">{b.bullet.substring(0, 80)}...</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Needs: {b.requiredFields.filter(f => !b.filledFields.includes(f)).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>• Use ranges (~10-15) for sensitive numbers</p>
              <p>• "Unknown" is fine - we'll work around it</p>
              <p>• High-impact fields unlock the best bullets</p>
              <p>• You can always edit later</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={goToPrevStep} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Fit Blueprint
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={goToNextStep} className="gap-2">
            <SkipForward className="h-4 w-4" />
            Skip for Now
          </Button>
          <Button onClick={goToNextStep} className="gap-2">
            Continue to Customization
            <ArrowRight className="h-4 w-4" />
            {confirmedBullets.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {confirmedBullets.length} bullets ready
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
