// =====================================================
// VAULT EXPORT DIALOG - Career Vault 2.0
// =====================================================
// MULTI-FORMAT EXPORT WITH DATA PORTABILITY
//
// This component provides export functionality in
// JSON, CSV, and formatted text for maximum portability
// and AI assistant compatibility.
//
// MARKETING MESSAGE:
// "Your career intelligence is YOURS. Export anytime
// in JSON (backup), CSV (Excel), or text (AI-ready).
// No lock-in."
// =====================================================

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { validateInput, invokeEdgeFunction, ExportVaultSchema } from '@/lib/edgeFunction';
import {
  Download,
  Loader2,
  FileJson,
  FileSpreadsheet,
  FileText,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useSupabaseClient } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = [
  { key: 'power_phrases', label: 'Power Phrases', icon: '💪' },
  { key: 'transferable_skills', label: 'Transferable Skills', icon: '🛠️' },
  { key: 'hidden_competencies', label: 'Hidden Competencies', icon: '💡' },
  { key: 'soft_skills', label: 'Soft Skills', icon: '🧠' },
  { key: 'leadership_philosophy', label: 'Leadership Philosophy', icon: '🎯' },
  { key: 'executive_presence', label: 'Executive Presence', icon: '👔' },
  { key: 'personality_traits', label: 'Personality Traits', icon: '🎭' },
  { key: 'work_style', label: 'Work Style', icon: '⚙️' },
  { key: 'values', label: 'Values & Motivations', icon: '💎' },
  { key: 'behavioral_indicators', label: 'Behavioral Indicators', icon: '🔍' },
];

const QUALITY_TIERS = [
  { key: 'gold', label: 'Gold (User-Verified)', color: 'bg-amber-100 text-amber-800' },
  { key: 'silver', label: 'Silver (Confirmed)', color: 'bg-slate-100 text-slate-800' },
  { key: 'bronze', label: 'Bronze (Medium)', color: 'bg-orange-100 text-orange-800' },
  { key: 'assumed', label: 'Assumed (Low)', color: 'bg-gray-100 text-gray-800' },
];

export default function VaultExportDialog({ vaultId }: { vaultId: string; totalItems?: number }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<'json' | 'csv' | 'text'>('json');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    CATEGORIES.map((c) => c.key)
  );
  const [selectedQualityTiers, setSelectedQualityTiers] = useState<string[]>([
    'gold',
    'silver',
    'bronze',
    'assumed',
  ]);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const supabase = useSupabaseClient();
  const { toast } = useToast();

  const toggleCategory = (key: string) => {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleQualityTier = (key: string) => {
    setSelectedQualityTiers((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleExport = async () => {
    if (selectedCategories.length === 0) {
      toast({
        title: 'Select categories',
        description: 'Please select at least one category to export',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    try {
      const validatedInput = validateInput(ExportVaultSchema, {
        vaultId,
        format,
        includeCategories: selectedCategories
      });

      const { data, error } = await invokeEdgeFunction(
        'export-vault',
        validatedInput
      );

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Download the file
      const blob = new Blob([data.data.content], {
        type: data.data.contentType,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: '✅ Export Complete',
        description: data.meta?.message || `Exported ${data.data.totalItems} items`,
      });

      setOpen(false);
    } catch (err: any) {
      // Error already handled by invokeEdgeFunction
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatDescription = () => {
    switch (format) {
      case 'json':
        return 'Complete backup with all metadata. Perfect for migration or external integrations.';
      case 'csv':
        return 'Spreadsheet-compatible format. Import into Excel or Google Sheets for custom analysis.';
      case 'text':
        return 'Human-readable format. Perfect for copying into ChatGPT, Claude, or any AI assistant.';
    }
  };

  const getFormatIcon = () => {
    switch (format) {
      case 'json':
        return FileJson;
      case 'csv':
        return FileSpreadsheet;
      case 'text':
        return FileText;
    }
  };

  const FormatIcon = getFormatIcon();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Vault
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            Export Career Vault
          </DialogTitle>
          <DialogDescription>
            Download your vault intelligence in your preferred format. Your data is yours—export
            anytime, use anywhere.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Export Format</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setFormat('json')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  format === 'json'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <FileJson className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="font-medium text-sm">JSON</div>
                <div className="text-xs text-slate-500">Full backup</div>
              </button>
              <button
                onClick={() => setFormat('csv')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  format === 'csv'
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="font-medium text-sm">CSV</div>
                <div className="text-xs text-slate-500">Excel-ready</div>
              </button>
              <button
                onClick={() => setFormat('text')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  format === 'text'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <FileText className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <div className="font-medium text-sm">Text</div>
                <div className="text-xs text-slate-500">AI-ready</div>
              </button>
            </div>
            <Alert className="bg-blue-50 border-blue-200">
              <FormatIcon className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800">
                {getFormatDescription()}
              </AlertDescription>
            </Alert>
          </div>

          {/* Categories Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Categories to Export</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setSelectedCategories(
                    selectedCategories.length === CATEGORIES.length
                      ? []
                      : CATEGORIES.map((c) => c.key)
                  )
                }
              >
                {selectedCategories.length === CATEGORIES.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 bg-secondary/50 rounded-lg">
              {CATEGORIES.map((category) => (
                <div key={category.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={category.key}
                    checked={selectedCategories.includes(category.key)}
                    onCheckedChange={() => toggleCategory(category.key)}
                  />
                  <Label htmlFor={category.key} className="text-sm cursor-pointer text-foreground">
                    {category.icon} {category.label}
                  </Label>
                </div>
              ))}
            </div>
            <div className="text-sm text-slate-600">
              {selectedCategories.length} of {CATEGORIES.length} categories selected
            </div>
          </div>

          {/* Quality Tiers Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Quality Tiers to Export</Label>
            <div className="grid grid-cols-2 gap-2 p-2 bg-secondary/50 rounded-lg">
              {QUALITY_TIERS.map((tier) => (
                <div key={tier.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={tier.key}
                    checked={selectedQualityTiers.includes(tier.key)}
                    onCheckedChange={() => toggleQualityTier(tier.key)}
                  />
                  <Label htmlFor={tier.key} className="text-sm cursor-pointer text-foreground">
                    <Badge variant="outline" className={tier.color}>
                      {tier.label}
                    </Badge>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata Toggle */}
          {format === 'json' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="metadata"
                checked={includeMetadata}
                onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
              />
              <Label htmlFor="metadata" className="text-sm cursor-pointer">
                Include metadata (vault strength, timestamps, user ID)
              </Label>
            </div>
          )}

          {/* Use Case Suggestions */}
          <Alert className="bg-purple-50 border-purple-200">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <AlertDescription className="text-sm text-purple-800 space-y-2">
              <p className="font-semibold">💡 Export Use Cases:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>
                  <strong>Text format:</strong> Copy into ChatGPT/Claude for personalized career
                  coaching
                </li>
                <li>
                  <strong>CSV format:</strong> Analyze in Excel, create custom visualizations
                </li>
                <li>
                  <strong>JSON format:</strong> Integrate with resume builders, portfolio sites
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleExport} disabled={isExporting} className="flex-1">
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {format.toUpperCase()}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>

          {/* Data Ownership Message */}
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-sm text-green-800">
              <strong>Your data, your control.</strong> Export anytime, use anywhere. No lock-in,
              no restrictions.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
