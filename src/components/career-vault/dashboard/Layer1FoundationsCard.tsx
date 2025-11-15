import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import type { VaultData } from "@/hooks/useVaultData";
import type { VaultStats } from "@/hooks/useVaultStats";

interface Layer1FoundationsCardProps {
  vaultData: VaultData | undefined;
  stats: VaultStats | null;
  benchmark: any; // AI-generated benchmark from career_vault.benchmark_standard
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

export const Layer1FoundationsCard = ({ vaultData, stats, benchmark, onSectionClick, onReextract }: Layer1FoundationsCardProps) => {
  if (!vaultData || !stats) return null;

  // Extract AI-generated benchmarks (with fallbacks for when benchmark isn't ready)
  const aiBenchmark = benchmark?.layer1_foundations || null;

  const calculateSectionStatus = (): SectionStatus[] => {
    const powerPhrasesCount = stats.categoryCounts.powerPhrases;
    const skillsCount = stats.categoryCounts.transferableSkills;
    
    // Check if we have resume text (indicates work experience exists)
    const hasResumeText = vaultData.vault?.resume_raw_text && 
                         vaultData.vault.resume_raw_text.length > 500;
    
    // Check for education data in career_vault (stored as JSON fields by V3)
    const hasEducation = (
      vaultData.vault?.formal_education && 
      Array.isArray(vaultData.vault.formal_education) && 
      vaultData.vault.formal_education.length > 0
    ) || (
      vaultData.vault?.certifications && 
      Array.isArray(vaultData.vault.certifications) && 
      vaultData.vault.certifications.length > 0
    );
    
    // Use AI benchmarks if available, otherwise fallback to simple calculations
    const workExpTarget = aiBenchmark?.work_experience?.target || 10;
    const skillsTarget = aiBenchmark?.skills?.target || 15;
    const highlightsTarget = aiBenchmark?.highlights?.target || 5;

    // Work Experience - based on power phrases with metrics
    const workExpPercentage = powerPhrasesCount > 0 
      ? Math.min((powerPhrasesCount / workExpTarget) * 100, 100) 
      : 0;
    
    // Skills & Expertise - based on transferable skills
    const skillsPercentage = skillsCount > 0 
      ? Math.min((skillsCount / skillsTarget) * 100, 100) 
      : 0;
    
    // Education & Credentials - based on extracted education data
    const educationPercentage = hasEducation ? 100 : 0;
    
    // Professional Highlights - based on gold-tier items
    const goldCount = stats.qualityDistribution.gold || 0;
    const highlightsPercentage = goldCount > 0 
      ? Math.min((goldCount / highlightsTarget) * 100, 100) 
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
    <Card className="layer-1-foundations border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center justify-between">
          <span>Your Resume Essentials</span>
          <span className="text-sm font-normal text-muted-foreground">
            {overallCompletion}% complete
          </span>
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          What hiring managers expect to see on every resume.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map((section) => (
          <div key={section.section} className="space-y-2 group">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(section.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm sm:text-base">{section.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {section.count > 0 ? `${section.count} items` : 'Empty'}
                    </span>
                  </div>
                  {/* Inline education - always visible */}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    💡 {section.benchmark}
                  </p>
                </div>
              </div>
               <Button 
                variant={section.status === 'empty' ? 'default' : 'outline'}
                size="sm"
                className="w-full sm:w-auto shrink-0"
                onClick={() => {
                  if (section.ctaText === 'Complete Extraction' && onReextract) {
                    onReextract();
                  } else {
                    onSectionClick(section.section);
                  }
                }}
                aria-label={`${section.ctaText} for ${section.name}`}
              >
                {section.ctaText}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            {/* Simplified progress bar */}
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ease-out ${
                  section.status === 'complete' ? 'bg-green-500' :
                  section.status === 'incomplete' ? 'bg-blue-500' :
                  'bg-amber-500'
                }`}
                style={{ width: `${section.percentage}%` }}
                role="progressbar"
                aria-valuenow={section.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${section.name} completion: ${section.percentage}%`}
              />
            </div>
          </div>
        ))}

        {/* Empty state - only show if all sections are empty */}
        {sections.every(s => s.status === 'empty') && (
          <div className="mt-6 p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20 text-center">
            <div className="text-4xl mb-3">📄</div>
            <h3 className="text-lg font-semibold mb-2">Let's Build Your Resume Foundation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your resume to automatically extract your work experience, skills, and education. 
              This takes about 2 minutes.
            </p>
            <Button 
              onClick={() => onSectionClick('work-experience')}
              size="lg"
              className="w-full sm:w-auto"
            >
              Upload Resume
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Priority action - only show if some sections exist */}
        {prioritySection && !sections.every(s => s.status === 'empty') && (
          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🎯</div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Next Priority</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Complete "{prioritySection.name}" to match industry standards for your role level.
                </p>
                <Button 
                  onClick={() => onSectionClick(prioritySection.section)}
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  {prioritySection.ctaText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
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
