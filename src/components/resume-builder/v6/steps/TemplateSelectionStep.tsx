/**
 * TemplateSelectionStep - Select from 4 professional resume templates
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Star, CheckCircle2, ArrowLeft, Eye, Cpu } from 'lucide-react';
import type { BenchmarkBuilderState, ResumeTemplate, TemplateType } from '../types';

interface TemplateSelectionStepProps {
  state: BenchmarkBuilderState;
  onSelectTemplate: (template: ResumeTemplate) => void;
  onBack: () => void;
}

const TEMPLATES: ResumeTemplate[] = [
  {
    id: 'quick-glance',
    name: 'Quick Glance Impact',
    description: 'Front-loaded format that wins the 8-10 second scan. Your strongest content above the fold.',
    bestFor: ['Competitive markets', 'High-volume applicants', 'Senior professionals'],
    atsScore: 95,
    recommended: true,
    preview: 'quick-glance'
  },
  {
    id: 'chronological',
    name: 'Chronological',
    description: 'Classic format focusing on work history. Best for traditional industries.',
    bestFor: ['Linear career path', 'Same industry', 'Traditional employers'],
    atsScore: 98,
    preview: 'chronological'
  },
  {
    id: 'functional',
    name: 'Functional',
    description: 'Skills-based format that emphasizes abilities over timeline.',
    bestFor: ['Career changers', 'Employment gaps', 'Diverse experience'],
    atsScore: 85,
    preview: 'functional'
  },
  {
    id: 'combination',
    name: 'Combination',
    description: 'Hybrid format with skills summary followed by experience.',
    bestFor: ['Senior roles', 'Diverse skills', 'Complex background'],
    atsScore: 92,
    preview: 'combination'
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Premium format for C-suite and senior executives.',
    bestFor: ['VP+', 'C-Suite', 'Board positions'],
    atsScore: 90,
    preview: 'executive'
  }
];

function TemplatePreview({ template, state }: { template: ResumeTemplate; state: BenchmarkBuilderState }) {
  const role = state.detected.role || 'Candidate Name';
  
  if (template.id === 'quick-glance') {
    return (
      <div className="bg-white text-black p-6 rounded shadow-inner border-t-4 border-t-amber-500 text-xs">
        <div className="text-center border-b pb-2 mb-2">
          <p className="font-bold uppercase text-sm">{role}</p>
          <p className="text-gray-600 text-[10px]">email@example.com | (555) 123-4567</p>
        </div>
        <div className="space-y-2">
          <div className="bg-amber-50 p-1.5 rounded"><p className="font-bold text-amber-800 text-[10px]">SUMMARY</p><p className="text-gray-700 text-[9px]">Strategic leader with 15+ years...</p></div>
          <div><p className="font-bold border-b text-gray-800 text-[10px]">KEY COMPETENCIES</p>
            <div className="grid grid-cols-3 gap-1 mt-1 text-[8px] text-gray-600">
              <div>• Leadership</div><div>• Strategy</div><div>• P&L</div>
            </div>
          </div>
          <div className="bg-green-50 p-1.5 rounded border-l-2 border-green-500">
            <p className="font-bold text-green-800 text-[10px]">SELECTED ACCOMPLISHMENTS</p>
            <p className="text-[8px] text-gray-700">✓ Grew revenue 40%...</p>
          </div>
          <div><p className="font-bold border-b text-gray-800 text-[10px]">EXPERIENCE</p></div>
        </div>
      </div>
    );
  }
  
  if (template.id === 'chronological') {
    return (
      <div className="bg-white text-black p-6 rounded shadow-inner text-xs">
        <div className="text-center border-b pb-3 mb-3">
          <p className="font-bold uppercase text-sm">{role}</p>
          <p className="text-gray-600">email@example.com | (555) 123-4567</p>
        </div>
        <div className="space-y-3">
          <div><p className="font-bold border-b text-gray-800">SUMMARY</p><p className="text-gray-600 mt-1">Results-driven professional...</p></div>
          <div><p className="font-bold border-b text-gray-800">EXPERIENCE</p><p className="font-medium mt-1">Senior Role | Company</p><p className="text-gray-500">2020 - Present</p></div>
          <div><p className="font-bold border-b text-gray-800">SKILLS</p><p className="text-gray-600 mt-1">Skill 1, Skill 2, Skill 3</p></div>
        </div>
      </div>
    );
  }
  
  if (template.id === 'functional') {
    return (
      <div className="bg-white text-black p-6 rounded shadow-inner text-xs">
        <div className="text-center border-b pb-3 mb-3">
          <p className="font-bold uppercase text-sm">{role}</p>
          <p className="text-gray-600">email@example.com | (555) 123-4567</p>
        </div>
        <div className="space-y-3">
          <div><p className="font-bold border-b text-gray-800">KEY COMPETENCIES</p><div className="grid grid-cols-2 gap-1 mt-1 text-gray-600"><p>• Leadership</p><p>• Technical</p></div></div>
          <div><p className="font-bold border-b text-gray-800">ACHIEVEMENTS</p><ul className="list-disc ml-4 text-gray-600 mt-1"><li>Increased revenue 40%</li></ul></div>
          <div><p className="font-bold border-b text-gray-800">WORK HISTORY</p><p className="text-gray-600 mt-1">Company A | Company B</p></div>
        </div>
      </div>
    );
  }
  
  if (template.id === 'combination') {
    return (
      <div className="bg-white text-black p-6 rounded shadow-inner text-xs">
        <div className="text-center border-b pb-3 mb-3">
          <p className="font-bold uppercase text-sm">{role}</p>
          <p className="text-gray-600">email@example.com | (555) 123-4567</p>
        </div>
        <div className="space-y-3">
          <div className="bg-gray-100 p-2 rounded"><p className="font-bold text-gray-800">HIGHLIGHTS</p><p className="text-gray-600">15+ years experience...</p></div>
          <div><p className="font-bold border-b text-gray-800">EXPERIENCE</p><p className="font-medium mt-1">Title | Company</p></div>
          <div className="grid grid-cols-2 gap-2"><div><p className="font-bold text-gray-800">SKILLS</p></div><div><p className="font-bold text-gray-800">EDUCATION</p></div></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white text-black p-6 rounded shadow-inner border-t-4 border-t-blue-600 text-xs">
      <div className="border-b pb-3 mb-3">
        <p className="font-bold uppercase tracking-wide text-sm">{role}</p>
        <p className="text-blue-600 font-medium">Executive</p>
      </div>
      <div className="space-y-3">
        <div className="bg-blue-50 p-2 rounded"><p className="font-bold text-blue-800">EXECUTIVE PROFILE</p><p className="text-gray-700">Strategic leader...</p></div>
        <div><p className="font-bold border-b border-blue-200 text-blue-800">LEADERSHIP</p><p className="font-medium mt-1">CEO | Company</p></div>
        <div><p className="font-bold border-b border-blue-200 text-blue-800">BOARD</p><p className="text-gray-600 mt-1">Advisory roles...</p></div>
      </div>
    </div>
  );
}

export function TemplateSelectionStep({ state, onSelectTemplate, onBack }: TemplateSelectionStepProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ResumeTemplate | null>(null);

  const handlePreview = (template: ResumeTemplate) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const handleSelect = (template: ResumeTemplate) => {
    setSelectedTemplate(template.id);
    onSelectTemplate(template);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Choose Your Resume Format</h1>
          <p className="text-lg text-muted-foreground">Select a template that best showcases your experience</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEMPLATES.map((template) => (
            <Card
              key={template.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg hover:border-primary/50",
                selectedTemplate === template.id && "border-primary ring-2 ring-primary/20",
                template.recommended && "ring-2 ring-amber-500/30"
              )}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <CardContent className="pt-4">
                <div className="relative mb-4 bg-muted rounded-lg p-2 h-48 overflow-hidden">
                  <TemplatePreview template={template} state={state} />
                  {template.recommended && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-amber-500 gap-1"><Star className="h-3 w-3" />Recommended</Badge>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{template.name}</h3>
                    <Badge variant="outline" className="gap-1"><Cpu className="h-3 w-3" />ATS: {template.atsScore}%</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {template.bestFor.map((item) => (
                      <Badge key={item} variant="secondary" className="text-xs">{item}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={(e) => { e.stopPropagation(); handlePreview(template); }}>
                      <Eye className="h-3 w-3" />Preview
                    </Button>
                    <Button size="sm" className="flex-1 gap-1" onClick={(e) => { e.stopPropagation(); handleSelect(template); }}>
                      <CheckCircle2 className="h-3 w-3" />Select
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack} className="gap-2"><ArrowLeft className="h-4 w-4" />Back to Gap Analysis</Button>
          <p className="text-sm text-muted-foreground">Click any template to select it and continue</p>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{previewTemplate?.name} Template Preview</DialogTitle></DialogHeader>
          <div className="bg-muted p-4 rounded-lg">{previewTemplate && <TemplatePreview template={previewTemplate} state={state} />}</div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
            <Button onClick={() => { if (previewTemplate) handleSelect(previewTemplate); setPreviewOpen(false); }}>Use This Template</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
