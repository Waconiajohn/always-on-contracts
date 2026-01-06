import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useOptimizerStore } from '@/stores/optimizerStore';
import { ConfidenceIndicator } from '../components/ConfidenceIndicator';
import { AnalyzedRequirement, TonePreference } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Copy, 
  Check, 
  ThumbsUp, 
  ThumbsDown,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TONE_LABELS: Record<TonePreference, string> = {
  formal: 'Formal',
  technical: 'Technical',
  conversational: 'Conversational',
  executive: 'Executive'
};

export function Step3AnswerAssistant() {
  const { toast } = useToast();
  
  // Zustand store
  const gapAnalysis = useOptimizerStore(state => state.gapAnalysis);
  const jobTitle = useOptimizerStore(state => state.jobTitle);
  const company = useOptimizerStore(state => state.company);
  const selectedAnswers = useOptimizerStore(state => state.selectedAnswers);
  const addSelectedAnswer = useOptimizerStore(state => state.addSelectedAnswer);
  const goToNextStep = useOptimizerStore(state => state.goToNextStep);
  const goToPrevStep = useOptimizerStore(state => state.goToPrevStep);
  
  const [selectedRequirement, setSelectedRequirement] = useState<AnalyzedRequirement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [alternatives, setAlternatives] = useState<Partial<Record<TonePreference, string>>>({});
  const [customEdit, setCustomEdit] = useState('');
  const [copiedTone, setCopiedTone] = useState<string | null>(null);
  
  // Combine all requirements for selection
  const allRequirements = [
    ...(gapAnalysis?.highlyQualified || []),
    ...(gapAnalysis?.partiallyQualified || []),
    ...(gapAnalysis?.experienceGaps || [])
  ];
  
  const handleSelectRequirement = async (req: AnalyzedRequirement) => {
    setSelectedRequirement(req);
    setCustomEdit(selectedAnswers[req.id] || req.suggestedLanguage);
    
    // Generate alternatives if we don't have them
    if (!req.alternatives || req.alternatives.length === 0) {
      await generateAlternatives(req);
    } else {
      // Convert existing alternatives to record format
      const alts: Record<TonePreference, string> = {} as any;
      req.alternatives.forEach(alt => {
        alts[alt.tone] = alt.text;
      });
      setAlternatives(alts);
    }
  };
  
  const generateAlternatives = async (req: AnalyzedRequirement) => {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-strategic-language', {
        body: {
          requirement: req.requirement,
          category: req.category,
          explanation: req.explanation,
          currentLanguage: req.suggestedLanguage,
          resumeEvidence: req.resumeEvidence,
          jobContext: {
            title: jobTitle,
            company: company
          }
        }
      });
      
      if (error) throw error;
      
      setAlternatives(data.alternatives || {});
    } catch (error: any) {
      console.error('Generate alternatives error:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Could not generate alternatives',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleCopy = async (text: string, tone: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedTone(tone);
    setTimeout(() => setCopiedTone(null), 2000);
  };
  
  const handleSelectAnswer = (text: string) => {
    if (selectedRequirement) {
      addSelectedAnswer(selectedRequirement.id, text);
      setCustomEdit(text);
      toast({ title: 'Answer saved' });
    }
  };
  
  const handleFeedback = (type: 'helpful' | 'not_helpful') => {
    toast({ 
      title: type === 'helpful' ? 'Thanks for the feedback!' : 'We\'ll improve our suggestions',
      description: 'This helps us generate better recommendations.'
    });
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'highly-qualified': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'partially-qualified': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'experience-gap': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requirements List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Requirements</CardTitle>
              <CardDescription className="text-xs">
                Select any requirement to get AI help
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
              {allRequirements.map((req) => (
                <div
                  key={req.id}
                  onClick={() => handleSelectRequirement(req)}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer transition-all',
                    selectedRequirement?.id === req.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium line-clamp-2">{req.requirement}</p>
                    {selectedAnswers[req.id] && (
                      <Check className="h-4 w-4 text-green-600 shrink-0" />
                    )}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn('mt-2 text-xs', getCategoryColor(req.category))}
                  >
                    {req.category.replace('-', ' ')}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        
        {/* AI Assistant Panel */}
        <div className="lg:col-span-2">
          {selectedRequirement ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{selectedRequirement.requirement}</CardTitle>
                    <CardDescription>{selectedRequirement.explanation}</CardDescription>
                  </div>
                  <ConfidenceIndicator level={selectedRequirement.confidence} />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tone Alternatives */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Alternative Phrasings
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => generateAlternatives(selectedRequirement)}
                      disabled={isGenerating}
                      className="h-7 text-xs"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      Regenerate
                    </Button>
                  </div>
                  
                  {isGenerating ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Tabs defaultValue="formal" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        {(Object.keys(TONE_LABELS) as TonePreference[]).map((tone) => (
                          <TabsTrigger key={tone} value={tone} className="text-xs">
                            {TONE_LABELS[tone]}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {(Object.keys(TONE_LABELS) as TonePreference[]).map((tone) => (
                        <TabsContent key={tone} value={tone} className="mt-3">
                          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                            <p className="text-sm">
                              {alternatives[tone] || selectedRequirement.suggestedLanguage}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopy(alternatives[tone] || selectedRequirement.suggestedLanguage, tone)}
                                className="h-8 text-xs"
                              >
                                {copiedTone === tone ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                                Copy
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleSelectAnswer(alternatives[tone] || selectedRequirement.suggestedLanguage)}
                                className="h-8 text-xs"
                              >
                                Use This
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  )}
                </div>
                
                {/* Custom Edit */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Your Version</h4>
                  <Textarea
                    value={customEdit}
                    onChange={(e) => setCustomEdit(e.target.value)}
                    placeholder="Edit or write your own version..."
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-between mt-2">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeedback('helpful')}
                        className="h-8 text-xs"
                      >
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        Helpful
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeedback('not_helpful')}
                        className="h-8 text-xs"
                      >
                        <ThumbsDown className="h-3 w-3 mr-1" />
                        Not Helpful
                      </Button>
                    </div>
                    <Button
                      onClick={() => handleSelectAnswer(customEdit)}
                      size="sm"
                      className="h-8"
                    >
                      Save This Version
                    </Button>
                  </div>
                </div>
                
                {/* Resume Evidence */}
                {selectedRequirement.resumeEvidence && selectedRequirement.resumeEvidence.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Evidence from Your Resume</h4>
                    <ul className="space-y-2">
                      {selectedRequirement.resumeEvidence.map((evidence, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                          {evidence}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-lg">Select a Requirement</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md mt-2">
                  Click on any requirement from the list to get AI-powered suggestions 
                  with multiple tone variations.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={goToPrevStep} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={goToNextStep} className="gap-2">
          Continue to Customization
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
