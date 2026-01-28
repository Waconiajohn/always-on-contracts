import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeftRight,
  FileText,
  Briefcase,
  GraduationCap,
  Lightbulb,
} from 'lucide-react';
import type { RBKeywordDecision } from '@/types/resume-builder';

interface Requirement {
  id: string;
  category: string;
  requirement_text: string;
  priority: number;
  is_matched?: boolean;
  exact_phrases?: string[];
}

interface JDComparisonViewProps {
  resumeSections: {
    summary?: string;
    skills?: string[];
    experience?: Array<{
      title: string;
      company: string;
      dates?: string;
      bullets?: string[];
    }>;
    education?: Array<{
      degree: string;
      school: string;
      year?: string;
    }>;
  } | null;
  requirements: Requirement[];
  keywords: RBKeywordDecision[];
}

type SectionFilter = 'all' | 'summary' | 'skills' | 'experience' | 'education';

export function JDComparisonView({ resumeSections, requirements, keywords }: JDComparisonViewProps) {
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('all');
  const [showOnlyUnmet, setShowOnlyUnmet] = useState(false);

  // Build keyword map for highlighting
  const keywordMap = useMemo(() => {
    const map = new Map<string, { status: 'matched' | 'partial' | 'missing'; decision?: string }>();

    keywords.forEach(kw => {
      const status = kw.decision === 'add' ? 'matched' :
                    kw.decision === 'not_true' || kw.decision === 'ignore' ? 'missing' : 'partial';
      map.set(kw.keyword.toLowerCase(), { status, decision: kw.decision || undefined });
    });

    return map;
  }, [keywords]);

  // Categorize requirements by section
  const categorizedRequirements = useMemo(() => {
    const categories: Record<string, Requirement[]> = {
      'Hard Skills': [],
      'Tools & Tech': [],
      'Experience': [],
      'Education': [],
      'Soft Skills': [],
      'Other': [],
    };

    requirements.forEach(req => {
      const cat = req.category || 'Other';
      if (cat.toLowerCase().includes('skill') && !cat.toLowerCase().includes('soft')) {
        categories['Hard Skills'].push(req);
      } else if (cat.toLowerCase().includes('tool') || cat.toLowerCase().includes('tech')) {
        categories['Tools & Tech'].push(req);
      } else if (cat.toLowerCase().includes('experience') || cat.toLowerCase().includes('responsib')) {
        categories['Experience'].push(req);
      } else if (cat.toLowerCase().includes('education') || cat.toLowerCase().includes('cert')) {
        categories['Education'].push(req);
      } else if (cat.toLowerCase().includes('soft')) {
        categories['Soft Skills'].push(req);
      } else {
        categories['Other'].push(req);
      }
    });

    return categories;
  }, [requirements]);

  // Filter requirements based on section
  const filteredRequirements = useMemo(() => {
    let reqs = requirements;

    if (showOnlyUnmet) {
      reqs = reqs.filter(r => !r.is_matched);
    }

    if (sectionFilter === 'all') return reqs;

    const sectionMapping: Record<SectionFilter, string[]> = {
      all: [],
      summary: ['soft', 'general'],
      skills: ['skill', 'tool', 'tech'],
      experience: ['experience', 'responsib', 'outcome', 'metric'],
      education: ['education', 'cert', 'degree'],
    };

    const patterns = sectionMapping[sectionFilter];
    return reqs.filter(r =>
      patterns.some(p => (r.category || '').toLowerCase().includes(p))
    );
  }, [requirements, sectionFilter, showOnlyUnmet]);

  // Highlight text with keyword matches
  const highlightText = (text: string) => {
    if (!text) return null;

    const words = text.split(/(\s+)/);
    return words.map((word, i) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = keywordMap.get(cleanWord);

      if (match) {
        const className = match.status === 'matched'
          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-0.5 rounded'
          : match.status === 'partial'
          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-0.5 rounded'
          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-0.5 rounded line-through';

        return <span key={i} className={className}>{word}</span>;
      }
      return word;
    });
  };

  // Calculate match statistics
  const stats = useMemo(() => {
    const total = requirements.length;
    const matched = requirements.filter(r => r.is_matched).length;
    const critical = requirements.filter(r => r.priority > 8).length;
    const criticalMatched = requirements.filter(r => r.priority > 8 && r.is_matched).length;

    return {
      total,
      matched,
      unmet: total - matched,
      matchRate: total > 0 ? Math.round((matched / total) * 100) : 0,
      critical,
      criticalMatched,
      criticalRate: critical > 0 ? Math.round((criticalMatched / critical) * 100) : 0,
    };
  }, [requirements]);

  if (!resumeSections) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle className="text-lg mb-2">No Resume Data</CardTitle>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Upload your resume to see a side-by-side comparison with job requirements.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Resume vs Job Description</CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.matchRate}%</p>
                <p className="text-xs text-muted-foreground">Overall Match</p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.criticalRate}%</p>
                <p className="text-xs text-muted-foreground">Critical Match</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>{stats.matched} matched</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-red-600" />
              <span>{stats.unmet} unmet</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>{stats.critical - stats.criticalMatched} critical gaps</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={sectionFilter} onValueChange={(v) => setSectionFilter(v as SectionFilter)}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Filter by section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            <SelectItem value="summary">Summary Focus</SelectItem>
            <SelectItem value="skills">Skills & Tools</SelectItem>
            <SelectItem value="experience">Experience</SelectItem>
            <SelectItem value="education">Education & Certs</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={showOnlyUnmet ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowOnlyUnmet(!showOnlyUnmet)}
        >
          {showOnlyUnmet ? 'Showing Gaps Only' : 'Show All'}
        </Button>
      </div>

      {/* Side-by-side Comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* Resume Side */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/50 py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Your Resume
            </CardTitle>
            <CardDescription className="text-xs">
              Highlighted terms show keyword matches
            </CardDescription>
          </CardHeader>
          <ScrollArea className="h-[500px]">
            <CardContent className="p-4 space-y-4">
              {/* Summary */}
              {(sectionFilter === 'all' || sectionFilter === 'summary') && resumeSections.summary && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <Lightbulb className="h-3 w-3" />
                    Summary
                  </h4>
                  <p className="text-sm leading-relaxed">
                    {highlightText(resumeSections.summary)}
                  </p>
                </div>
              )}

              {/* Skills */}
              {(sectionFilter === 'all' || sectionFilter === 'skills') && resumeSections.skills && resumeSections.skills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeSections.skills.map((skill, i) => {
                      const match = keywordMap.get(skill.toLowerCase());
                      return (
                        <Badge
                          key={i}
                          variant={match?.status === 'matched' ? 'default' : 'outline'}
                          className={`text-xs ${
                            match?.status === 'matched'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-300'
                              : ''
                          }`}
                        >
                          {skill}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Experience */}
              {(sectionFilter === 'all' || sectionFilter === 'experience') && resumeSections.experience && resumeSections.experience.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <Briefcase className="h-3 w-3" />
                    Experience
                  </h4>
                  {resumeSections.experience.map((exp, i) => (
                    <div key={i} className="space-y-1.5 pb-3 border-b last:border-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{exp.title}</p>
                          <p className="text-xs text-muted-foreground">{exp.company}</p>
                        </div>
                        {exp.dates && (
                          <span className="text-xs text-muted-foreground">{exp.dates}</span>
                        )}
                      </div>
                      {exp.bullets && exp.bullets.length > 0 && (
                        <ul className="space-y-1 mt-1.5">
                          {exp.bullets.slice(0, 4).map((bullet, bi) => (
                            <li key={bi} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-primary mt-1">•</span>
                              <span>{highlightText(bullet)}</span>
                            </li>
                          ))}
                          {exp.bullets.length > 4 && (
                            <li className="text-xs text-muted-foreground italic">
                              +{exp.bullets.length - 4} more bullets
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Education */}
              {(sectionFilter === 'all' || sectionFilter === 'education') && resumeSections.education && resumeSections.education.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                    <GraduationCap className="h-3 w-3" />
                    Education
                  </h4>
                  {resumeSections.education.map((edu, i) => (
                    <div key={i} className="flex items-start justify-between">
                      <div>
                        <p className="text-sm">{highlightText(edu.degree)}</p>
                        <p className="text-xs text-muted-foreground">{edu.school}</p>
                      </div>
                      {edu.year && (
                        <span className="text-xs text-muted-foreground">{edu.year}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>

        {/* Requirements Side */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/50 py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Job Requirements
            </CardTitle>
            <CardDescription className="text-xs">
              {filteredRequirements.length} requirements • {filteredRequirements.filter(r => r.is_matched).length} matched
            </CardDescription>
          </CardHeader>
          <ScrollArea className="h-[500px]">
            <CardContent className="p-4 space-y-3">
              {Object.entries(categorizedRequirements).map(([category, reqs]) => {
                const filtered = reqs.filter(r => {
                  if (showOnlyUnmet && r.is_matched) return false;
                  if (sectionFilter === 'all') return true;
                  // Apply section filter logic
                  return filteredRequirements.includes(r);
                });

                if (filtered.length === 0) return null;

                return (
                  <div key={category} className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                      {category}
                    </h4>
                    <div className="space-y-1.5">
                      {filtered.map((req) => (
                        <div
                          key={req.id}
                          className={`flex items-start gap-2 p-2 rounded-lg text-sm ${
                            req.is_matched
                              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                              : req.priority > 8
                              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                              : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {req.is_matched ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                          ) : req.priority > 8 ? (
                            <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs">{req.requirement_text}</p>
                            {req.exact_phrases && req.exact_phrases.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {req.exact_phrases.slice(0, 3).map((phrase, i) => (
                                  <Badge key={i} variant="outline" className="text-[10px] px-1 py-0">
                                    {phrase}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          {req.priority > 8 && (
                            <Badge variant="destructive" className="text-[10px] shrink-0">
                              Critical
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </ScrollArea>
        </Card>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30 border border-green-300" />
          <span>Matched</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300" />
          <span>Pending Review</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-300" />
          <span>Missing/Critical Gap</span>
        </div>
      </div>
    </div>
  );
}
