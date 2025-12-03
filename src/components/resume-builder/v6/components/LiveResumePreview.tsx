/**
 * LiveResumePreview - Real-time resume preview component
 * Shows actual resume content with active section highlighting
 */

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { BenchmarkBuilderState } from '../types';
import type { ResumePreviewData } from '@/hooks/useResumePreviewData';
import { format } from 'date-fns';

interface LiveResumePreviewProps {
  state: BenchmarkBuilderState;
  activeSection: string;
  sectionContent: Record<string, string>;
  previewData?: ResumePreviewData;
}

export function LiveResumePreview({ 
  state, 
  activeSection, 
  sectionContent,
  previewData
}: LiveResumePreviewProps) {
  const getSectionContent = (section: string, fallback: string) => {
    return sectionContent[section]?.trim() || fallback;
  };

  // Format date string
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Present';
    try {
      return format(new Date(dateStr), 'MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  // Get contact info from previewData or fallback
  const contactInfo = previewData?.contactInfo;
  const workExperience = previewData?.workExperience || [];
  const education = previewData?.education || [];
  const skills = previewData?.skills || [];

  // Determine display name
  const displayName = contactInfo?.name || state.detected.role || 'Your Name';
  const displayEmail = contactInfo?.email || 'email@example.com';
  const displayPhone = contactInfo?.phone || '(555) 123-4567';
  const displayLocation = contactInfo?.location || 'City, State';
  const displayLinkedin = contactInfo?.linkedin ? `linkedin.com/in/${contactInfo.linkedin.split('/').pop()}` : 'linkedin.com/in/profile';

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
              {displayName}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {displayEmail} | {displayPhone} | {displayLocation} | {displayLinkedin}
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
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
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
            
            {sectionContent.experience ? (
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {sectionContent.experience}
              </div>
            ) : workExperience.length > 0 ? (
              workExperience.slice(0, 3).map((job, index) => (
                <div key={job.id} className={cn("mb-4", index > 0 && "mt-4")}>
                  <div className="flex justify-between items-baseline">
                    <p className="text-sm font-semibold">{job.title}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(job.startDate)} - {job.isCurrent ? 'Present' : formatDate(job.endDate)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 italic mb-2">
                    {job.company}{job.location ? ` | ${job.location}` : ''}
                  </p>
                  {job.milestones.length > 0 ? (
                    <ul className="list-disc ml-4 space-y-1 text-sm text-gray-700">
                      {job.milestones.slice(0, 4).map((milestone, i) => (
                        <li key={i}>{milestone}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Add achievements for this role</p>
                  )}
                </div>
              ))
            ) : (
              <div className="mb-4">
                <div className="flex justify-between items-baseline">
                  <p className="text-sm font-semibold">Senior {state.detected.role || 'Professional'}</p>
                  <p className="text-xs text-gray-500">2020 - Present</p>
                </div>
                <p className="text-xs text-gray-600 italic mb-2">Company Name | City, State</p>
                <ul className="list-disc ml-4 space-y-1 text-sm text-gray-700">
                  <li>Led strategic initiatives resulting in measurable business impact</li>
                  <li>Managed cross-functional teams and stakeholder relationships</li>
                  <li>Implemented process improvements driving operational excellence</li>
                </ul>
              </div>
            )}
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
                skills.length > 0 
                  ? skills.join(' • ')
                  : 'Leadership • Strategic Planning • Project Management • Cross-functional Collaboration • Data Analysis • Process Improvement • Stakeholder Management • Team Development'
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
            {sectionContent.education ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {sectionContent.education}
              </p>
            ) : education.length > 0 ? (
              education.map((edu) => (
                <div key={edu.id} className="mb-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{edu.degree}</span>
                    {edu.field && ` in ${edu.field}`}
                    {' | '}
                    {edu.institution}
                    {edu.graduationYear && ` | ${edu.graduationYear}`}
                    {edu.honors && ` | ${edu.honors}`}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-700">
                Master of Business Administration | University Name | 2018{'\n'}
                Bachelor of Science in Business | University Name | 2014
              </p>
            )}
          </section>
        </div>
      </div>
    </ScrollArea>
  );
}
