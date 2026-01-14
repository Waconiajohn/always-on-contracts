import { Badge } from "@/components/ui/badge";

interface V3JobSearchHeroProps {
  totalJobs: number;
  isSearching: boolean;
}

export function V3JobSearchHero({
  totalJobs,
  isSearching
}: V3JobSearchHeroProps) {
  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-primary/5 border border-primary/20 rounded-lg p-8 md:p-12 mb-8">
      <Badge variant="outline" className="mb-4">AI-Powered Job Matching</Badge>
      
      <h1 className="text-4xl md:text-5xl font-bold mb-4">
        Find Your Next Role
      </h1>
      
      <p className="text-base max-w-3xl leading-relaxed text-muted-foreground">
        Search thousands of jobs from multiple sources with intelligent filtering. 
        Our AI matches your Master Resume profile to relevant opportunities and 
        generates tailored resumes for each application.
      </p>
      
      {!isSearching && totalJobs > 0 && (
        <p className="text-sm text-muted-foreground mt-4">
          {totalJobs.toLocaleString()} jobs available
        </p>
      )}
    </div>
  );
}
