import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Target, 
  Sparkles, 
  Plus, 
  RefreshCw,
  TrendingUp,
  Lightbulb,
  Edit3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AIEnhancementPanel } from './AIEnhancementPanel';

interface RoadmapWorkspaceProps {
  roadmapItem: any;
  sectionKey: string;
  vaultId: string;
  currentItems: any[];
  onExit: () => void;
  onItemAdded: () => void;
}

interface SuggestedItem {
  content: string;
  qualityTier: 'gold' | 'silver' | 'bronze';
  reasoning: string;
  keywords: string[];
}

interface EnhancementOpportunity {
  itemId: string;
  currentContent: string;
  suggestedKeywords: string[];
  potentialImprovement: string;
}

export function RoadmapWorkspace({
  roadmapItem,
  sectionKey,
  vaultId,
  currentItems,
  onExit,
  onItemAdded
}: RoadmapWorkspaceProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<SuggestedItem[]>([]);
  const [enhancements, setEnhancements] = useState<EnhancementOpportunity[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [itemsAdded, setItemsAdded] = useState(0);
  const [manualContent, setManualContent] = useState('');
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [enhancingItem, setEnhancingItem] = useState<EnhancementOpportunity | null>(null);

  const targetGap = roadmapItem.target - roadmapItem.current;
  const progressPercentage = (itemsAdded / targetGap) * 100;

  useEffect(() => {
    loadSuggestions();
    loadEnhancements();
  }, [roadmapItem]);

  const loadSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-roadmap-suggestions', {
        body: {
          roadmapItem,
          sectionKey,
          vaultId,
          currentItems
        }
      });

      if (error) throw error;
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      toast({
        title: "Couldn't load suggestions",
        description: "Try refreshing to see AI-powered recommendations",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const loadEnhancements = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('find-enhancement-opportunities', {
        body: {
          roadmapItem,
          sectionKey,
          vaultId,
          currentItems
        }
      });

      if (error) throw error;
      setEnhancements(data.opportunities || []);
    } catch (error) {
      console.error('Error loading enhancements:', error);
    }
  };

  const handleAddSuggestion = async (suggestion: SuggestedItem) => {
    try {
      const tableName = getTableName(sectionKey);
      const contentField = getContentField(sectionKey);
      
      const insertData: any = {
        vault_id: vaultId,
        [contentField]: suggestion.content,
        quality_tier: suggestion.qualityTier,
        confidence_score: 0.85
      };

      const { error } = await supabase
        .from(tableName as any)
        .insert(insertData);

      if (error) throw error;

      setItemsAdded(prev => prev + 1);
      setSuggestions(prev => prev.filter(s => s.content !== suggestion.content));
      onItemAdded();

      toast({
        title: "Added to vault!",
        description: `Progress: ${itemsAdded + 1} of ${targetGap} items added`
      });

      if (itemsAdded + 1 >= targetGap) {
        showCompletionCelebration();
      }
    } catch (error) {
      console.error('Error adding suggestion:', error);
      toast({
        title: "Couldn't add item",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const getItemTypeFromSection = (section: string): string => {
    const map: Record<string, string> = {
      power_phrases: 'power_phrase',
      transferable_skills: 'transferable_skill',
      hidden_competencies: 'hidden_competency',
      soft_skills: 'soft_skill',
      behavioral_indicators: 'behavioral_indicator',
      executive_presence: 'executive_presence',
      leadership_philosophy: 'leadership_philosophy',
      personality_traits: 'personality_trait',
      values_motivations: 'value',
      work_style: 'work_style'
    };
    return map[section] || 'power_phrase';
  };

  const handleManualAdd = async () => {
    if (!manualContent.trim()) return;

    setIsAddingManual(true);
    try {
      const tableName = getTableName(sectionKey);
      const contentField = getContentField(sectionKey);
      
      const insertData: any = {
        vault_id: vaultId,
        [contentField]: manualContent,
        quality_tier: 'silver',
        confidence_score: 0.7
      };

      const { error } = await supabase
        .from(tableName as any)
        .insert(insertData);

      if (error) throw error;

      setItemsAdded(prev => prev + 1);
      setManualContent('');
      onItemAdded();

      toast({
        title: "Added to vault!",
        description: `Progress: ${itemsAdded + 1} of ${targetGap} items added`
      });

      if (itemsAdded + 1 >= targetGap) {
        showCompletionCelebration();
      }
    } catch (error) {
      console.error('Error adding manual item:', error);
      toast({
        title: "Couldn't add item",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsAddingManual(false);
    }
  };

  const showCompletionCelebration = () => {
    toast({
      title: "🎉 Goal Complete!",
      description: `You've reached your target! Ready to tackle the next priority?`,
    });
  };

  const getTableName = (section: string) => {
    const map: Record<string, string> = {
      power_phrases: 'vault_power_phrases',
      transferable_skills: 'vault_transferable_skills',
      hidden_competencies: 'vault_hidden_competencies',
      soft_skills: 'vault_soft_skills',
      leadership_philosophy: 'vault_leadership_philosophy',
      executive_presence: 'vault_executive_presence',
      personality_traits: 'vault_personality_traits',
      work_style: 'vault_work_style',
      values_motivations: 'vault_values_motivations',
      behavioral_indicators: 'vault_behavioral_indicators'
    };
    return map[section] || 'vault_power_phrases';
  };

  const getContentField = (section: string) => {
    const map: Record<string, string> = {
      power_phrases: 'power_phrase',
      transferable_skills: 'stated_skill',
      hidden_competencies: 'inferred_capability',
      soft_skills: 'skill_name',
      leadership_philosophy: 'philosophy_statement',
      executive_presence: 'presence_indicator',
      personality_traits: 'trait_name',
      work_style: 'preference_description',
      values_motivations: 'value_name',
      behavioral_indicators: 'specific_behavior'
    };
    return map[section] || 'power_phrase';
  };

  return (
    <div className="space-y-4">
      {/* Active Goal Card - Pinned */}
      <Card className="border-2 border-primary bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg mb-1">{roadmapItem.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{roadmapItem.description}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{roadmapItem.priority}</Badge>
                  <Badge variant="outline">{roadmapItem.estimatedTime}</Badge>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onExit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress to goal</span>
              <span className="font-medium">{itemsAdded} of {targetGap} items added</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              <strong>Goal:</strong> {roadmapItem.goal}
            </p>
          </div>
        </CardContent>
      </Card>

      <ScrollArea className="h-[calc(100vh-24rem)]">
        <div className="space-y-4 pr-4">
          {/* AI-Powered Suggestions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">AI-Powered Suggestions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSuggestions ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                  Generating suggestions...
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">No suggestions available</p>
                  <Button size="sm" variant="outline" onClick={loadSuggestions}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Suggestions
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((suggestion, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-2">
                      <p className="text-sm font-medium">{suggestion.content}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          suggestion.qualityTier === 'gold' ? 'default' : 
                          suggestion.qualityTier === 'silver' ? 'secondary' : 
                          'outline'
                        }>
                          {suggestion.qualityTier}
                        </Badge>
                        {suggestion.keywords.map((kw, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{suggestion.reasoning}</p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleAddSuggestion(suggestion)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add to Vault
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit3 className="h-3 w-3 mr-1" />
                          Edit & Add
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="w-full"
                    onClick={loadSuggestions}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Get More Suggestions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhancement Opportunities */}
          {enhancements.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Enhancement Opportunities</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {enhancements.length} existing items could benefit from these keywords
                </p>
                <div className="space-y-3">
                  {enhancements.map((opportunity, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-2">
                      <p className="text-sm">{opportunity.currentContent}</p>
                      <div className="flex flex-wrap gap-1">
                        {opportunity.suggestedKeywords.map((kw, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            + {kw}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {opportunity.potentialImprovement}
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEnhancingItem(opportunity)}
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Enhance with AI
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Creative Question Prompts */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Guided Prompts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {roadmapItem.suggestedActions?.map((action: string, idx: number) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => {
                      setManualContent('');
                      // Scroll to manual form
                      document.getElementById('manual-add-form')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <span className="text-sm">{action}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Manual Quick-Add Form */}
          <Card id="manual-add-form">
            <CardHeader>
              <CardTitle className="text-base">Add Your Own</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder={`Add your own content related to "${roadmapItem.title}"...`}
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                rows={3}
              />
              <Button 
                className="w-full" 
                onClick={handleManualAdd}
                disabled={!manualContent.trim() || isAddingManual}
              >
                {isAddingManual ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Vault
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {enhancingItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <AIEnhancementPanel
              item={currentItems.find(i => i.id === enhancingItem.itemId) || { id: enhancingItem.itemId }}
              itemType={getItemTypeFromSection(sectionKey)}
              vaultId={vaultId}
              onClose={() => setEnhancingItem(null)}
              onEnhanced={() => {
                setEnhancingItem(null);
                setEnhancements(prev => prev.filter(e => e.itemId !== enhancingItem.itemId));
                onItemAdded();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
