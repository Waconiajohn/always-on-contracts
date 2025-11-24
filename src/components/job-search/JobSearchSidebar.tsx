import React from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, BookOpen } from 'lucide-react';
import { SearchAnalyticsWidget } from './SearchAnalyticsWidget';
import { BooleanBuilderTool } from './v2/BooleanBuilderTool';
import { useNavigate } from 'react-router-dom';

interface JobSearchSidebarProps {
  userId?: string | null;
  booleanString?: string;
  setBooleanString?: (value: string) => void;
}

export const JobSearchSidebar: React.FC<JobSearchSidebarProps> = ({
  userId,
  booleanString = '',
  setBooleanString
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      {/* Boolean Builder - at top */}
      {setBooleanString && (
        <>
          <div>
            <h3 className="text-sm font-semibold mb-3">AI Boolean Search</h3>
            <BooleanBuilderTool 
              booleanString={booleanString}
              setBooleanString={setBooleanString}
            />
          </div>
          <Separator />
        </>
      )}

      {/* Explore Career Intelligence - More Prominent */}
      <div className="space-y-4">
        <h3 className="text-base font-bold">Explore Career Intelligence</h3>
        
        <Card 
          onClick={() => navigate('/agents/career-trends-scout')}
          className="p-5 cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200 bg-gradient-to-br from-primary/5 to-primary/10"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/20 shrink-0">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-base mb-2">Career Trends Scout</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Discover emerging roles, skills in demand, and market insights powered by AI
              </p>
            </div>
          </div>
        </Card>
        
        <Card 
          onClick={() => navigate('/research-hub')}
          className="p-5 cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200 bg-gradient-to-br from-secondary/5 to-secondary/10"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-secondary/20 shrink-0">
              <BookOpen className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-base mb-2">Research Hub</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Access evidence-based career intelligence and industry research
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Separator />

      {/* Analytics Widget */}
      <SearchAnalyticsWidget userId={userId || null} />
    </div>
  );
};
