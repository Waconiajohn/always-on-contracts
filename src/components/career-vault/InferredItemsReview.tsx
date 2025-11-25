import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Edit, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InferredItem {
  id: string;
  category: string;
  content: string;
  inferredFrom: string;
  confidence: number;
  qualityTier: string;
  examples?: string;
  evidence?: string;
  capability?: string;
  style?: string;
}

export const InferredItemsReview = () => {
  const [itemsNeedingReview, setItemsNeedingReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadItemsNeedingReview();
  }, []);

  const loadItemsNeedingReview = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
    const { data, error } = await supabase.rpc('get_items_needing_review' as any, {
      p_user_id: user.id
    });

      if (error) throw error;

      setItemsNeedingReview(data);
    } catch (error) {
      console.error('Error loading items for review:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAllItems = (): InferredItem[] => {
    if (!itemsNeedingReview) return [];

    const items: InferredItem[] = [];

    // Combine all categories
    ['powerPhrases', 'softSkills', 'transferableSkills', 'hiddenCompetencies', 'leadership'].forEach(category => {
      if (itemsNeedingReview[category]) {
        items.push(...itemsNeedingReview[category]);
      }
    });

    return items;
  };

  const handleReview = async (action: 'confirmed' | 'edited' | 'rejected') => {
    const allItems = getAllItems();
    const currentItem = allItems[currentItemIndex];

    if (!currentItem) return;

    try {
      const { error } = await supabase.rpc('process_inference_review' as any, {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_vault_category: currentItem.category,
        p_item_id: currentItem.id,
        p_action: action,
        p_edited_content: isEditing ? { content: editedContent } : null
      });

      if (error) throw error;

      // Show success message
      if (action === 'confirmed') {
        toast({
          title: 'Item Confirmed',
          description: 'Upgraded to Silver tier',
        });
      } else if (action === 'edited') {
        toast({
          title: 'Item Updated',
          description: 'Upgraded to Gold tier with your edits',
        });
      } else {
        toast({
          title: 'Item Removed',
          description: 'Deleted from your vault',
        });
      }

      // Move to next item or close modal
      if (currentItemIndex < allItems.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1);
        setIsEditing(false);
        setEditedContent('');
      } else {
        setShowReviewModal(false);
        setCurrentItemIndex(0);
      }

      // Reload items
      loadItemsNeedingReview();

    } catch (error) {
      console.error('Error processing review:', error);
      toast({
        title: 'Error',
        description: 'Failed to process review. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    // Handle both integer (0-100) and decimal (0-1) confidence scores
    const score = confidence > 1 ? confidence : confidence * 100;
    const rounded = Math.min(100, Math.round(score));
    
    if (rounded >= 80) {
      return <Badge className="bg-green-500">High Confidence ({rounded}%)</Badge>;
    } else if (rounded >= 60) {
      return <Badge className="bg-yellow-500">Medium Confidence ({rounded}%)</Badge>;
    } else {
      return <Badge className="bg-red-500">Low Confidence ({rounded}%)</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'power_phrases': 'Power Phrase',
      'soft_skills': 'Soft Skill',
      'transferable_skills': 'Transferable Skill',
      'hidden_competencies': 'Hidden Competency',
      'leadership': 'Leadership Philosophy'
    };
    return labels[category] || category;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!itemsNeedingReview || itemsNeedingReview.totalCount === 0) {
    return null;
  }

  const allItems = getAllItems();
  const currentItem = allItems[currentItemIndex];

  return (
    <>
      {/* Alert Banner */}
      <Alert className="mb-6 bg-yellow-50 border-yellow-200">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <AlertDescription className="ml-2 flex items-center justify-between">
          <div>
            <strong>{itemsNeedingReview.totalCount} items</strong> need your review.
            AI inferred these from your resume - please confirm or edit them.
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReviewModal(true)}
          >
            Review Now
          </Button>
        </AlertDescription>
      </Alert>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Review AI Inference ({currentItemIndex + 1} of {allItems.length})
            </DialogTitle>
            <DialogDescription>
              AI guessed this from your resume. Confirm if accurate, edit if needed, or remove if incorrect.
            </DialogDescription>
          </DialogHeader>

          {currentItem && (
            <div className="space-y-4">
              {/* Category and Confidence */}
              <div className="flex gap-2">
                <Badge variant="outline">{getCategoryLabel(currentItem.category)}</Badge>
                {currentItem.confidence && getConfidenceBadge(currentItem.confidence)}
                <Badge className="bg-gray-500">{currentItem.qualityTier || 'Assumed'}</Badge>
              </div>

              {/* Inferred Content */}
              <Card className="bg-yellow-50">
                <CardHeader>
                  <CardTitle className="text-sm">AI Inferred:</CardTitle>
                </CardHeader>
                <CardContent>
                  {!isEditing ? (
                    <div>
                      <p className="font-medium">{currentItem.content}</p>
                      {currentItem.examples && (
                        <p className="text-sm text-muted-foreground mt-2">Examples: {currentItem.examples}</p>
                      )}
                      {currentItem.evidence && (
                        <p className="text-sm text-muted-foreground mt-2">Evidence: {currentItem.evidence}</p>
                      )}
                      {currentItem.capability && (
                        <p className="text-sm text-muted-foreground mt-2">Capability: {currentItem.capability}</p>
                      )}
                      {currentItem.style && (
                        <p className="text-sm text-muted-foreground mt-2">Style: {currentItem.style}</p>
                      )}
                    </div>
                  ) : (
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={4}
                      placeholder="Edit the content..."
                    />
                  )}
                </CardContent>
              </Card>

              {/* Evidence */}
              <Card className="bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-sm">AI's Evidence:</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{currentItem.inferredFrom || 'Resume analysis'}</p>
                </CardContent>
              </Card>

              {/* Quality Tier Info */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="ml-2 text-sm">
                  {!isEditing ? (
                    <>
                      <strong>Confirm:</strong> Upgrades to Silver tier (verified by you)
                      <br />
                      <strong>Edit:</strong> Upgrades to Gold tier (enhanced by you)
                      <br />
                      <strong>Remove:</strong> Deletes from vault (incorrect inference)
                    </>
                  ) : (
                    <>
                      Make your edits above, then click <strong>Save Edits</strong> to upgrade to Gold tier.
                    </>
                  )}
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsEditing(true);
                        setEditedContent(currentItem.content);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => handleReview('confirmed')}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Confirm (→ Silver)
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => handleReview('rejected')}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedContent('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      onClick={() => handleReview('edited')}
                      disabled={!editedContent.trim()}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Save Edits (→ Gold)
                    </Button>
                  </>
                )}
              </div>

              {/* Progress */}
              <div className="text-center text-sm text-muted-foreground">
                {currentItemIndex + 1} of {allItems.length} items reviewed
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
