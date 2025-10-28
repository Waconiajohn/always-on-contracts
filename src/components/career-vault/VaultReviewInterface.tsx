import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

import {
  CheckCircle2,
  XCircle,
  Edit3,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { transformExtractedDataToItems } from '@/lib/utils/vaultDataTransformer';

interface VaultItem {
  id?: string;
  category: string;
  content: string;
  subContent?: string;
  metadata?: any;
  confidence?: number;
  status: 'pending' | 'approved' | 'edited' | 'rejected';
}

interface VaultReviewInterfaceProps {
  vaultId: string;
  extractedData: any;
  onComplete: () => void;
}

/**
 * VAULT REVIEW INTERFACE
 *
 * Modern swipe-to-review interface for validating AI-extracted career intelligence.
 * User reviews each item in 5-10 minutes instead of answering 50+ questions.
 *
 * Features:
 * - Quick approve/reject with swipe gestures (or buttons)
 * - Inline editing for corrections
 * - Progress tracking
 * - Category grouping for organization
 */
export const VaultReviewInterface = ({
  vaultId,
  extractedData,
  onComplete
}: VaultReviewInterfaceProps) => {
  const { toast } = useToast();
  const [items, setItems] = useState<VaultItem[]>(() => {
    console.log('[VAULT_REVIEW] Transforming extracted data:', extractedData);
    const transformedItems = transformExtractedDataToItems(extractedData);
    console.log('[VAULT_REVIEW] Transformed items:', transformedItems);
    
    // Log any items with missing content for debugging
    const missingContent = transformedItems.filter(item => !item.content);
    if (missingContent.length > 0) {
      console.warn('[VAULT_REVIEW] Items with missing content:', missingContent);
    }
    
    return transformedItems;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedSubContent, setEditedSubContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const currentItem = items[currentIndex];
  const progress = (items.filter(i => i.status !== 'pending').length / items.length) * 100;
  const approvedCount = items.filter(i => i.status === 'approved' || i.status === 'edited').length;
  const rejectedCount = items.filter(i => i.status === 'rejected').length;

  const handleApprove = () => {
    updateItemStatus('approved');
    moveToNext();
  };

  const handleReject = () => {
    updateItemStatus('rejected');
    moveToNext();
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(currentItem.content);
    setEditedSubContent(currentItem.subContent || '');
  };

  const handleSaveEdit = () => {
    const updatedItems = [...items];
    updatedItems[currentIndex] = {
      ...currentItem,
      content: editedContent,
      subContent: editedSubContent,
      status: 'edited'
    };
    setItems(updatedItems);
    setIsEditing(false);
    moveToNext();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent('');
    setEditedSubContent('');
  };

  const updateItemStatus = (status: 'approved' | 'rejected') => {
    const updatedItems = [...items];
    updatedItems[currentIndex] = { ...currentItem, status };
    setItems(updatedItems);
  };

  const moveToNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // All items reviewed!
      handleComplete();
    }
  };

  const moveToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);

    try {
      const approvedItems = items.filter(i => i.status === 'approved' || i.status === 'edited');
      const rejectedItems = items.filter(i => i.status === 'rejected');

      toast({
        title: 'Cleaning Up Your Vault...',
        description: `Removing ${rejectedItems.length} rejected items`,
      });

      // DELETE REJECTED ITEMS FROM DATABASE
      // Items are already saved from auto-populate, now we delete what user rejected
      if (rejectedItems.length > 0) {
        console.log('[VAULT_REVIEW] Deleting rejected items:', rejectedItems);
        
        // Group by category for efficient batch deletion
        const itemsByCategory = rejectedItems.reduce((acc, item) => {
          if (!acc[item.category]) acc[item.category] = [];
          acc[item.category].push(item);
          return acc;
        }, {} as Record<string, VaultItem[]>);

        // Delete from each table
        const categoryTableMap: Record<string, string> = {
          'Power Phrase': 'vault_power_phrases',
          'Transferable Skill': 'vault_transferable_skills',
          'Hidden Competency': 'vault_hidden_competencies',
          'Soft Skill': 'vault_soft_skills',
          'Leadership Philosophy': 'vault_leadership_philosophy',
          'Executive Presence': 'vault_executive_presence',
          'Personality Trait': 'vault_personality_traits',
          'Work Style': 'vault_work_style',
          'Core Value': 'vault_values',
          'Behavioral Pattern': 'vault_behavioral_indicators'
        };

        for (const [category, categoryItems] of Object.entries(itemsByCategory)) {
          const tableName = categoryTableMap[category];
          if (!tableName) continue;

          // Delete items by matching content (since we don't have IDs from the review interface)
          // This is safe because we're matching on vault_id + content
          for (const item of categoryItems) {
            try {
              // Different tables have different primary content fields
              const contentField = tableName === 'vault_power_phrases' ? 'phrase' :
                                 tableName === 'vault_transferable_skills' ? 'skill' :
                                 tableName === 'vault_hidden_competencies' ? 'competency' :
                                 tableName === 'vault_soft_skills' ? 'skill_name' :
                                 'content'; // generic fallback

              const { error: deleteError } = await supabase
                .from(tableName as any)
                .delete()
                .eq('vault_id', vaultId)
                .ilike(contentField, item.content);

              if (deleteError) {
                console.error(`[VAULT_REVIEW] Error deleting from ${tableName}:`, deleteError);
              }
            } catch (err) {
              console.error(`[VAULT_REVIEW] Exception deleting item:`, err);
            }
          }
        }
      }

      // Update vault completion and review status
      const completionPercentage = Math.round((approvedItems.length / items.length) * 100);

      const { error: updateError } = await supabase
        .from('career_vault')
        .update({
          interview_completion_percentage: Math.max(85, completionPercentage),
          reviewed: true,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', vaultId);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: 'Vault Cleaned Up!',
        description: `Kept ${approvedItems.length} items, removed ${rejectedItems.length} items`,
      });

      onComplete();
    } catch (error) {
      console.error('[VAULT_REVIEW] Error saving vault review:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your review. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const categoryColors: Record<string, string> = {
    'Power Phrase': 'bg-purple-500/10 text-purple-700 border-purple-300',
    'Transferable Skill': 'bg-blue-500/10 text-blue-700 border-blue-300',
    'Hidden Competency': 'bg-amber-500/10 text-amber-700 border-amber-300',
    'Soft Skill': 'bg-green-500/10 text-green-700 border-green-300',
    'Leadership Philosophy': 'bg-indigo-500/10 text-indigo-700 border-indigo-300',
    'Executive Presence': 'bg-rose-500/10 text-rose-700 border-rose-300',
    'Personality Trait': 'bg-pink-500/10 text-pink-700 border-pink-300',
    'Work Style': 'bg-cyan-500/10 text-cyan-700 border-cyan-300',
    'Core Value': 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
    'Behavioral Pattern': 'bg-violet-500/10 text-violet-700 border-violet-300'
  };

  if (!currentItem) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="py-12 text-center">
          <Sparkles className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">All Items Reviewed!</h2>
          <p className="text-muted-foreground mb-6">
            Ready to finalize your Career Vault?
          </p>
          <Button onClick={handleComplete} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Complete Vault Setup'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <CardTitle>Review & Clean Up Your Vault</CardTitle>
            <Badge variant="secondary">
              {currentIndex + 1} of {items.length}
            </Badge>
          </div>
          <CardDescription className="space-y-2">
            <p>AI has already populated your vault with {items.length} intelligence items extracted from your resume. These are <strong>facts about you</strong>, not predictions.</p>
            <p className="text-xs">Review each item: <strong>Approve</strong> accurate items, <strong>Edit</strong> for corrections, or <strong>Skip</strong> to remove incorrect ones from your vault.</p>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} className="h-2" />
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              {approvedCount} approved
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="h-4 w-4 text-red-600" />
              {rejectedCount} skipped
            </span>
            <span className="ml-auto text-primary font-medium">
              {Math.round(progress)}% complete
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Review Card */}
      <Card className="relative overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge className={categoryColors[currentItem.category] || ''}>
              {currentItem.category}
            </Badge>
            {currentItem.confidence && (
              <Badge variant="outline">
                {currentItem.confidence}% confidence
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isEditing ? (
            // View Mode
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {currentItem.content || '[No content - data extraction issue]'}
                </h3>
                {currentItem.subContent && (
                  <p className="text-muted-foreground">{currentItem.subContent}</p>
                )}
                {!currentItem.content && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                    <p className="font-medium text-amber-900 mb-2">⚠️ Missing Content</p>
                    <p className="text-amber-800">This item has no content to display. This usually means the data extraction didn't map correctly. You can safely skip this item.</p>
                    <details className="mt-2 text-xs text-amber-700">
                      <summary className="cursor-pointer">Debug Info</summary>
                      <pre className="mt-2 p-2 bg-amber-100 rounded overflow-auto">
                        {JSON.stringify(currentItem.metadata, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 hover:bg-red-50 hover:border-red-300"
                  onClick={handleReject}
                >
                  <ThumbsDown className="h-4 w-4" />
                  Skip
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2 hover:bg-blue-50 hover:border-blue-300"
                  onClick={handleEdit}
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleApprove}
                >
                  <ThumbsUp className="h-4 w-4" />
                  Approve
                </Button>
              </div>
            </div>
          ) : (
            // Edit Mode
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Main Content</label>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={3}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Details / Evidence</label>
                <Textarea
                  value={editedSubContent}
                  onChange={(e) => setEditedSubContent(e.target.value)}
                  rows={3}
                  className="w-full"
                />
              </div>

              {/* Edit Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSaveEdit}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={moveToPrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Item {currentIndex + 1} of {items.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={moveToNext}
              disabled={currentIndex === items.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm">
            <span>
              <strong>{Math.round(progress)}%</strong> reviewed
            </span>
            <span className="text-muted-foreground">
              {items.length - currentIndex - 1} items remaining
            </span>
            <span className="text-green-600 font-medium">
              ~{Math.ceil((items.length - currentIndex) / 20)} minutes left
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
