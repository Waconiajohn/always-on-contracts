/**
 * LiveResumePreview - Real-time resume preview component
 * Shows the actual resume content with active section highlighting
 */

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { BenchmarkBuilderState } from '../types';

interface LiveResumePreviewProps {
  state: BenchmarkBuilderState;
  activeSection: string;
  sectionContent: Record<string, string>;
}

export function LiveResumePreview({ 
  state, 
  activeSection, 
  sectionContent 
}: LiveResumePreviewProps) {
  const getSectionContent = (section: string, fallback: string) => {
    return sectionContent[section]?.trim() || fallback;
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
          Live Preview
        </h3>
        <div className="bg-white text-black rounded-lg shadow-lg p-8 min-h-[600px] font-serif">
          {/* Resume Header */}
          <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
            <h1 className="text-2xl font-bold uppercase tracking-wider">
              {state.detected.role || 'Your Name'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              email@example.com | (555) 123-4567 | City, State | linkedin.com/in/profile
            </p>
          </div>

          {/* Professional Summary */}
          <section className={cn(
            "mb-6 transition-all duration-200",
            activeSection === 'summary' && "ring-2 ring-primary rounded-lg p-3 bg-primary/5 -mx-3"
          )}>
            <h2 className="text-sm font-bold uppercase border-b border-gray-400 pb-1 mb-3 tracking-wide">
              Professional Summary
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              {getSectionContent('summary', 
                `Results-driven ${state.detected.role || 'professional'} with extensive experience in ${state.detected.industry || 'your industry'}. Proven track record of delivering measurable business outcomes and driving strategic initiatives.`
              )}
            </p>
          </section>

          {/* Professional Experience */}
          <section className={cn(
            "mb-6 transition-all duration-200",
            activeSection === 'experience' && "ring-2 ring-primary rounded-lg p-3 bg-primary/5 -mx-3"
          )}>
            <h2 className="text-sm font-bold uppercase border-b border-gray-400 pb-1 mb-3 tracking-wide">
              Professional Experience
            </h2>
            <div className="mb-4">
              <div className="flex justify-between items-baseline">
                <p className="text-sm font-semibold">Senior {state.detected.role || 'Professional'}</p>
                <p className="text-xs text-gray-500">2020 - Present</p>
              </div>
              <p className="text-xs text-gray-600 italic mb-2">Company Name | City, State</p>
              <div className="text-sm text-gray-700">
                {sectionContent.experience ? (
                  <p className="whitespace-pre-wrap">{sectionContent.experience}</p>
                ) : (
                  <ul className="list-disc ml-4 space-y-1">
                    <li>Led strategic initiatives resulting in measurable business impact</li>
                    <li>Managed cross-functional teams and stakeholder relationships</li>
                    <li>Implemented process improvements driving operational excellence</li>
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* Skills */}
          <section className={cn(
            "mb-6 transition-all duration-200",
            activeSection === 'skills' && "ring-2 ring-primary rounded-lg p-3 bg-primary/5 -mx-3"
          )}>
            <h2 className="text-sm font-bold uppercase border-b border-gray-400 pb-1 mb-3 tracking-wide">
              Core Competencies
            </h2>
            <p className="text-sm text-gray-700">
              {getSectionContent('skills',
                'Leadership • Strategic Planning • Project Management • Cross-functional Collaboration • Data Analysis • Process Improvement • Stakeholder Management • Team Development'
              )}
            </p>
          </section>

          {/* Education */}
          <section className={cn(
            "mb-6 transition-all duration-200",
            activeSection === 'education' && "ring-2 ring-primary rounded-lg p-3 bg-primary/5 -mx-3"
          )}>
            <h2 className="text-sm font-bold uppercase border-b border-gray-400 pb-1 mb-3 tracking-wide">
              Education
            </h2>
            <p className="text-sm text-gray-700">
              {getSectionContent('education',
                'Master of Business Administration | University Name | 2018\nBachelor of Science in Business | University Name | 2014'
              )}
            </p>
          </section>
        </div>
      </div>
    </ScrollArea>
  );
}
