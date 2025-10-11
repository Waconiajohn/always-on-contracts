import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

interface SearchProfile {
  id: string;
  profile_name: string;
  is_active: boolean | null;
  target_positions: string[] | null;
  target_industries: string[] | null;
  required_skills: string[] | null;
  preferred_skills: string[] | null;
  excluded_keywords: string[] | null;
  excluded_companies: string[] | null;
  min_hourly_rate: number | null;
  max_hourly_rate: number | null;
  min_contract_months: number | null;
  max_contract_months: number | null;
  remote_only: boolean | null;
  hybrid_acceptable: boolean | null;
  onsite_acceptable: boolean | null;
  preferred_locations: string[] | null;
  company_size_preferences: string[] | null;
  minimum_match_score: number | null;
}

interface SearchProfileCardProps {
  profile: SearchProfile;
  onEdit: (profile: SearchProfile) => void;
  onDelete: (id: string) => void;
  onToggleActive: (profile: SearchProfile) => void;
}

export function SearchProfileCard({ 
  profile, 
  onEdit, 
  onDelete, 
  onToggleActive 
}: SearchProfileCardProps) {
  return (
    <Card className={profile.is_active ? "border-primary" : ""}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {profile.profile_name}
              {profile.is_active && <Badge>Active</Badge>}
            </CardTitle>
            <CardDescription>
              {(profile.target_positions ?? []).length} positions • {(profile.required_skills ?? []).length} skills
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(profile.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Rate Range</p>
          <p className="text-sm text-muted-foreground">
            ${profile.min_hourly_rate ?? '—'}/hr - ${profile.max_hourly_rate ?? '—'}/hr
          </p>
        </div>

        {profile.target_positions && profile.target_positions.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Target Positions</p>
            <div className="flex flex-wrap gap-1">
              {profile.target_positions.slice(0, 3).map((pos, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {pos}
                </Badge>
              ))}
              {profile.target_positions.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{profile.target_positions.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onEdit(profile)}
          >
            Edit
          </Button>
          <Button
            variant={profile.is_active ? "secondary" : "default"}
            className="flex-1"
            onClick={() => onToggleActive(profile)}
          >
            {profile.is_active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
