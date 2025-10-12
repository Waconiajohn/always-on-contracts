import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
  features: string[];
}

const templates: Template[] = [
  {
    id: "modern",
    name: "Modern Professional",
    description: "Clean, minimal two-column layout with skills sidebar",
    preview: "/templates/modern-preview.svg",
    features: ["Two-column layout", "Skills sidebar", "Clean typography", "100% ATS-friendly"]
  },
  {
    id: "executive",
    name: "Executive Classic",
    description: "Traditional single-column conservative design",
    preview: "/templates/executive-preview.svg",
    features: ["Single-column", "Conservative style", "Executive focus", "100% ATS-friendly"]
  },
  {
    id: "technical",
    name: "Technical Hybrid",
    description: "Skills-first project-focused modern layout",
    preview: "/templates/technical-preview.svg",
    features: ["Skills-first", "Project sections", "Modern design", "100% ATS-friendly"]
  }
];

interface TemplateSelectorProps {
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
}

export const TemplateSelector = ({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Your Resume Template</h3>
        <p className="text-sm text-muted-foreground">All templates are 100% ATS-compatible and export to HTML, DOCX, and PDF</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all ${
              selectedTemplate === template.id 
                ? 'border-primary border-2 shadow-lg' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => onSelectTemplate(template.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {template.description}
                  </CardDescription>
                </div>
                {selectedTemplate === template.id && (
                  <div className="bg-primary rounded-full p-1">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Template Preview Placeholder */}
              <div className="aspect-[8.5/11] bg-muted rounded-md flex items-center justify-center border-2 border-dashed">
                <div className="text-center p-4">
                  <p className="text-xs text-muted-foreground">{template.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">Preview</p>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-1">
                {template.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <Check className="h-3 w-3 text-green-600" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                variant={selectedTemplate === template.id ? "default" : "outline"}
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTemplate(template.id);
                }}
              >
                {selectedTemplate === template.id ? "Selected" : "Select Template"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-muted p-4 rounded-lg text-sm space-y-1">
        <p className="font-semibold">✓ All templates export to:</p>
        <ul className="list-disc list-inside text-muted-foreground ml-2 space-y-0.5">
          <li>HTML (web-ready format)</li>
          <li>DOCX (Microsoft Word compatible)</li>
          <li>PDF (print-ready, universal format)</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-2">
          💡 You can customize colors and fonts after generation
        </p>
      </div>
    </div>
  );
};
