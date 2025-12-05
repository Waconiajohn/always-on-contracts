/**
 * TemplateGallery - Full-page template browser with preview mode
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Check, 
  Star, 
  Eye, 
  Cpu, 
  ArrowRight,
  X,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResumeTemplate, TemplateId, DetectedInfo } from '../types';

const TEMPLATES: ResumeTemplate[] = [
  {
    id: 'executive',
    name: 'Executive',
    description: 'Bold leadership presence with strategic emphasis. Perfect for C-suite and senior management.',
    bestFor: ['C-Level', 'VP', 'Director', 'Senior Management'],
    atsScore: 94,
    recommended: true,
    features: ['Leadership-focused header', 'Strategic accomplishments', 'Board-ready format']
  },
  {
    id: 'modern',
    name: 'Modern Professional',
    description: 'Clean, contemporary design that balances creativity with professionalism.',
    bestFor: ['Mid-Level', 'Tech', 'Marketing', 'Creative'],
    atsScore: 96,
    features: ['Clean typography', 'Skills visualization', 'Progressive layout']
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional format trusted by Fortune 500 recruiters. Maximum ATS compatibility.',
    bestFor: ['Finance', 'Legal', 'Government', 'Enterprise'],
    atsScore: 99,
    features: ['Maximum ATS compatibility', 'Conservative styling', 'Proven format']
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Optimized for engineering and technical roles with emphasis on skills and projects.',
    bestFor: ['Engineering', 'IT', 'Data Science', 'Development'],
    atsScore: 97,
    features: ['Technical skills grid', 'Project highlights', 'Certifications focus']
  }
];

interface TemplateGalleryProps {
  detected: DetectedInfo;
  onSelect: (template: ResumeTemplate) => void;
  selectedTemplate?: ResumeTemplate | null;
}

export function TemplateGallery({ detected, onSelect, selectedTemplate }: TemplateGalleryProps) {
  const [previewTemplate, setPreviewTemplate] = useState<ResumeTemplate | null>(null);
  const [hoveredId, setHoveredId] = useState<TemplateId | null>(null);

  // Determine recommended template based on detected info
  const recommendedId = getRecommendedTemplate(detected);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Choose Your Template</h2>
          <p className="text-muted-foreground">
            Based on your {detected.level} {detected.role} profile, we recommend the{' '}
            <span className="font-medium text-primary">
              {TEMPLATES.find(t => t.id === recommendedId)?.name}
            </span>{' '}
            template
          </p>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TEMPLATES.map((template) => {
            const isRecommended = template.id === recommendedId;
            const isSelected = selectedTemplate?.id === template.id;
            const isHovered = hoveredId === template.id;

            return (
              <motion.div
                key={template.id}
                onMouseEnter={() => setHoveredId(template.id)}
                onMouseLeave={() => setHoveredId(null)}
                whileHover={{ y: -4 }}
                className="relative"
              >
                <Card className={cn(
                  "overflow-hidden transition-all duration-200 cursor-pointer",
                  isSelected && "ring-2 ring-primary",
                  isRecommended && !isSelected && "ring-1 ring-amber-400"
                )}>
                  {/* Recommended Badge */}
                  {isRecommended && (
                    <div className="absolute top-3 right-3 z-10">
                      <Badge className="bg-amber-500 text-white gap-1">
                        <Star className="h-3 w-3" />
                        Recommended
                      </Badge>
                    </div>
                  )}

                  {/* Template Preview Area */}
                  <div className="relative h-48 bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center group">
                    {/* Mock Resume Preview */}
                    <TemplatePreviewMock templateId={template.id} />
                    
                    {/* Hover Overlay */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3"
                        >
                          <Button
                            size="sm"
                            variant="secondary"
                            className="gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewTemplate(template);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            className="gap-1"
                            onClick={() => onSelect(template)}
                          >
                            <Check className="h-4 w-4" />
                            Select
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {/* Template Name & ATS Score */}
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <div className="flex items-center gap-1 text-sm">
                        <Cpu className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{template.atsScore}%</span>
                        <span className="text-muted-foreground text-xs">ATS</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground">{template.description}</p>

                    {/* Best For Tags */}
                    <div className="flex flex-wrap gap-1">
                      {template.bestFor.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Features */}
                    <div className="pt-2 border-t space-y-1">
                      {template.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="h-3 w-3 text-green-500" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    {/* Select Button */}
                    <Button 
                      className="w-full mt-2 gap-2"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => onSelect(template)}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-4 w-4" />
                          Selected
                        </>
                      ) : (
                        <>
                          Use This Template
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Full Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl h-[90vh] p-0">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {previewTemplate?.name} Template Preview
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewTemplate(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto p-6 bg-muted/30">
            {previewTemplate && (
              <FullTemplatePreview template={previewTemplate} detected={detected} />
            )}
          </div>

          <div className="p-4 border-t flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Cpu className="h-4 w-4 text-green-500" />
              <span>{previewTemplate?.atsScore}% ATS Compatible</span>
            </div>
            <Button onClick={() => {
              if (previewTemplate) onSelect(previewTemplate);
              setPreviewTemplate(null);
            }} className="gap-2">
              <Check className="h-4 w-4" />
              Use This Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper to get recommended template
function getRecommendedTemplate(detected: DetectedInfo): TemplateId {
  const level = detected.level.toLowerCase();
  const role = detected.role.toLowerCase();
  const industry = detected.industry.toLowerCase();

  if (level.includes('executive') || level.includes('c-') || level.includes('director') || level.includes('vp')) {
    return 'executive';
  }
  if (role.includes('engineer') || role.includes('developer') || role.includes('data') || role.includes('tech')) {
    return 'technical';
  }
  if (industry.includes('finance') || industry.includes('legal') || industry.includes('government')) {
    return 'classic';
  }
  return 'modern';
}

// Mini preview mock for grid
function TemplatePreviewMock({ templateId }: { templateId: TemplateId }) {
  const styles = {
    executive: 'bg-gradient-to-b from-slate-800 to-slate-700',
    modern: 'bg-gradient-to-b from-blue-600 to-blue-500',
    classic: 'bg-gradient-to-b from-gray-100 to-white',
    technical: 'bg-gradient-to-b from-emerald-700 to-emerald-600'
  };

  const headerStyle = {
    executive: 'text-white',
    modern: 'text-white',
    classic: 'text-gray-800',
    technical: 'text-white'
  };

  return (
    <div className="w-32 h-40 rounded shadow-lg overflow-hidden transform scale-100 transition-transform">
      {/* Header Section */}
      <div className={cn("p-2", styles[templateId])}>
        <div className={cn("text-[8px] font-bold", headerStyle[templateId])}>JOHN DOE</div>
        <div className={cn("text-[6px] opacity-80", headerStyle[templateId])}>Senior Professional</div>
      </div>
      
      {/* Content Mock */}
      <div className="p-2 bg-white space-y-1">
        <div className="h-1 w-full bg-gray-200 rounded" />
        <div className="h-1 w-4/5 bg-gray-200 rounded" />
        <div className="h-1 w-full bg-gray-100 rounded mt-2" />
        <div className="h-1 w-3/4 bg-gray-100 rounded" />
        <div className="h-1 w-5/6 bg-gray-100 rounded" />
        <div className="h-1 w-full bg-gray-100 rounded mt-2" />
        <div className="h-1 w-2/3 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

// Full template preview component
function FullTemplatePreview({ 
  template, 
  detected 
}: { 
  template: ResumeTemplate; 
  detected: DetectedInfo;
}) {
  const headerColors = {
    executive: 'bg-slate-800 text-white',
    modern: 'bg-blue-600 text-white',
    classic: 'bg-gray-100 text-gray-800 border-b-4 border-gray-300',
    technical: 'bg-emerald-700 text-white'
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
      {/* Resume Header */}
      <div className={cn("p-6", headerColors[template.id])}>
        <h1 className="text-2xl font-bold">Your Name Here</h1>
        <p className="text-lg opacity-90">{detected.role}</p>
        <p className="text-sm opacity-75 mt-1">
          email@example.com • (555) 123-4567 • LinkedIn
        </p>
      </div>

      {/* Resume Body */}
      <div className="p-6 space-y-6">
        {/* Summary */}
        <section>
          <h2 className={cn(
            "text-lg font-bold mb-2 pb-1 border-b-2",
            template.id === 'executive' && "border-slate-800",
            template.id === 'modern' && "border-blue-500",
            template.id === 'classic' && "border-gray-300",
            template.id === 'technical' && "border-emerald-600"
          )}>
            Professional Summary
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Results-driven {detected.level} {detected.role} with extensive experience in the {detected.industry} industry. 
            Proven track record of delivering strategic initiatives and driving measurable business outcomes.
            Known for building high-performance teams and fostering cross-functional collaboration.
          </p>
        </section>

        {/* Experience */}
        <section>
          <h2 className={cn(
            "text-lg font-bold mb-2 pb-1 border-b-2",
            template.id === 'executive' && "border-slate-800",
            template.id === 'modern' && "border-blue-500",
            template.id === 'classic' && "border-gray-300",
            template.id === 'technical' && "border-emerald-600"
          )}>
            Professional Experience
          </h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{detected.role}</h3>
                  <p className="text-sm text-gray-500">Major Corporation Inc.</p>
                </div>
                <span className="text-sm text-gray-500">2020 - Present</span>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Led cross-functional team of 15+ members to deliver $2.5M project under budget</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Implemented strategic initiatives resulting in 35% operational efficiency improvement</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Established partnerships with key stakeholders driving 40% revenue growth</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Skills */}
        <section>
          <h2 className={cn(
            "text-lg font-bold mb-2 pb-1 border-b-2",
            template.id === 'executive' && "border-slate-800",
            template.id === 'modern' && "border-blue-500",
            template.id === 'classic' && "border-gray-300",
            template.id === 'technical' && "border-emerald-600"
          )}>
            {template.id === 'technical' ? 'Technical Skills' : 'Core Competencies'}
          </h2>
          
          <div className="flex flex-wrap gap-2">
            {['Strategic Planning', 'Team Leadership', 'Project Management', 'Data Analysis', 'Stakeholder Relations'].map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
