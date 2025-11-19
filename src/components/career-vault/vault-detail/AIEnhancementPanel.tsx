import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2, Check, ArrowRight, X, Pencil } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const { toast } = useToast();

  const getCurrentContent = () => {
    return item.power_phrase || item.phrase || item.stated_skill || item.skill || 
           item.competency_area || item.inferred_capability || '';
  };

  const handleEnhance = async () => {
    setIsEnhancing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('enhance-vault-item', {
        body: {
          itemId: item.id,
          itemType,
          currentContent: getCurrentContent(),
          currentTier: item.quality_tier,
          vaultId
        }
      });

      if (error) throw error;

      if (data?.success) {
        setEnhancement(data.enhancement);
        setEditedContent(data.enhancement.enhanced_content);
        setIsEditing(false);
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
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAddKeyword = async (keyword: string) => {
    if (!enhancement) return;
    
    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-vault-item', {
        body: {
          itemId: item.id,
          itemType,
          currentContent: editedContent,
          currentTier: enhancement.new_tier,
          vaultId,
          additionalKeywords: [keyword]
        }
      });

      if (error) throw error;

      if (data?.success) {
        setEnhancement(data.enhancement);
        setEditedContent(data.enhancement.enhanced_content);
        toast({
          title: 'Keyword Added',
          description: `Enhanced with "${keyword}"`
        });
      }
    } catch (error) {
      console.error('Error adding keyword:', error);
      toast({
        title: 'Error',
        description: 'Failed to add keyword',
        variant: 'destructive'
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAccept = async () => {
    if (!enhancement) return;

    setIsEnhancing(true);
    try {
      const tableName = getTableName();
      const contentField = getContentField();

      const { error } = await supabase
        .from(tableName)
        .update({
          [contentField]: editedContent,
          quality_tier: enhancement.new_tier,
          confidence_score: 0.95,
          enhancement_notes: enhancement.reasoning,
          last_updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: 'Enhanced!',
        description: `Upgraded to ${enhancement.new_tier} tier`
      });

      onEnhanced();
    } catch (error) {
      console.error('Error applying enhancement:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply enhancement',
        variant: 'destructive'
      });
    } finally {
      setIsEnhancing(false);
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
    <Card className="border-purple-500/50 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            AI Enhancement
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!enhancement ? (
          <>
            <Alert>
              <AlertDescription className="text-sm">
                AI will analyze your item and suggest improvements to upgrade it to a higher quality tier.
                This includes adding strategic context, quantified metrics, and stronger language.
              </AlertDescription>
            </Alert>
            <Button
              onClick={handleEnhance}
              disabled={isEnhancing}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Enhancement
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current</span>
                <Badge variant="outline">{item.quality_tier}</Badge>
              </div>
              <div className="p-3 bg-muted rounded-lg text-sm">
                {getCurrentContent()}
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Enhanced</span>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-500">{enhancement.new_tier}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="h-6 px-2"
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    {isEditing ? 'Done' : 'Edit'}
                  </Button>
                </div>
              </div>
              {isEditing ? (
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[120px] text-sm"
                  placeholder="Edit the enhancement..."
                />
              ) : (
                <div className="p-3 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-lg text-sm border border-yellow-500/20">
                  {editedContent}
                </div>
              )}
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                <strong>Why this is better:</strong> {enhancement.reasoning}
              </AlertDescription>
            </Alert>

            {enhancement.suggested_keywords && enhancement.suggested_keywords.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Add Keywords:</span>
                <p className="text-xs text-muted-foreground">Click to incorporate a keyword - AI will regenerate the enhancement</p>
                <div className="flex flex-wrap gap-1">
                  {enhancement.suggested_keywords.map((keyword: string, idx: number) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="text-xs cursor-pointer hover:bg-purple-500 hover:text-white transition-colors"
                      onClick={() => handleAddKeyword(keyword)}
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                onClick={handleAccept}
                disabled={isEnhancing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isEnhancing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Accept Enhancement
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setEnhancement(null)}>
                Try Again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
