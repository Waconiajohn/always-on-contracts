import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Building2, Mail, ExternalLink, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { safeValidateInput, invokeEdgeFunction, PerplexityResearchSchema } from '@/lib/edgeFunction';

interface AgencyMatcherPanelProps {
  userId: string;
  targetRoles?: string[];
  industries?: string[];
}

interface Agency {
  id: string;
  name: string;
  specialization: string[];
  location: string;
  contactEmail?: string;
  website?: string;
  matchScore: number;
}

export const AgencyMatcherPanel = ({ targetRoles = [], industries = [] }: AgencyMatcherPanelProps) => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    findMatchingAgencies();
  }, [targetRoles, industries]);

  const findMatchingAgencies = async () => {
    setIsLoading(true);
    try {
      // Use Perplexity research to find relevant agencies
      const validation = safeValidateInput(PerplexityResearchSchema, {
        research_type: 'company_research',
        query_params: {
          targetRoles: targetRoles.join(', '),
          industries: industries.join(', '),
          location: 'United States',
          query: `Find top recruiting agencies specializing in ${targetRoles.join(', ')} roles in ${industries.join(', ')} industries`
        }
      });

      if (!validation.success) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await invokeEdgeFunction(
        'perplexity-research',
        validation.data
      );

      if (error) throw error;

      // Parse the response to extract agency information
      if (data.success && data.results) {
        const parsedAgencies = parseAgencyResults(data.results);
        setAgencies(parsedAgencies);
      }
    } catch (error) {
      // Error already handled by invokeEdgeFunction
    } finally {
      setIsLoading(false);
    }
  };

  const parseAgencyResults = (perplexityResponse: string): Agency[] => {
    const agencies: Agency[] = [];
    
    // Split by numbered list items (e.g., "1. Agency Name")
    const sections = perplexityResponse.split(/\d+\.\s+\*\*/).filter(s => s.trim());
    
    sections.forEach((section, index) => {
      const lines = section.split('\n').filter(l => l.trim());
      if (lines.length === 0) return;
      
      // Extract agency name (first line, remove ** markdown)
      const name = lines[0]?.replace(/\*\*/g, '').split(':')[0].trim() || `Agency ${index + 1}`;
      
      // Extract fields using regex patterns
      const specialization = section.match(/Specialization[:\s]+([^\n]+)/i)?.[1]?.trim() || 'General';
      const location = section.match(/Location[:\s]+([^\n]+)/i)?.[1]?.trim() || 'Various';
      const contact = section.match(/Contact[:\s]+([^\n]+)/i)?.[1]?.trim() || '';
      const website = section.match(/Website[:\s]+([^\n]+)/i)?.[1]?.trim() || '';
      
      agencies.push({
        id: `agency-${index + 1}`,
        name,
        specialization: specialization.split(',').map(s => s.trim()),
        location,
        contactEmail: contact,
        website,
        matchScore: 85 - (index * 5)
      });
    });
    
    return agencies.length > 0 ? agencies.slice(0, 6) : [];
  };

  const filteredAgencies = agencies.filter(agency =>
    agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agency.specialization.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Finding matching agencies...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Agency Matcher</CardTitle>
          <CardDescription>
            Recruiting agencies that specialize in your target roles and industries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={findMatchingAgencies} variant="outline">
              <Loader2 className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {targetRoles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Matching for:</span>
              {targetRoles.map((role, idx) => (
                <Badge key={idx} variant="secondary">{role}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredAgencies.map((agency) => (
          <Card key={agency.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{agency.name}</CardTitle>
                    <CardDescription>{agency.location}</CardDescription>
                  </div>
                </div>
                <Badge variant={agency.matchScore > 90 ? 'default' : 'secondary'}>
                  {agency.matchScore}% Match
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Specializations</p>
                <div className="flex flex-wrap gap-2">
                  {agency.specialization.map((spec, idx) => (
                    <Badge key={idx} variant="outline">{spec}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                {agency.contactEmail && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${agency.contactEmail}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Contact
                    </a>
                  </Button>
                )}
                {agency.website && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={agency.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Visit Site
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredAgencies.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No agencies found. Try adjusting your target roles or industries.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
