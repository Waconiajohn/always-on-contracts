import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Zap, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ModernizeLanguageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaultId: string;
  onSuccess: () => void;
}

interface PowerPhrase {
  id: string;
  power_phrase: string;
  context: string;
  keywords: string[];
}

interface ModernizationSuggestion {
  original: string;
  modernized: string;
  addedKeywords: string[];
  reasoning: string;
}

const MODERN_KEYWORDS = [
  'AI', 'ML', 'machine learning', 'artificial intelligence',
  'cloud', 'AWS', 'Azure', 'GCP',
  'automation', 'DevOps', 'CI/CD',
  'data analytics', 'big data', 'data-driven',
  'agile', 'scrum', 'digital transformation',
  'SaaS', 'API', 'microservices',
  'blockchain', 'IoT', 'edge computing',
  'cybersecurity', 'zero trust',
  'remote-first', 'hybrid work', 'distributed teams'
];

export const ModernizeLanguageModal = ({ open, onOpenChange, vaultId, onSuccess }: ModernizeLanguageModalProps) => {
  const [phrases, setPhrases] = useState<PowerPhrase[]>([]);
  const [selectedPhrase, setSelectedPhrase] = useState<PowerPhrase | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingSuggestion, setGeneratingSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState<ModernizationSuggestion | null>(null);
  const [editedPhrase, setEditedPhrase] = useState('');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadPhrasesNeedingModernization();
    }
  }, [open, vaultId]);

  const loadPhrasesNeedingModernization = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vault_power_phrases')
        .select('*')
        .eq('vault_id', vaultId)
        .order('confidence_score', { ascending: false });

      if (error) throw error;

      // Filter phrases without modern keywords
      const phrasesNeedingModernization = (data || []).filter(p => {
        const keywords = p.keywords || [];
        return !keywords.some(k =>
          MODERN_KEYWORDS.some(mk => k.toLowerCase().includes(mk.toLowerCase()))
        );
      });

      setPhrases(phrasesNeedingModernization);
      if (phrasesNeedingModernization.length > 0) {
        setSelectedPhrase(phrasesNeedingModernization[0]);
        setEditedPhrase(phrasesNeedingModernization[0].power_phrase);
      }
    } catch (error) {
      console.error('Error loading phrases:', error);
      toast({
        title: 'Error',
        description: 'Failed to load power phrases',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateModernizationSuggestion = async () => {
    if (!selectedPhrase) return;

    setGeneratingSuggestion(true);
    try {
      const { data, error } = await supabase.functions.invoke('modernize-language', {
        body: {
          phrase: selectedPhrase.power_phrase,
          context: selectedPhrase.context
        }
      });

      if (error) throw error;

      if (data?.suggestion) {
        setSuggestion(data.suggestion);
        setEditedPhrase(data.suggestion.modernized);
        setSelectedKeywords(data.suggestion.addedKeywords);
      }
    } catch (error) {
      console.error('Error generating suggestion:', error);
      toast({
        title: 'Suggestion Generation Failed',
        description: 'Try manually adding modern keywords below',
        variant: 'default'
      });
    } finally {
      setGeneratingSuggestion(false);
    }
  };

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  const handleSave = async () => {
    if (!selectedPhrase) return;

    setLoading(true);
    try {
      // Update phrase and keywords
      const updatedKeywords = [
        ...(selectedPhrase.keywords || []),
        ...selectedKeywords
      ];

      const { error } = await supabase
        .from('vault_power_phrases')
        .update({
          power_phrase: editedPhrase,
          keywords: updatedKeywords
        })
        .eq('id', selectedPhrase.id);

      if (error) throw error;

      toast({
        title: 'Language Modernized!',
        description: 'Your modern terminology score will improve on next analysis'
      });

      // Move to next phrase or close
      const currentIndex = phrases.findIndex(p => p.id === selectedPhrase.id);
      if (currentIndex < phrases.length - 1) {
        setSelectedPhrase(phrases[currentIndex + 1]);
        setEditedPhrase(phrases[currentIndex + 1].power_phrase);
        setSelectedKeywords([]);
        setSuggestion(null);
      } else {
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error saving modernized phrase:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    const currentIndex = phrases.findIndex(p => p.id === selectedPhrase?.id);
    if (currentIndex < phrases.length - 1) {
      setSelectedPhrase(phrases[currentIndex + 1]);
      setEditedPhrase(phrases[currentIndex + 1].power_phrase);
      setSelectedKeywords([]);
      setSuggestion(null);
    } else {
      onSuccess();
      onOpenChange(false);
    }
  };

  if (loading && phrases.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading phrases...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (phrases.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>All Phrases Are Modern!</DialogTitle>
            <DialogDescription>
              Excellent! All your power phrases use current terminology.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <Zap className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Your modern terminology score should be looking good. Try re-analyzing to see the latest score.
            </p>
          </div>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Modernize Language & Add Tech Keywords
          </DialogTitle>
          <DialogDescription>
            Update phrases with current industry terminology. Showing {phrases.findIndex(p => p.id === selectedPhrase?.id) + 1} of {phrases.length} phrases.
          </DialogDescription>
        </DialogHeader>

        {selectedPhrase && (
          <div className="space-y-6">
            {/* Current Phrase */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">ORIGINAL PHRASE</Label>
                  <p className="text-base">{selectedPhrase.power_phrase}</p>
                  {selectedPhrase.context && (
                    <p className="text-sm text-muted-foreground">{selectedPhrase.context}</p>
                  )}
                  {selectedPhrase.keywords && selectedPhrase.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedPhrase.keywords.map((kw, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{kw}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Suggestion */}
            {!suggestion && !generatingSuggestion && (
              <div className="text-center">
                <Button
                  onClick={generateModernizationSuggestion}
                  variant="outline"
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Get AI Modernization Suggestion
                </Button>
              </div>
            )}

            {generatingSuggestion && (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Analyzing phrase for modernization opportunities...</p>
              </div>
            )}

            {suggestion && (
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6 space-y-3">
                  <Label className="text-xs font-semibold text-blue-900 dark:text-blue-100">AI SUGGESTION</Label>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{suggestion.modernized}</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestion.addedKeywords.map((kw, idx) => (
                      <Badge key={idx} variant="default" className="text-xs bg-blue-600">
                        +{kw}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-blue-800 dark:text-blue-200 italic">{suggestion.reasoning}</p>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      setEditedPhrase(suggestion.modernized);
                      setSelectedKeywords(suggestion.addedKeywords);
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Apply This Suggestion
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Edit Phrase */}
            <div className="space-y-2">
              <Label htmlFor="editedPhrase">Edit Phrase (or use AI suggestion above)</Label>
              <Textarea
                id="editedPhrase"
                value={editedPhrase}
                onChange={(e) => setEditedPhrase(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Add Modern Keywords */}
            <div className="space-y-3">
              <Label>Add Modern Keywords (select all that apply)</Label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {MODERN_KEYWORDS.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant={selectedKeywords.includes(keyword) ? "default" : "outline"}
                    className="cursor-pointer justify-center py-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => toggleKeyword(keyword)}
                  >
                    {selectedKeywords.includes(keyword) && <Check className="h-3 w-3 mr-1" />}
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Preview */}
            {(editedPhrase !== selectedPhrase.power_phrase || selectedKeywords.length > 0) && (
              <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <Label className="text-xs font-semibold text-green-900 dark:text-green-100">UPDATED PHRASE</Label>
                  <p className="text-sm mt-2 font-medium text-green-900 dark:text-green-100">{editedPhrase}</p>
                  {selectedKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      <span className="text-xs text-green-800 dark:text-green-200 mr-2">Keywords:</span>
                      {selectedKeywords.map((kw, idx) => (
                        <Badge key={idx} variant="default" className="text-xs bg-green-600">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleSkip}>
                Skip This Phrase
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading || (editedPhrase === selectedPhrase.power_phrase && selectedKeywords.length === 0)}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save & Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
