import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2, Check, ArrowRight, X, Pencil, Brain, Layers, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from "@/components/ui/progress";

interface AIEnhancementPanelProps {
  item: any;
  itemType: string;
  vaultId: string;
  onClose: () => void;
  onEnhanced: () => void;
}

export function AIEnhancementPanel({
  item,
  itemType,
  vaultId,
  onClose,
  onEnhanced
}: AIEnhancementPanelProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancement, setEnhancement] = useState<any>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [isRegeneratingWithKeywords, setIsRegeneratingWithKeywords] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState("");
  const { toast } = useToast();

  const getCurrentContent = () => {
    if (!item) return '';
    return item.power_phrase || item.phrase || item.stated_skill || item.skill || 
           item.competency_area || item.inferred_capability || '';
  };

  // Simulated progress for better UX
  useEffect(() => {
    if (isEnhancing && analysisProgress < 90) {
      const steps = [
        "Analyzing context...",
        "Identifying strategic impact...",
        "Quantifying metrics...",
        "Optimizing for executive presence...",
        "Finalizing enhancement..."
      ];
      const interval = setInterval(() => {
        setAnalysisProgress(prev => {
          const next = prev + 15;
          const stepIndex = Math.min(Math.floor(next / 20), steps.length - 1);
          setAnalysisStep(steps[stepIndex]);
          return next > 90 ? 90 : next;
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isEnhancing]);

  const handleEnhance = async () => {
    setIsEnhancing(true);
    setAnalysisProgress(0);
    
    try {
      const { data, error } = await supabase.functions.invoke('enhance-vault-item', {
        body: {
          itemId: item.id,
          itemType,
          currentContent: getCurrentContent(),
          currentTier: item.quality_tier,
          vaultId,
          itemSubtype: item.item_subtype || 'expertise' // Pass subtype for skills vs expertise
        }
      });

      if (error) throw error;

      if (data?.success) {
        setAnalysisProgress(100);
        setAnalysisStep("Complete!");
        setTimeout(() => {
             setEnhancement(data.enhancement);
             setEditedContent(data.enhancement.enhanced_content);
             setIsEditing(false);
             setIsEnhancing(false);
        }, 500);
      } else {
        throw new Error('Enhancement failed');
      }
    } catch (error) {
      console.error('Error enhancing:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate enhancement',
        variant: 'destructive'
      });
      setIsEnhancing(false);
    }
  };

  const toggleKeywordSelection = (keyword: string) => {
    setSelectedKeywords(prev => 
      prev.includes(keyword) 
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  const handleRegenerateWithKeywords = async () => {
    if (selectedKeywords.length === 0) {
      toast({
        title: 'No keywords selected',
        description: 'Please select at least one keyword to regenerate',
        variant: 'destructive'
      });
      return;
    }

    setIsRegeneratingWithKeywords(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-vault-item', {
        body: {
          itemId: item.id,
          itemType,
          currentContent: editedContent,
          currentTier: enhancement.new_tier,
          vaultId,
          additionalKeywords: selectedKeywords,
          itemSubtype: item.item_subtype || 'expertise'
        }
      });

      if (error) throw error;

      if (data?.success) {
        setEnhancement(data.enhancement);
        setEditedContent(data.enhancement.enhanced_content);
        setSelectedKeywords([]);
        toast({
          title: 'Content regenerated!',
          description: `Enhanced with ${selectedKeywords.length} keyword${selectedKeywords.length > 1 ? 's' : ''}`
        });
      }
    } catch (error) {
      console.error('Error regenerating with keywords:', error);
      toast({
        title: 'Error',
        description: 'Failed to regenerate content',
        variant: 'destructive'
      });
    } finally {
      setIsRegeneratingWithKeywords(false);
    }
  };

  const handleAccept = async () => {
    if (!enhancement || !item) return;

    // Note: This update preserves existing foreign keys (source_milestone_id)
    // because it's an UPDATE operation on the existing row.
    // The migration added these columns, so if they were populated during extraction, they stay.

    try {
      const tableName = getTableName();
      const contentField = getContentField();

      const { error } = await supabase
        .from(tableName)
        .update({
          [contentField]: editedContent,
          quality_tier: enhancement.new_tier,
          confidence_score: 95,
          enhancement_notes: enhancement.reasoning,
          last_updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: 'Enhanced!',
        description: `Upgraded to ${enhancement.new_tier} tier`
      });
      
      // Close panel and trigger refresh
      onEnhanced();
    } catch (error) {
      console.error('Error applying enhancement:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply enhancement',
        variant: 'destructive'
      });
    }
  };

  const getTableName = () => {
    switch (itemType) {
      case 'power_phrase': return 'vault_power_phrases';
      case 'transferable_skill': return 'vault_transferable_skills';
      case 'hidden_competency': return 'vault_hidden_competencies';
      default: return 'vault_power_phrases';
    }
  };

  const getContentField = () => {
    switch (itemType) {
      case 'power_phrase': return 'power_phrase';
      case 'transferable_skill': return 'stated_skill';
      case 'hidden_competency': return 'competency_area';
      default: return 'power_phrase';
    }
  };

  return (
    <Card className="border-purple-500/50 bg-gradient-to-br from-purple-500/5 to-blue-500/5 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Enhancement Studio
            </CardTitle>
            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] px-1.5">
              Gemini 3.0 Pro
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEnhancing ? (
             <div className="space-y-4 py-8">
                 <div className="flex justify-between text-sm text-muted-foreground mb-1">
                     <span>{analysisStep}</span>
                     <span>{analysisProgress}%</span>
                 </div>
                 <Progress value={analysisProgress} className="h-2 bg-purple-100" />
                 <p className="text-xs text-center text-muted-foreground mt-4">
                     Leveraging advanced reasoning to maximize impact...
                 </p>
             </div>
        ) : !enhancement ? (
          <>
            <Alert className="bg-background/50 border-purple-200">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <AlertDescription className="text-sm text-muted-foreground">
                Transform this item using <strong>Gemini 3.0 Pro</strong>. 
                The AI will analyze strategic context, apply industry metrics, and optimize for executive presence.
              </AlertDescription>
            </Alert>
            <Button
              onClick={handleEnhance}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md transition-all hover:scale-[1.02]"
            >
              <Zap className="h-4 w-4 mr-2 fill-current" />
              Generate Executive Enhancement
            </Button>
          </>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Comparison View */}
            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Original</span>
                    <Badge variant="outline" className="text-xs">{item.quality_tier}</Badge>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground italic">
                    "{getCurrentContent()}"
                  </div>
                </div>

                <div className="flex justify-center -my-2 z-10">
                  <div className="bg-background rounded-full p-1 border shadow-sm">
                    <ArrowRight className="h-4 w-4 text-purple-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-purple-700 uppercase tracking-wider">Enhanced Version</span>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-500 hover:bg-yellow-600 shadow-sm">Gold Tier</Badge>
                        {!isEditing && (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsEditing(true)}>
                                <Pencil className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                  </div>
                  
                  {isEditing ? (
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="min-h-[120px] text-sm border-purple-200 focus:ring-purple-500"
                    />
                  ) : (
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg text-sm border border-purple-200 shadow-sm ring-1 ring-purple-500/10">
                      {editedContent}
                    </div>
                  )}
                </div>
            </div>

            {/* Reasoning & Analysis */}
            <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Layers className="h-3 w-3" /> AI Reasoning Logic
                </h4>
                <div className="bg-purple-50/50 dark:bg-purple-900/10 rounded-lg p-3 space-y-2 border border-purple-100 dark:border-purple-800">
                    <p className="text-sm text-purple-900 dark:text-purple-100 font-medium">
                        {enhancement.reasoning}
                    </p>
                    {enhancement.analysis_steps && (
                        <ul className="space-y-1 mt-2">
                            {enhancement.analysis_steps.map((step: string, i: number) => (
                                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                    <Check className="h-3 w-3 text-green-500 mt-0.5" />
                                    {step}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Keyword Optimization */}
            {enhancement.suggested_keywords && enhancement.suggested_keywords.length > 0 && (
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Strategic Keywords</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {enhancement.suggested_keywords.map((keyword: string, idx: number) => {
                    const isSelected = selectedKeywords.includes(keyword);
                    return (
                      <Badge 
                        key={idx} 
                        variant={isSelected ? "default" : "outline"}
                        className={`text-xs cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-purple-600 hover:bg-purple-700' 
                            : 'hover:border-purple-400 hover:text-purple-600'
                        }`}
                        onClick={() => toggleKeywordSelection(keyword)}
                      >
                        {isSelected && <Check className="h-3 w-3 mr-1" />}
                        {keyword}
                      </Badge>
                    );
                  })}
                </div>
                {selectedKeywords.length > 0 && (
                  <Button
                    onClick={handleRegenerateWithKeywords}
                    disabled={isRegeneratingWithKeywords}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    {isRegeneratingWithKeywords ? (
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3 mr-2" />
                    )}
                    Inject {selectedKeywords.length} Keywords
                  </Button>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => setEnhancement(null)} className="flex-1">
                Discard
              </Button>
              <Button
                onClick={handleAccept}
                className="flex-[2] bg-green-600 hover:bg-green-700 shadow-md"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve & Save to Vault
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
