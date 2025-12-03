/**
 * SectionTabs - Resume section navigation tabs
 * Shows progress and completion status for each section
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, FileText, Briefcase, Award, GraduationCap } from 'lucide-react';

export interface SectionTab {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

export const SECTION_TABS: SectionTab[] = [
  { id: 'summary', label: 'Summary', icon: FileText, description: 'Your elevator pitch in 3-4 sentences' },
  { id: 'experience', label: 'Experience', icon: Briefcase, description: 'Your work history with impact metrics' },
  { id: 'skills', label: 'Skills', icon: Award, description: 'Technical and soft skills for ATS' },
  { id: 'education', label: 'Education', icon: GraduationCap, description: 'Degrees, certifications, training' },
];

interface SectionTabsProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  completedSections: Set<string>;
}

export function SectionTabs({ 
  activeSection, 
  onSectionChange, 
  completedSections 
}: SectionTabsProps) {
  return (
    <div className="border-b px-4 py-2 bg-muted/30">
      <div className="flex items-center justify-between">
        <Tabs value={activeSection} onValueChange={onSectionChange}>
          <TabsList className="h-9">
            {SECTION_TABS.map(tab => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="gap-2 text-xs px-3"
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {completedSections.has(tab.id) && (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        <Badge variant="outline" className="text-xs">
          {completedSections.size}/{SECTION_TABS.length} Complete
        </Badge>
      </div>
    </div>
  );
}
