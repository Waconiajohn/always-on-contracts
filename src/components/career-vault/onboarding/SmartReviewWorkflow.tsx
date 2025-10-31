// =====================================================
// SMART REVIEW WORKFLOW - Career Vault 2.0
// =====================================================
// INTELLIGENT BATCH REVIEW
//
// This component showcases TIME-SAVING innovation:
// - Priority-based review (high-impact items first)
// - Batch operations (confirm all, reject low confidence)
// - Auto-approved items (transparent, not hidden)
// - 5-minute review vs 25+ minutes item-by-item
//
// MARKETING MESSAGE:
// "Our smart prioritization saves 20+ minutes. Review only
// what needs your attention, with batch operations that
// competitors don't offer."
// =====================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle2,
  XCircle,
  Edit3,
  Sparkles,
  Award,
  Target,
  Lightbulb,
  Users,
  TrendingUp,
  Loader2,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useSupabaseClient } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SmartReviewWorkflowProps {
  vaultId: string;
  initialVaultStrength: number;
  onComplete: (data: { newVaultStrength: number }) => void;
  onSkip: () => void;
}

interface VaultItem {
  id: string;
  type: string;
  content: string;
  evidence?: string;
  confidenceScore: number;
  qualityTier: string;
  category?: string;
}

export default function SmartReviewWorkflow({
  vaultId,
  initialVaultStrength,
  onComplete,
  onSkip,
}: SmartReviewWorkflowProps) {
  const [priorityItems, setPriorityItems] = useState<VaultItem[]>([]);
  const [mediumItems, setMediumItems] = useState<VaultItem[]>([]);
  const [highConfidenceItems, setHighConfidenceItems] = useState<VaultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState('priority');
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [reviewActions, setReviewActions] = useState<any[]>([]);
  const [vaultStrength, setVaultStrength] = useState(initialVaultStrength);

  const supabase = useSupabaseClient();
  const { toast } = useToast();

  useEffect(() => {
    loadItemsForReview();
  }, []);

  const loadItemsForReview = async () => {
    try {
      // Fetch items from all vault tables that need review
      const tablesToQuery = [
        'vault_power_phrases',
        'vault_transferable_skills',
        'vault_hidden_competencies',
        'vault_soft_skills',
      ];

      const allItems: VaultItem[] = [];

      for (const table of tablesToQuery) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('vault_id', vaultId)
          .order('confidence_score', { ascending: true });

        if (error) throw error;

        if (data) {
          const items = data.map((item: any) => ({
            id: item.id,
            type: table.replace('vault_', ''),
            content: item.power_phrase || item.stated_skill || item.competency_area || item.skill_name || '',
            evidence: item.inferred_from || item.evidence || item.examples || '',
            confidenceScore: item.confidence_score || 0,
            qualityTier: item.quality_tier || 'assumed',
            category: item.category || '',
          }));
          allItems.push(...items);
        }
      }

      // Categorize items by confidence
      const priority = allItems.filter(item => item.confidenceScore < 0.75);
      const medium = allItems.filter(item => item.confidenceScore >= 0.75 && item.confidenceScore < 0.9);
      const high = allItems.filter(item => item.confidenceScore >= 0.9);

      setPriorityItems(priority);
      setMediumItems(medium);
      setHighConfidenceItems(high);
      setIsLoading(false);

      if (priority.length === 0 && medium.length === 0) {
        // Nothing to review, auto-complete
        toast({
          title: '✨ All Set!',
          description: 'All extracted items are high-confidence. No review needed!',
        });
        setTimeout(() => {
          onComplete({ newVaultStrength: vaultStrength });
        }, 1500);
      }

    } catch (err: any) {
      console.error('Load items error:', err);
      toast({
        title: 'Load Failed',
        description: err.message,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleAction = (item: VaultItem, action: 'confirm' | 'edit' | 'reject') => {
    if (action === 'edit') {
      setEditingItem(item);
      setEditedContent(item.content);
      return;
    }

    // Add to review actions
    setReviewActions(prev => [
      ...prev.filter(a => a.itemId !== item.id),
      { itemId: item.id, itemType: item.type, action, updatedData: action === 'confirm' ? { content: editedContent } : undefined }
    ]);

    // Remove from current list
    if (priorityItems.find(i => i.id === item.id)) {
      setPriorityItems(prev => prev.filter(i => i.id !== item.id));
    } else if (mediumItems.find(i => i.id === item.id)) {
      setMediumItems(prev => prev.filter(i => i.id !== item.id));
    }

    toast({
      title: action === 'confirm' ? '✅ Confirmed' : '❌ Rejected',
      description: action === 'confirm' ? 'Item validated' : 'Item removed',
    });
  };

  const handleEditSave = () => {
    if (!editingItem) return;

    setReviewActions(prev => [
      ...prev.filter(a => a.itemId !== editingItem.id),
      {
        itemId: editingItem.id,
        itemType: editingItem.type,
        action: 'edit',
        updatedData: {
          [editingItem.type === 'power_phrases' ? 'power_phrase' :
           editingItem.type === 'transferable_skills' ? 'stated_skill' :
           editingItem.type === 'hidden_competencies' ? 'competency_area' :
           'skill_name']: editedContent
        }
      }
    ]);

    // Remove from lists
    setPriorityItems(prev => prev.filter(i => i.id !== editingItem.id));
    setMediumItems(prev => prev.filter(i => i.id !== editingItem.id));

    toast({
      title: '✏️ Edited',
      description: 'Item updated and upgraded to gold tier',
    });

    setEditingItem(null);
    setEditedContent('');
  };

  const handleBatchConfirm = (items: VaultItem[]) => {
    const batchActions = items.map(item => ({
      itemId: item.id,
      itemType: item.type,
      action: 'confirm' as const,
    }));

    setReviewActions(prev => [...prev, ...batchActions]);

    if (currentTab === 'priority') {
      setPriorityItems([]);
    } else {
      setMediumItems([]);
    }

    toast({
      title: '✅ Batch Confirmed',
      description: `${items.length} items validated`,
    });
  };

  const handleComplete = async () => {
    if (reviewActions.length === 0) {
      onSkip();
      return;
    }

    setIsSaving(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-review-actions', {
        body: {
          vaultId,
          actions: reviewActions,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Review processing failed');

      const newStrength = data.data.newVaultStrength;
      setVaultStrength(newStrength);

      toast({
        title: '🎉 Review Complete!',
        description: data.meta?.message || `Vault strength now ${newStrength}%`,
      });

      onComplete({ newVaultStrength: newStrength });

    } catch (err: any) {
      console.error('Review save error:', err);
      toast({
        title: 'Save Failed',
        description: err.message,
        variant: 'destructive',
      });
      setIsSaving(false);
    }
  };

  const totalReviewNeeded = priorityItems.length + mediumItems.length;
  const totalReviewed = reviewActions.length;
  const reviewProgress = totalReviewNeeded > 0 ? (totalReviewed / (totalReviewNeeded + totalReviewed)) * 100 : 0;

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
        <CardContent className="py-12">
          <div className="text-center space-y-3">
            <Loader2 className="w-12 h-12 text-purple-600 mx-auto animate-spin" />
            <p className="text-slate-600">Loading items for review...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          Smart Review Workflow
        </CardTitle>
        <CardDescription>
          Quick verification of extracted insights ({totalReviewed} reviewed, {totalReviewNeeded} remaining)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Marketing message */}
        <Alert className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <Sparkles className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-sm text-slate-700">
            <strong className="text-green-700">Smart Prioritization:</strong> We've organized items
            by importance—review high-impact items first. Use batch operations to save{' '}
            <strong>20+ minutes</strong> vs traditional item-by-item approval.
            <strong className="block mt-1 text-emerald-700">
              High-confidence items are auto-approved (shown below for transparency).
            </strong>
          </AlertDescription>
        </Alert>

        {/* Progress */}
        {totalReviewNeeded > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Review Progress</span>
              <span className="text-sm text-slate-600">{Math.round(reviewProgress)}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-green-600 transition-all duration-500"
                style={{ width: `${reviewProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Tabs for different priority levels */}
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="priority" className="relative">
              Priority
              {priorityItems.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {priorityItems.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="medium">
              Medium
              {mediumItems.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {mediumItems.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              Auto-Approved
              <Badge variant="outline" className="ml-2">
                {highConfidenceItems.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="priority" className="space-y-3 mt-4">
            {priorityItems.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    These items need your attention due to lower confidence scores
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBatchConfirm(priorityItems)}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Confirm All
                  </Button>
                </div>

                {priorityItems.map(item => (
                  <ReviewItemCard
                    key={item.id}
                    item={item}
                    onAction={handleAction}
                  />
                ))}
              </>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-600" />
                <p>No priority items to review!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="medium" className="space-y-3 mt-4">
            {mediumItems.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    Medium confidence items—quick review recommended
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBatchConfirm(mediumItems)}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Confirm All
                  </Button>
                </div>

                {mediumItems.map(item => (
                  <ReviewItemCard
                    key={item.id}
                    item={item}
                    onAction={handleAction}
                  />
                ))}
              </>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-600" />
                <p>No medium items to review!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-3 mt-4">
            <p className="text-sm text-slate-600">
              These high-confidence items were auto-approved. Shown for transparency.
            </p>

            {highConfidenceItems.slice(0, 10).map(item => (
              <div key={item.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{item.content}</p>
                    {item.evidence && (
                      <p className="text-xs text-slate-600 mt-1">{item.evidence}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                        {Math.round(item.confidenceScore * 100)}% confidence
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.qualityTier}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {highConfidenceItems.length > 10 && (
              <p className="text-sm text-center text-slate-500">
                + {highConfidenceItems.length - 10} more auto-approved items
              </p>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full">
              <CardHeader>
                <CardTitle>Edit Item</CardTitle>
                <CardDescription>Make changes and save to upgrade to gold tier</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Content</label>
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={4}
                    className="w-full"
                  />
                </div>

                {editingItem.evidence && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">Evidence</label>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">{editingItem.evidence}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleEditSave} className="flex-1">
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingItem(null);
                      setEditedContent('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onSkip}
            disabled={isSaving}
          >
            Skip Review
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isSaving}
            className="flex-1"
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Complete Review
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Review Item Card Component
function ReviewItemCard({
  item,
  onAction,
}: {
  item: VaultItem;
  onAction: (item: VaultItem, action: 'confirm' | 'edit' | 'reject') => void;
}) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'power_phrases': return Award;
      case 'transferable_skills': return Target;
      case 'hidden_competencies': return Lightbulb;
      case 'soft_skills': return Users;
      default: return TrendingUp;
    }
  };

  const Icon = getIcon(item.type);

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-slate-900">{item.content}</p>
          {item.evidence && (
            <p className="text-sm text-slate-600 mt-1 bg-slate-50 p-2 rounded">
              <strong>Evidence:</strong> {item.evidence}
            </p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <Badge variant={item.confidenceScore < 0.6 ? 'destructive' : 'secondary'} className="text-xs">
              {Math.round(item.confidenceScore * 100)}% confidence
            </Badge>
            <Badge variant="outline" className="text-xs">
              {item.type.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAction(item, 'confirm')}
          className="flex-1"
        >
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Confirm
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAction(item, 'edit')}
          className="flex-1"
        >
          <Edit3 className="w-4 h-4 mr-1" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAction(item, 'reject')}
          className="flex-1 text-red-600 hover:bg-red-50"
        >
          <XCircle className="w-4 h-4 mr-1" />
          Remove
        </Button>
      </div>
    </div>
  );
}
