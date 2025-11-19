import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Globe, FileCode, FileDown, CheckCircle2 } from "lucide-react";

interface ExportFormatGuideProps {
  open: boolean;
  onClose: () => void;
  onSelectFormat: (format: 'pdf' | 'docx' | 'html' | 'txt') => void;
}

export const ExportFormatGuide = ({ open, onClose, onSelectFormat }: ExportFormatGuideProps) => {
  const formats = [
    {
      id: 'pdf' as const,
      icon: FileText,
      title: 'PDF - Standard Resume',
      recommended: true,
      description: 'Best for email applications and general use',
      features: [
        'Preserves formatting perfectly',
        'Works on all devices',
        'Professional appearance',
        'Cannot be easily edited (secure)'
      ]
    },
    {
      id: 'docx' as const,
      icon: FileDown,
      title: 'DOCX - Editable Resume',
      description: 'Best for further customization',
      features: [
        'Can be edited in Microsoft Word',
        'Maintain structure and formatting',
        'Easy to update later',
        'Compatible with most systems'
      ]
    },
    {
      id: 'html' as const,
      icon: Globe,
      title: 'HTML - Web Version',
      description: 'Best for personal website or portfolio',
      features: [
        'Can be styled with CSS',
        'Include on your website',
        'Interactive elements possible',
        'SEO-friendly'
      ]
    },
    {
      id: 'txt' as const,
      icon: FileCode,
      title: 'TXT - Plain Text',
      description: 'Best for copy-paste into forms',
      features: [
        'No formatting',
        'Universal compatibility',
        'ATS-friendly',
        'Quick copy-paste'
      ]
    }
  ];

  const handleSelect = (format: 'pdf' | 'docx' | 'html' | 'txt') => {
    onSelectFormat(format);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Export Format</DialogTitle>
          <DialogDescription>
            Select the format that best suits your needs
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {formats.map((format) => {
            const Icon = format.icon;
            return (
              <Card
                key={format.id}
                className="cursor-pointer hover:border-primary transition-all relative"
                onClick={() => handleSelect(format.id)}
              >
                {format.recommended && (
                  <div className="absolute top-2 right-2">
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                      Recommended
                    </span>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{format.title}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {format.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {format.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full mt-4"
                    variant={format.recommended ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(format.id);
                    }}
                  >
                    Export as {format.id.toUpperCase()}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
