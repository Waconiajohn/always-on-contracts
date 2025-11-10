import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import type { VaultData } from "@/hooks/useVaultData";
import type { VaultStats } from "@/hooks/useVaultStats";

interface Layer1FoundationsCardProps {
  vaultData: VaultData | undefined;
  stats: VaultStats | null;
  onSectionClick: (section: string) => void;
  onReextract?: () => void;
}

interface SectionStatus {
  name: string;
  percentage: number;
  status: 'complete' | 'incomplete' | 'empty';
  count: number;
  benchmark?: string;
  ctaText: string;
  section: string;
}

export const Layer1FoundationsCard = ({ vaultData, stats, onSectionClick, onReextract }: Layer1FoundationsCardProps) => {
  if (!vaultData || !stats) return null;

  const calculateSectionStatus = (): SectionStatus[] => {
    const powerPhrasesCount = stats.categoryCounts.powerPhrases;
    const skillsCount = stats.categoryCounts.transferableSkills;
    
    // Check if we have career context data or resume text (indicates work experience exists)
    const hasCareerContext = vaultData.careerContext?.industries?.length > 0 || 
                            vaultData.careerContext?.specializations?.length > 0;
    const hasResumeText = vaultData.vault?.resume_raw_text && 
                         vaultData.vault.resume_raw_text.length > 500;
    
    // Work Experience - based on power phrases with metrics
    // If no power phrases but we have resume text, extraction is incomplete
    const workExpPercentage = powerPhrasesCount > 0 
      ? Math.min((powerPhrasesCount / 10) * 100, 100) 
      : 0;
    
    // Skills & Expertise - based on transferable skills
    const skillsPercentage = skillsCount > 0 
      ? Math.min((skillsCount / 15) * 100, 100) 
      : 0;
    
    // Education & Credentials - check career context for education data
    const hasEducation = hasCareerContext && vaultData.vault?.auto_populated;
    const educationPercentage = hasEducation ? 100 : 0;
    
    // Professional Highlights - based on gold-tier items
    const goldCount = stats.qualityDistribution.gold || 0;
    const highlightsPercentage = goldCount > 0 
      ? Math.min((goldCount / 5) * 100, 100) 
      : 0;

    // Determine if extraction is incomplete (have resume but missing data)
    const extractionIncomplete = hasResumeText && (powerPhrasesCount === 0 || stats.categoryCounts.softSkills === 0);

    return [
      {
        name: 'Work Experience',
        percentage: workExpPercentage,
        status: workExpPercentage >= 80 ? 'complete' : workExpPercentage > 0 ? 'incomplete' : 'empty',
        count: powerPhrasesCount,
        benchmark: extractionIncomplete
          ? '⚠️ Extraction incomplete - some data is missing from your resume'
          : powerPhrasesCount === 0 
          ? 'Upload your resume to extract work experience automatically'
          : 'Industry standard: 60%+ of bullets should have metrics',
        ctaText: extractionIncomplete ? 'Complete Extraction' : powerPhrasesCount === 0 ? 'Upload Resume' : workExpPercentage >= 80 ? 'Review' : 'Add Details',
        section: 'work-experience'
      },
      {
        name: 'Skills & Expertise',
        percentage: skillsPercentage,
        status: skillsPercentage >= 80 ? 'complete' : skillsPercentage > 0 ? 'incomplete' : 'empty',
        count: skillsCount,
        benchmark: 'Target: 15+ relevant skills for your role',
        ctaText: skillsPercentage >= 80 ? 'Add More' : 'Start Building',
        section: 'skills'
      },
      {
        name: 'Education & Credentials',
        percentage: educationPercentage,
        status: educationPercentage === 100 ? 'complete' : 'empty',
        count: hasEducation ? 1 : 0,
        benchmark: '65% of senior roles require bachelor\'s degree',
        ctaText: educationPercentage === 100 ? 'View' : 'Add Education',
        section: 'education'
      },
      {
        name: 'Professional Highlights',
        percentage: highlightsPercentage,
        status: highlightsPercentage >= 60 ? 'complete' : highlightsPercentage > 0 ? 'incomplete' : 'empty',
        count: goldCount,
        benchmark: 'High performers have 2+ recognition events per 3 years',
        ctaText: highlightsPercentage >= 60 ? 'View' : 'Add Now',
        section: 'highlights'
      }
    ];
  };

  const sections = calculateSectionStatus();
  const overallCompletion = Math.round(
    sections.reduce((sum, s) => sum + s.percentage, 0) / sections.length
  );

  const getStatusIcon = (status: SectionStatus['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'incomplete':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'empty':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getPrioritySection = () => {
    return sections.find(s => s.status === 'empty') || sections.find(s => s.status === 'incomplete');
  };

  const prioritySection = getPrioritySection();

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center justify-between">
          <span>LAYER 1: Resume Foundations</span>
          <span className="text-sm font-normal text-muted-foreground">
            {overallCompletion}% complete
          </span>
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          What hiring managers expect to see. We're building a complete picture of your professional value.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map((section) => (
          <div key={section.section} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(section.status)}
                <span className="font-medium">{section.name}</span>
                <span className="text-sm text-muted-foreground">
                  {section.count > 0 ? `(${section.count} items)` : '(0 items)'}
                </span>
              </div>
               <Button 
                variant={section.status === 'empty' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  // If extraction is incomplete (have resume but missing data), trigger full re-extraction
                  if (section.ctaText === 'Complete Extraction' && onReextract) {
                    onReextract();
                  } else {
                    onSectionClick(section.section);
                  }
                }}
              >
                {section.ctaText}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  section.status === 'complete' ? 'bg-green-500' :
                  section.status === 'incomplete' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${section.percentage}%` }}
              />
            </div>
            
            {/* Benchmark */}
            <p className="text-xs text-muted-foreground pl-7">
              {section.benchmark}
            </p>
          </div>
        ))}

        {prioritySection && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border/50">
            <p className="text-sm font-medium mb-2">🎯 Next Priority</p>
            <p className="text-sm text-muted-foreground mb-3">
              Complete "{prioritySection.name}" to improve your positioning against industry standards.
            </p>
            <Button 
              onClick={() => onSectionClick(prioritySection.section)}
              className="w-full"
            >
              {prioritySection.ctaText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="mt-4 p-3 bg-primary/5 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Benchmark:</strong> You have {overallCompletion}% of typical senior-level resume details. 
            Industry target is 80%+ completion.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
