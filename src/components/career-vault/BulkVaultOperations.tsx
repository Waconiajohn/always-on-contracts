// =====================================================
// BULK VAULT OPERATIONS - Career Vault 2.0
// =====================================================
// MASS UPDATE/DELETE WITH TIME SAVINGS
//
// This component enables bulk operations on selected
// vault items including quality tier updates, deletions,
// and archiving with automatic vault recalculation.
//
// MARKETING MESSAGE:
// "Managing hundreds of insights manually? Our bulk
// operations let you refine your entire vault in
// minutes—not hours."
// =====================================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Zap,
  Loader2,
  Award,
  Trash2,
  Archive,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useSupabaseClient } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { validateInput, invokeEdgeFunction, BulkVaultOperationsSchema } from '@/lib/edgeFunction';

interface BulkVaultOperationsProps {
  vaultId: string;
  selectedItems: Array<{
    id: string;
    tableName: string;
    category: string;
    content: string;
    qualityTier?: string;
  }>;
  onOperationComplete: () => void;
  onClearSelection: () => void;
}

export default function BulkVaultOperations({
  vaultId,
  selectedItems,
  onOperationComplete,
  onClearSelection,
}: BulkVaultOperationsProps) {
  const [operation, setOperation] = useState<'update_quality' | 'delete' | 'archive' | ''>('');
  const [newQualityTier, setNewQualityTier] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const supabase = useSupabaseClient();
  const { toast } = useToast();

  const groupedByTable = selectedItems.reduce((acc, item) => {
    if (!acc[item.tableName]) {
      acc[item.tableName] = [];
    }
    acc[item.tableName].push(item.id);
    return acc;
  }, {} as Record<string, string[]>);

  const estimatedTimeSaved = Math.ceil(selectedItems.length / 5); // ~5 items per minute manual work

  const handleExecute = async () => {
    if (!operation) {
      toast({
        title: 'Select an operation',
        description: 'Please choose what to do with selected items',
        variant: 'destructive',
      });
      return;
    }

    if (operation === 'update_quality' && !newQualityTier) {
      toast({
        title: 'Select quality tier',
        description: 'Please choose the new quality tier',
        variant: 'destructive',
      });
      return;
    }

    setConfirmDialogOpen(true);
  };

  const executeOperation = async () => {
    setIsProcessing(true);
    setConfirmDialogOpen(false);

    try {
      const validatedInput = validateInput(BulkVaultOperationsSchema, {
        vaultId,
        operation,
        itemIds: Object.values(groupedByTable).flat(),
        category: operation === 'update_quality' ? newQualityTier : undefined
      });

      const { data, error } = await invokeEdgeFunction(
        'bulk-vault-operations',
        validatedInput
      );

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setLastResult(data.data);

      toast({
        title: '✅ Bulk Operation Complete',
        description: data.meta?.message || `Processed ${data.data.totalProcessed} items`,
      });

      // Clear selection and refresh
      onClearSelection();
      onOperationComplete();
    } catch (err: any) {
      // Error already handled by invokeEdgeFunction
    } finally {
      setIsProcessing(false);
    }
  };

  const getOperationDescription = () => {
    switch (operation) {
      case 'update_quality':
        return `Update ${selectedItems.length} items to ${newQualityTier} tier`;
      case 'delete':
        return `Permanently delete ${selectedItems.length} items`;
      case 'archive':
        return `Archive ${selectedItems.length} items (hidden from active vault)`;
      default:
        return '';
    }
  };

  if (selectedItems.length === 0) {
    return (
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="py-8 text-center">
          <Zap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 mb-1">No items selected</p>
          <p className="text-sm text-slate-500">
            Select items from the vault table to perform bulk operations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Bulk Operations
            <Badge className="bg-purple-600 text-white ml-2">
              {selectedItems.length} selected
            </Badge>
          </CardTitle>
          <CardDescription>
            Manage multiple vault items at once—save time with batch updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Time Savings Alert */}
          <Alert className="bg-green-50 border-green-200">
            <Clock className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-sm text-green-800">
              <strong>Time savings:</strong> ~{estimatedTimeSaved} minute
              {estimatedTimeSaved !== 1 ? 's' : ''} vs manual updates
            </AlertDescription>
          </Alert>

          {/* Selection Summary */}
          <div className="bg-white rounded-lg p-4 border border-purple-200 space-y-2">
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Selected Items:</h4>
            {Object.entries(
              selectedItems.reduce((acc, item) => {
                if (!acc[item.category]) acc[item.category] = 0;
                acc[item.category]++;
                return acc;
              }, {} as Record<string, number>)
            ).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{category}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>

          {/* Operation Selection */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-900 mb-2 block">
                Choose Operation
              </label>
              <Select value={operation} onValueChange={(val: any) => setOperation(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select operation..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="update_quality">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Update Quality Tier
                    </div>
                  </SelectItem>
                  <SelectItem value="archive">
                    <div className="flex items-center gap-2">
                      <Archive className="w-4 h-4" />
                      Archive Items
                    </div>
                  </SelectItem>
                  <SelectItem value="delete">
                    <div className="flex items-center gap-2 text-red-600">
                      <Trash2 className="w-4 h-4" />
                      Delete Permanently
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quality Tier Selection (only for update_quality) */}
            {operation === 'update_quality' && (
              <div>
                <label className="text-sm font-medium text-slate-900 mb-2 block">
                  New Quality Tier
                </label>
                <Select value={newQualityTier} onValueChange={setNewQualityTier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quality tier..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gold">Gold (User-Verified)</SelectItem>
                    <SelectItem value="silver">Silver (Confirmed)</SelectItem>
                    <SelectItem value="bronze">Bronze (Medium Confidence)</SelectItem>
                    <SelectItem value="assumed">Assumed (Low Confidence)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleExecute}
              disabled={isProcessing || !operation}
              className="flex-1"
              variant={operation === 'delete' ? 'destructive' : 'default'}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {operation === 'update_quality' && <Award className="w-4 h-4 mr-2" />}
                  {operation === 'archive' && <Archive className="w-4 h-4 mr-2" />}
                  {operation === 'delete' && <Trash2 className="w-4 h-4 mr-2" />}
                  Execute
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClearSelection}>
              Clear Selection
            </Button>
          </div>

          {/* Last Result */}
          {lastResult && (
            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800">
                Last operation: {lastResult.totalProcessed} items processed
                {lastResult.newVaultStrength && (
                  <span> • New vault strength: {lastResult.newVaultStrength}%</span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {operation === 'delete' && (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Confirm Deletion
                </>
              )}
              {operation !== 'delete' && 'Confirm Bulk Operation'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-medium">You are about to:</p>
              <p className="text-base">{getOperationDescription()}</p>

              {operation === 'delete' && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription className="text-sm">
                    <strong>Warning:</strong> This action cannot be undone. Deleted items will be
                    permanently removed from your vault.
                  </AlertDescription>
                </Alert>
              )}

              <p className="text-sm">
                Affected tables:{' '}
                {Object.keys(groupedByTable)
                  .map((t) => t.replace('vault_', '').replace(/_/g, ' '))
                  .join(', ')}
              </p>

              <p className="text-sm font-medium">
                This will save you approximately {estimatedTimeSaved} minute
                {estimatedTimeSaved !== 1 ? 's' : ''} vs manual updates.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeOperation}
              className={operation === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {operation === 'delete' ? 'Yes, Delete Permanently' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
