import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  FileType2, 
  Code, 
  FileDown,
  Loader2,
  Check,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ExportFormat = 'pdf' | 'docx' | 'html' | 'txt';

interface ExportOption {
  id: ExportFormat;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  recommended?: boolean;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'docx',
    name: 'Microsoft Word',
    description: 'Editable format, perfect for further customization',
    icon: <FileType2 className="h-6 w-6" />,
    features: ['Fully editable', 'ATS-friendly', 'Professional formatting'],
    recommended: true
  },
  {
    id: 'pdf',
    name: 'PDF Document',
    description: 'Universal format for sharing and printing',
    icon: <FileText className="h-6 w-6" />,
    features: ['Print-ready', 'Fixed layout', 'Universal compatibility']
  },
  {
    id: 'html',
    name: 'HTML File',
    description: 'Web-ready format for online portfolios',
    icon: <Code className="h-6 w-6" />,
    features: ['Web-ready', 'Customizable', 'Responsive']
  },
  {
    id: 'txt',
    name: 'Plain Text',
    description: 'Simple format for copy-paste into applications',
    icon: <FileDown className="h-6 w-6" />,
    features: ['ATS-safe', 'Copy-paste ready', 'No formatting']
  }
];

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => Promise<void>;
  resumeName?: string;
}

export function ExportDialog({ open, onClose, onExport, resumeName = 'Resume' }: ExportDialogProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [completed, setCompleted] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setExporting(format);
    try {
      await onExport(format);
      setCompleted(format);
      setTimeout(() => {
        setCompleted(null);
      }, 2000);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Your Resume</DialogTitle>
          <DialogDescription>
            Choose your preferred format to download "{resumeName}"
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {EXPORT_OPTIONS.map((option) => (
            <Card
              key={option.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                option.recommended && 'border-primary',
                exporting === option.id && 'opacity-75'
              )}
              onClick={() => !exporting && handleExport(option.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    'p-2 rounded-lg',
                    option.recommended ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    {option.icon}
                  </div>
                  {option.recommended && (
                    <Badge className="gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Recommended
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-base mt-2">{option.name}</CardTitle>
                <CardDescription className="text-xs">{option.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1 mb-3">
                  {option.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
                <Button 
                  className="w-full" 
                  variant={option.recommended ? 'default' : 'outline'}
                  disabled={!!exporting}
                >
                  {exporting === option.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : completed === option.id ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Downloaded!
                    </>
                  ) : (
                    <>
                      <FileDown className="h-4 w-4 mr-2" />
                      Download {option.name.split(' ')[0]}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
