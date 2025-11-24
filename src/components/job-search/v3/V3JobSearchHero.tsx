import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Target, TrendingUp, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface V3JobSearchHeroProps {
  totalJobs: number;
  isSearching: boolean;
}

export function V3JobSearchHero({
  totalJobs,
  isSearching
}: V3JobSearchHeroProps) {
  const navigate = useNavigate();
  
  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-primary/5 border border-primary/20 rounded-lg p-8 md:p-12 mb-8">
      <Badge variant="outline" className="mb-4">AI-Powered Job Matching</Badge>
      
      <h1 className="text-4xl md:text-5xl font-bold mb-2">
        Find Your Next Role
      </h1>
      
      <p className="text-base max-w-3xl mb-8 leading-relaxed text-muted-foreground">
        Search thousands of jobs from multiple sources with intelligent filtering. 
        Our AI matches your Career Vault profile to relevant opportunities and 
        generates tailored resumes for each application.
      </p>
      
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/agents/career-trends-scout')}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Career Trends</h3>
                <p className="text-base text-muted-foreground">
                  Explore emerging roles and market insights
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/research-hub')}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Research Hub</h3>
                <p className="text-base text-muted-foreground">
                  Evidence-based career intelligence
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={isSearching ? "opacity-50" : ""}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">
                  {isSearching ? 'Searching...' : 'Results Found'}
                </h3>
                <p className="text-base text-muted-foreground">
                  {isSearching ? 'Finding matches' : `${totalJobs.toLocaleString()} jobs available`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
