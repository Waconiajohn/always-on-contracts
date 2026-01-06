import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Briefcase, 
  TrendingUp, 
  Award, 
  Lightbulb, 
  Users, 
  Target, 
  Edit2,
  Save,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CareerAnalysis {
  id?: string;
  years_experience: number;
  industries: string[];
  leadership_roles: string[];
  areas_of_expertise: string[];
  technical_skills: string[];
  soft_skills: string[];
  career_trajectory: string;
  unique_value_proposition: string;
  seniority_level: string;
}

interface CareerAnalysisDashboardProps {
  analysis: CareerAnalysis;
  onEdit?: (field: string, value: any) => void;
  editable?: boolean;
  className?: string;
}

export function CareerAnalysisDashboard({
  analysis,
  onEdit,
  editable = false,
  className
}: CareerAnalysisDashboardProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [localValues, setLocalValues] = useState<Record<string, any>>({});

  const handleEdit = (field: string) => {
    setEditing(field);
    setLocalValues(prev => ({
      ...prev,
      [field]: analysis[field as keyof CareerAnalysis],
    }));
  };

  const handleSave = (field: string) => {
    onEdit?.(field, localValues[field]);
    setEditing(null);
  };

  const handleCancel = () => {
    setEditing(null);
    setLocalValues({});
  };

  const renderEditableField = (
    field: string,
    label: string,
    icon: React.ReactNode,
    iconBgColor: string,
    isArray: boolean = false
  ) => {
    const value = analysis[field as keyof CareerAnalysis];
    const isEditing = editing === field;

    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn("rounded-lg p-2", iconBgColor)}>
                {icon}
              </div>
              <h3 className="font-semibold text-foreground">{label}</h3>
            </div>
            {editable && !isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(field)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                className="w-full text-sm"
                value={
                  isArray && Array.isArray(localValues[field])
                    ? localValues[field].join(', ')
                    : localValues[field] || ''
                }
                onChange={(e) =>
                  setLocalValues(prev => ({
                    ...prev,
                    [field]: isArray
                      ? e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      : e.target.value,
                  }))
                }
                rows={3}
                placeholder={isArray ? "Enter items separated by commas" : "Enter value..."}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleSave(field)}>
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {isArray && Array.isArray(value) ? (
                <div className="flex flex-wrap gap-2">
                  {value.length > 0 ? (
                    value.map((item, index) => {
                      const displayText = typeof item === 'object' && item !== null
                        ? ((item as any).title || (item as any).name || JSON.stringify(item))
                        : String(item);
                      return (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {displayText}
                        </Badge>
                      );
                    })
                  ) : (
                    <span className="text-muted-foreground italic">Not specified</span>
                  )}
                </div>
              ) : (
                <p className={value ? 'text-foreground' : 'text-muted-foreground italic'}>
                  {String(value) || 'Not specified'}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Career Profile Analysis</h2>
          <p className="text-muted-foreground">
            Review and refine how the AI understands your professional background. Make edits to
            ensure your optimized resume accurately reflects your experience.
          </p>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary/10 rounded-lg p-2">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Experience</h3>
            </div>
            <p className="text-2xl font-bold text-primary">
              {analysis.years_experience || 0} years
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-accent/20 rounded-lg p-2">
                <TrendingUp className="w-5 h-5 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">Seniority</h3>
            </div>
            <p className="text-lg font-semibold text-accent-foreground capitalize">
              {analysis.seniority_level || 'Not specified'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-green-500/10 rounded-lg p-2">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-foreground">Industries</h3>
            </div>
            <p className="text-lg font-semibold text-green-600">
              {analysis.industries?.length || 0} industries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Editable Fields Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderEditableField(
          'industries',
          'Industries',
          <Target className="w-5 h-5 text-primary" />,
          'bg-primary/10',
          true
        )}

        {renderEditableField(
          'leadership_roles',
          'Leadership Roles',
          <Users className="w-5 h-5 text-violet-600" />,
          'bg-violet-100 dark:bg-violet-900/30',
          true
        )}

        {renderEditableField(
          'areas_of_expertise',
          'Areas of Expertise',
          <Award className="w-5 h-5 text-green-600" />,
          'bg-green-100 dark:bg-green-900/30',
          true
        )}

        {renderEditableField(
          'technical_skills',
          'Technical Skills',
          <Lightbulb className="w-5 h-5 text-orange-600" />,
          'bg-orange-100 dark:bg-orange-900/30',
          true
        )}

        {renderEditableField(
          'soft_skills',
          'Soft Skills',
          <Users className="w-5 h-5 text-pink-600" />,
          'bg-pink-100 dark:bg-pink-900/30',
          true
        )}
      </div>

      {/* Full Width Fields */}
      <div className="space-y-4">
        {renderEditableField(
          'career_trajectory',
          'Career Trajectory',
          <TrendingUp className="w-5 h-5 text-primary" />,
          'bg-primary/10',
          false
        )}

        {renderEditableField(
          'unique_value_proposition',
          'Unique Value Proposition',
          <Award className="w-5 h-5 text-violet-600" />,
          'bg-violet-100 dark:bg-violet-900/30',
          false
        )}
      </div>

      {/* Edit Tip */}
      {editable && (
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <span className="font-semibold">Tip:</span> Click the edit icon to modify any field.
              Your changes will be used to optimize your resume more accurately.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CareerAnalysisDashboard;
