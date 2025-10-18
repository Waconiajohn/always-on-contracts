import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    // Convert extracted data into reviewable items
    const allItems: VaultItem[] = [];

    // Power Phrases
    extractedData.powerPhrases?.forEach((pp: any) => {
      allItems.push({
        category: 'Power Phrase',
        content: pp.phrase,
        subContent: pp.context,
        metadata: pp,
        confidence: pp.confidence || 85,
        status: 'pending'
      });
    });

    // Transferable Skills
    extractedData.transferableSkills?.forEach((skill: any) => {
      allItems.push({
        category: 'Transferable Skill',
        content: skill.skill,
        subContent: skill.evidence,
        metadata: skill,
        confidence: skill.level === 'expert' ? 95 : skill.level === 'advanced' ? 85 : 75,
        status: 'pending'
      });
    });

    // Hidden Competencies
    extractedData.hiddenCompetencies?.forEach((comp: any) => {
      allItems.push({
        category: 'Hidden Competency',
        content: comp.competency,
        subContent: comp.description,
        metadata: comp,
        confidence: 80,
        status: 'pending'
      });
    });

    // Soft Skills
    extractedData.softSkills?.forEach((soft: any) => {
      allItems.push({
        category: 'Soft Skill',
        content: soft.skillName,
        subContent: soft.evidence,
        metadata: soft,
        confidence: 80,
        status: 'pending'
      });
    });

    // Leadership Philosophy
    extractedData.leadershipPhilosophy?.forEach((phil: any) => {
      allItems.push({
        category: 'Leadership Philosophy',
        content: phil.philosophyStatement,
        subContent: phil.realWorldApplication,
        metadata: phil,
        confidence: 85,
        status: 'pending'
      });
    });

    // Executive Presence
    extractedData.executivePresence?.forEach((pres: any) => {
      allItems.push({
        category: 'Executive Presence',
        content: pres.presenceIndicator,
        subContent: pres.situationalExample,
        metadata: pres,
        confidence: 80,
        status: 'pending'
      });
    });

    // Personality Traits
    extractedData.personalityTraits?.forEach((trait: any) => {
      allItems.push({
        category: 'Personality Trait',
        content: trait.traitName,
        subContent: trait.behavioralEvidence,
        metadata: trait,
        confidence: 75,
        status: 'pending'
      });
    });

    // Work Style
    extractedData.workStyle?.forEach((style: any) => {
      allItems.push({
        category: 'Work Style',
        content: style.preferenceArea,
        subContent: style.preferenceDescription,
        metadata: style,
        confidence: 75,
        status: 'pending'
      });
    });

    // Values
    extractedData.values?.forEach((value: any) => {
      allItems.push({
        category: 'Core Value',
        content: value.valueName,
        subContent: value.manifestation,
        metadata: value,
        confidence: 80,
        status: 'pending'
      });
    });

    // Behavioral Indicators
    extractedData.behavioralIndicators?.forEach((indicator: any) => {
      allItems.push({
        category: 'Behavioral Pattern',
        content: indicator.indicatorType,
        subContent: indicator.specificBehavior,
        metadata: indicator,
        confidence: 75,
        status: 'pending'
      });
    });

    return allItems;
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
      // Save approved and edited items to database
      const approvedItems = items.filter(i => i.status === 'approved' || i.status === 'edited');

      toast({
        title: 'Saving Your Vault...',
        description: `Finalizing ${approvedItems.length} intelligence items`,
      });

      // Note: Items are already in the database from auto-populate
      // We just need to delete rejected ones
      const rejectedItems = items.filter(i => i.status === 'rejected');

      // TODO: Implement deletion of rejected items
      // This would require adding IDs when we load items from the database

      // Update vault completion percentage
      const completionPercentage = Math.round((approvedItems.length / items.length) * 100);

      await supabase
        .from('career_vault')
        .update({
          interview_completion_percentage: Math.max(85, completionPercentage),
          reviewed: true,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', vaultId);

      toast({
        title: 'Vault Complete!',
        description: `${approvedItems.length} items approved, ${rejectedItems.length} rejected`,
      });

      onComplete();
    } catch (error) {
      console.error('Error saving vault review:', error);
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
            <CardTitle>Review Your Career Intelligence</CardTitle>
            <Badge variant="secondary">
              {currentIndex + 1} of {items.length}
            </Badge>
          </div>
          <CardDescription>
            AI extracted {items.length} intelligence items. Quick review: approve, edit, or skip.
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
                <h3 className="text-xl font-semibold mb-2">{currentItem.content}</h3>
                {currentItem.subContent && (
                  <p className="text-muted-foreground">{currentItem.subContent}</p>
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
