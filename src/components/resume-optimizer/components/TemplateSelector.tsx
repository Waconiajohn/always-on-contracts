import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, FileText, Layout, Sparkles, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  features: string[];
  emphasis: 'leadership' | 'technical' | 'balanced' | 'creative';
  layout: 'single-column' | 'two-column' | 'hybrid';
  atsScore: number;
  icon: React.ReactNode;
}

export const TEMPLATES: ResumeTemplate[] = [
  {
    id: 'executive',
    name: 'Executive Classic',
    description: 'Clean, authoritative layout emphasizing leadership and strategic impact',
    features: ['Leadership focus', 'Impact metrics', 'Board-ready'],
    emphasis: 'leadership',
    layout: 'single-column',
    atsScore: 98,
    icon: <Briefcase className="h-5 w-5" />
  },
  {
    id: 'technical',
    name: 'Technical Professional',
    description: 'Skills-forward layout highlighting technical expertise and projects',
    features: ['Skills matrix', 'Project showcase', 'Tech stack'],
    emphasis: 'technical',
    layout: 'hybrid',
    atsScore: 95,
    icon: <Layout className="h-5 w-5" />
  },
  {
    id: 'modern',
    name: 'Modern Professional',
    description: 'Contemporary design balancing visual appeal with ATS compliance',
    features: ['Balanced layout', 'Visual hierarchy', 'Modern fonts'],
    emphasis: 'balanced',
    layout: 'single-column',
    atsScore: 96,
    icon: <FileText className="h-5 w-5" />
  },
  {
    id: 'creative',
    name: 'Creative Hybrid',
    description: 'Distinctive format for roles where creativity matters',
    features: ['Portfolio ready', 'Visual elements', 'Unique layout'],
    emphasis: 'creative',
    layout: 'two-column',
    atsScore: 88,
    icon: <Sparkles className="h-5 w-5" />
  }
];

interface TemplateSelectorProps {
  selectedTemplateId?: string;
  onSelectTemplate: (template: ResumeTemplate) => void;
  compact?: boolean;
}

export function TemplateSelector({ selectedTemplateId, onSelectTemplate, compact = false }: TemplateSelectorProps) {
  if (compact) {
    return (
      <div className="flex gap-2 flex-wrap">
        {TEMPLATES.map((template) => (
          <Button
            key={template.id}
            variant={selectedTemplateId === template.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelectTemplate(template)}
            className="gap-2"
          >
            {template.icon}
            {template.name}
            {selectedTemplateId === template.id && <Check className="h-3 w-3" />}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEMPLATES.map((template) => (
          <Card
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              selectedTemplateId === template.id
                ? 'border-primary ring-2 ring-primary/20'
                : 'hover:border-primary/50'
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'p-2 rounded-lg',
                    selectedTemplateId === template.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    {template.icon}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                    <CardDescription className="text-xs">{template.layout.replace('-', ' ')}</CardDescription>
                  </div>
                </div>
                {selectedTemplateId === template.id && (
                  <div className="bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {template.features.map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">ATS Score</span>
                <span className={cn(
                  'font-medium',
                  template.atsScore >= 95 ? 'text-emerald-600' : 
                  template.atsScore >= 90 ? 'text-amber-600' : 'text-orange-600'
                )}>
                  {template.atsScore}%
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


