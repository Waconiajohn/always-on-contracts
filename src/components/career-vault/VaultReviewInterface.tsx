import React, { useState, useEffect } from 'react';
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
  // Database identifiers for deletion
  tableName?: string;
  recordId?: string;
}

interface VaultReviewInterfaceProps {
  vaultId: string;
  extractedData?: any; // Optional - will load from DB if not provided
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
  const [items, setItems] = useState<VaultItem[]>([]);
  const [isLoadingFromDb, setIsLoadingFromDb] = useState(!extractedData);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedSubContent, setEditedSubContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Phase 4: Session keepalive to prevent logout during long reviews
  useEffect(() => {
    const keepAlive = setInterval(async () => {
      try {
        await supabase.auth.refreshSession();
        console.log('[VAULT_REVIEW] Session refreshed');
      } catch (error) {
        console.error('[VAULT_REVIEW] Session refresh failed:', error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(keepAlive);
  }, []);

  // Phase 4: Auto-save progress to localStorage every 30 seconds
  useEffect(() => {
    if (items.length === 0) return;

    const autoSave = setInterval(() => {
      const progress = {
        vaultId,
        currentIndex,
        timestamp: Date.now(),
        totalItems: items.length,
        approvedCount: items.filter(i => i.status === 'approved').length,
        editedCount: items.filter(i => i.status === 'edited').length,
        rejectedCount: items.filter(i => i.status === 'rejected').length
      };
      localStorage.setItem(`vault_review_progress_${vaultId}`, JSON.stringify(progress));
      console.log('[VAULT_REVIEW] Progress auto-saved');
    }, 30 * 1000); // Every 30 seconds

    return () => clearInterval(autoSave);
  }, [items, currentIndex, vaultId]);

  // Phase 4: Restore progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem(`vault_review_progress_${vaultId}`);
    if (savedProgress && items.length > 0) {
      try {
        const progress = JSON.parse(savedProgress);
        const timeSinceLastSave = Date.now() - progress.timestamp;
        
        // Only restore if saved within last 24 hours
        if (timeSinceLastSave < 24 * 60 * 60 * 1000) {
          setCurrentIndex(progress.currentIndex);
          console.log('[VAULT_REVIEW] Progress restored from localStorage');
        }
      } catch (error) {
        console.error('[VAULT_REVIEW] Failed to restore progress:', error);
      }
    }
  }, [items.length, vaultId]);

  // PHASE 3: Load data directly from database
  const loadItemsFromDatabase = async () => {
    try {
      console.log('[VAULT_REVIEW] Loading items from database for vault:', vaultId);
      const allItems: VaultItem[] = [];

      // Fetch from all 10 vault tables in parallel
      const [
        powerPhrasesRes,
        transferableSkillsRes,
        hiddenCompetenciesRes,
        softSkillsRes,
        leadershipPhilosophyRes,
        executivePresenceRes,
        personalityTraitsRes,
        workStyleRes,
        valuesRes,
        behavioralIndicatorsRes
      ] = await Promise.all([
        supabase.from('vault_power_phrases').select('*').eq('vault_id', vaultId),
        supabase.from('vault_transferable_skills').select('*').eq('vault_id', vaultId),
        supabase.from('vault_hidden_competencies').select('*').eq('vault_id', vaultId),
        supabase.from('vault_soft_skills').select('*').eq('vault_id', vaultId),
        supabase.from('vault_leadership_philosophy').select('*').eq('vault_id', vaultId),
        supabase.from('vault_executive_presence').select('*').eq('vault_id', vaultId),
        supabase.from('vault_personality_traits').select('*').eq('vault_id', vaultId),
        supabase.from('vault_work_style').select('*').eq('vault_id', vaultId),
        supabase.from('vault_values_motivations').select('*').eq('vault_id', vaultId),
        supabase.from('vault_behavioral_indicators').select('*').eq('vault_id', vaultId)
      ]);

      // Transform Power Phrases
      powerPhrasesRes.data?.forEach((pp: any) => {
        allItems.push({
          recordId: pp.id,
          tableName: 'vault_power_phrases',
          category: 'Power Phrase',
          content: pp.phrase || '',
          subContent: pp.context || '',
          metadata: pp,
          confidence: 85,
          status: 'pending'
        });
      });

      // Transform Transferable Skills
      transferableSkillsRes.data?.forEach((skill: any) => {
        allItems.push({
          recordId: skill.id,
          tableName: 'vault_transferable_skills',
          category: 'Transferable Skill',
          content: skill.stated_skill || '',
          subContent: skill.evidence || '',
          metadata: skill,
          confidence: skill.proficiency_level === 'expert' ? 95 : 85,
          status: 'pending'
        });
      });

      // Transform Hidden Competencies
      hiddenCompetenciesRes.data?.forEach((comp: any) => {
        allItems.push({
          recordId: comp.id,
          tableName: 'vault_hidden_competencies',
          category: 'Hidden Competency',
          content: comp.competency || '',
          subContent: comp.description || '',
          metadata: comp,
          confidence: 80,
          status: 'pending'
        });
      });

      // Transform Soft Skills
      softSkillsRes.data?.forEach((soft: any) => {
        allItems.push({
          recordId: soft.id,
          tableName: 'vault_soft_skills',
          category: 'Soft Skill',
          content: soft.skill_name || '',
          subContent: soft.evidence || '',
          metadata: soft,
          confidence: 80,
          status: 'pending'
        });
      });

      // Transform Leadership Philosophy
      leadershipPhilosophyRes.data?.forEach((phil: any) => {
        console.log('[VAULT_REVIEW] Leadership Philosophy item:', {
          id: phil.id,
          philosophy_statement: phil.philosophy_statement,
          statement_type: typeof phil.philosophy_statement,
          statement_length: phil.philosophy_statement?.length
        });
        allItems.push({
          recordId: phil.id,
          tableName: 'vault_leadership_philosophy',
          category: 'Leadership Philosophy',
          content: phil.philosophy_statement || '',
          subContent: phil.real_world_application || '',
          metadata: phil,
          confidence: 85,
          status: 'pending'
        });
      });

      // Transform Executive Presence
      executivePresenceRes.data?.forEach((pres: any) => {
        allItems.push({
          recordId: pres.id,
          tableName: 'vault_executive_presence',
          category: 'Executive Presence',
          content: pres.presence_indicator || '',
          subContent: pres.evidence || '',
          metadata: pres,
          confidence: 80,
          status: 'pending'
        });
      });

      // Transform Personality Traits
      personalityTraitsRes.data?.forEach((trait: any) => {
        allItems.push({
          recordId: trait.id,
          tableName: 'vault_personality_traits',
          category: 'Personality Trait',
          content: trait.trait_name || '',
          subContent: trait.behavioral_evidence || '',
          metadata: trait,
          confidence: 75,
          status: 'pending'
        });
      });

      // Transform Work Style
      workStyleRes.data?.forEach((style: any) => {
        allItems.push({
          recordId: style.id,
          tableName: 'vault_work_style',
          category: 'Work Style',
          content: style.preference_area || '',
          subContent: style.preference_description || '',
          metadata: style,
          confidence: 75,
          status: 'pending'
        });
      });

      // Transform Values
      valuesRes.data?.forEach((value: any) => {
        allItems.push({
          recordId: value.id,
          tableName: 'vault_values_motivations',
          category: 'Core Value',
          content: value.value_name || '',
          subContent: value.manifestation || '',
          metadata: value,
          confidence: 80,
          status: 'pending'
        });
      });

      // Transform Behavioral Indicators
      behavioralIndicatorsRes.data?.forEach((indicator: any) => {
        allItems.push({
          recordId: indicator.id,
          tableName: 'vault_behavioral_indicators',
          category: 'Behavioral Pattern',
          content: indicator.indicator_type || '',
          subContent: indicator.specific_behavior || '',
          metadata: indicator,
          confidence: 75,
          status: 'pending'
        });
      });

      console.log('[VAULT_REVIEW] Loaded', allItems.length, 'items from database');
      setItems(allItems);
      setIsLoadingFromDb(false);
    } catch (error) {
      console.error('[VAULT_REVIEW] Error loading from database:', error);
      toast({
        title: 'Error Loading Vault',
        description: 'Failed to load your vault items. Please refresh the page.',
        variant: 'destructive'
      });
      setIsLoadingFromDb(false);
    }
  };

  // Phase 4: Defensive check - redirect if vault is empty
  useEffect(() => {
    const checkVaultState = async () => {
      try {
        const { data: vault } = await supabase
          .from('career_vault')
          .select('total_power_phrases, total_transferable_skills, total_hidden_competencies')
          .eq('id', vaultId)
          .single();
        
        const totalItems = (vault?.total_power_phrases || 0) + 
                          (vault?.total_transferable_skills || 0) + 
                          (vault?.total_hidden_competencies || 0);
        
        if (totalItems === 0 && items.length === 0 && !isLoadingFromDb) {
          // Vault is empty - redirect to onboarding
          console.log('[VAULT_REVIEW] Vault is empty, redirecting to onboarding');
          toast({
            title: 'Vault is Empty',
            description: 'Please upload a resume to populate your vault first.',
            variant: 'destructive'
          });
          window.location.href = '/career-vault';
        }
      } catch (error) {
        console.error('[VAULT_REVIEW] Error checking vault state:', error);
      }
    };
    
    checkVaultState();
  }, [vaultId, items.length, isLoadingFromDb]);

  // Load items on mount (Phase 3: Database-first approach)
  React.useEffect(() => {
    if (extractedData) {
      // Legacy: Use extractedData if provided
      console.log('[VAULT_REVIEW] Using extractedData prop (legacy mode)');
      const transformedItems = transformExtractedDataToItems(extractedData);
      setItems(transformedItems);
    } else {
      // Phase 3: Load from database
      console.log('[VAULT_REVIEW] Loading from database (Phase 3 mode)');
      loadItemsFromDatabase();
    }
  }, [vaultId, extractedData]);

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

  const handleSaveEdit = async () => {
    const updatedItems = [...items];
    updatedItems[currentIndex] = {
      ...currentItem,
      content: editedContent,
      subContent: editedSubContent,
      status: 'edited'
    };
    setItems(updatedItems);
    setIsEditing(false);
    
    // Update progress in database
    await updateReviewProgress(updatedItems);
    
    moveToNext();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent('');
    setEditedSubContent('');
  };

  const updateItemStatus = async (status: 'approved' | 'rejected') => {
    const updatedItems = [...items];
    updatedItems[currentIndex] = { ...currentItem, status };
    setItems(updatedItems);
    
    // Update progress in database in real-time
    await updateReviewProgress(updatedItems);
  };
  
  const updateReviewProgress = async (updatedItems: typeof items) => {
    const reviewedCount = updatedItems.filter(i => i.status !== 'pending').length;
    const progressPercentage = Math.round((reviewedCount / updatedItems.length) * 100);
    
    try {
      await supabase
        .from('career_vault')
        .update({ review_completion_percentage: progressPercentage })
        .eq('id', vaultId);
    } catch (error) {
      console.error('[VAULT_REVIEW] Error updating progress:', error);
    }
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

  const handleSkipReview = async () => {
    try {
      setIsSaving(true);

      console.log('[VAULT-REVIEW] Skipping review - auto-approving all items');

      // Update the vault's completion status
      const { error: updateError } = await supabase
        .from('career_vault')
        .update({ 
          reviewed: true,
          reviewed_at: new Date().toISOString(),
          review_completion_percentage: 100
        })
        .eq('id', vaultId);

      if (updateError) throw updateError;

      toast({
        title: "Review Skipped",
        description: "All items have been auto-approved. You can edit them later from your vault dashboard.",
      });

      // Clear any saved progress
      localStorage.removeItem(`vault_review_progress_${vaultId}`);
      
      onComplete();
    } catch (error) {
      console.error('[VAULT-REVIEW] Error skipping review:', error);
      toast({
        title: "Error",
        description: "Failed to skip review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
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
      // Phase 3: Use actual record IDs for precise deletion
      if (rejectedItems.length > 0) {
        console.log('[VAULT_REVIEW] Deleting', rejectedItems.length, 'rejected items');
        
        for (const item of rejectedItems) {
          if (!item.recordId || !item.tableName) {
            console.warn('[VAULT_REVIEW] Skipping item without ID/table:', item);
            continue;
          }

          try {
            const { error: deleteError } = await supabase
              .from(item.tableName as any)
              .delete()
              .eq('id', item.recordId);

            if (deleteError) {
              console.error(`[VAULT_REVIEW] Error deleting ${item.recordId} from ${item.tableName}:`, deleteError);
            } else {
              console.log(`[VAULT_REVIEW] Deleted ${item.content} from ${item.tableName}`);
            }
          } catch (err) {
            console.error(`[VAULT_REVIEW] Exception deleting item:`, err);
          }
        }
      }

      // Update vault completion and review status
      const { error: updateError } = await supabase
        .from('career_vault')
        .update({
          review_completion_percentage: 100, // Review is complete
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

  // Show loading state while fetching from database
  if (isLoadingFromDb) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="py-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <div>
              <h2 className="text-xl font-semibold mb-2">Loading Your Vault...</h2>
              <p className="text-sm text-muted-foreground">
                Fetching {items.length > 0 ? items.length : 'your'} intelligence items from the database
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
            <div className="flex items-center gap-3">
              <Badge variant="secondary">
                {currentIndex + 1} of {items.length}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSkipReview}
                disabled={isSaving}
              >
                Skip Review & Continue
              </Button>
            </div>
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
