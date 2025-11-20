import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Calendar, Award } from "lucide-react";
import { format } from "date-fns";

interface Education {
  id: string;
  institution_name: string;
  degree_type?: string;
  degree_name?: string | null;
  field_of_study?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  graduation_year?: number | null;
  is_in_progress?: boolean | null;
  gpa?: number | null;
  honors?: string | null;
  relevant_coursework?: string[] | null;
  thesis_title?: string | null;
  description?: string | null;
}

interface EducationTimelineProps {
  education: Education[];
}

export function EducationTimeline({ education }: EducationTimelineProps) {
  if (education.length === 0) {
    return null;
  }

  const sortedEducation = [...education].sort((a, b) => {
    const dateA = a.end_date || a.start_date || '0';
    const dateB = b.end_date || b.start_date || '0';
    return dateB.localeCompare(dateA);
  });

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <GraduationCap className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Education</h3>
        <Badge variant="secondary" className="ml-auto">
          {education.length} {education.length === 1 ? 'Degree' : 'Degrees'}
        </Badge>
      </div>

      <div className="space-y-4">
        {sortedEducation.map((edu, index) => (
          <div 
            key={edu.id}
            className={`relative pl-6 ${index !== sortedEducation.length - 1 ? 'pb-4 border-l-2 border-border' : ''}`}
          >
            <div className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-primary" />
            
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h4 className="font-semibold">{edu.institution_name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {edu.degree_type || edu.degree_name} {edu.field_of_study && `in ${edu.field_of_study}`}
                  </p>
                </div>
                {edu.is_in_progress && (
                  <Badge variant="default">Current</Badge>
                )}
              </div>

              {(edu.start_date || edu.end_date) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {edu.start_date && format(new Date(edu.start_date), 'MMM yyyy')}
                    {' - '}
                    {edu.is_in_progress ? 'Present' : edu.end_date ? format(new Date(edu.end_date), 'MMM yyyy') : edu.graduation_year || 'N/A'}
                  </span>
                </div>
              )}

              {edu.gpa && (
                <p className="text-sm text-muted-foreground mb-2">GPA: {edu.gpa}</p>
              )}

              {edu.honors && (
                <div className="mb-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Award className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium">Honors:</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {edu.honors}
                  </Badge>
                </div>
              )}

              {edu.relevant_coursework && edu.relevant_coursework.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1">Relevant Coursework:</p>
                  <div className="flex flex-wrap gap-1">
                    {edu.relevant_coursework.slice(0, 5).map((course, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {course}
                      </Badge>
                    ))}
                    {edu.relevant_coursework.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{edu.relevant_coursework.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
