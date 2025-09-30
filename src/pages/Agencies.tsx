import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Building, Globe, Mail, Phone, CheckCircle, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const AgenciesContent = () => {
  const [agencies, setAgencies] = useState<any[]>([]);
  const [filteredAgencies, setFilteredAgencies] = useState<any[]>([]);
  const [suggestedAgencies, setSuggestedAgencies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [trackedAgencies, setTrackedAgencies] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [userIndustries, setUserIndustries] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResumeAnalysis();
    fetchAgencies();
    fetchTrackedAgencies();
  }, []);

  const fetchResumeAnalysis = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: analysis } = await supabase
        .from("resume_analysis")
        .select("industry_expertise")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (analysis?.industry_expertise) {
        setUserIndustries(analysis.industry_expertise);
      }
    } catch (error) {
      console.error("Error fetching resume analysis:", error);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const filtered = agencies.filter(agency =>
        agency.agency_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.specialization?.some((spec: string) =>
          spec.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        agency.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAgencies(filtered);
    } else {
      setFilteredAgencies(agencies);
    }

    // Calculate suggested agencies based on user's industry expertise
    if (userIndustries.length > 0 && agencies.length > 0) {
      const suggested = agencies
        .map(agency => {
          const matchScore = agency.specialization?.filter((spec: string) =>
            userIndustries.some(industry =>
              spec.toLowerCase().includes(industry.toLowerCase()) ||
              industry.toLowerCase().includes(spec.toLowerCase())
            )
          ).length || 0;
          return { ...agency, matchScore };
        })
        .filter(agency => agency.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);
      
      setSuggestedAgencies(suggested);
    }
  }, [searchTerm, agencies, userIndustries]);

  const fetchAgencies = async () => {
    try {
      const { data, error } = await supabase
        .from("staffing_agencies")
        .select("*")
        .order("agency_name");

      if (error) throw error;
      setAgencies(data || []);
      setFilteredAgencies(data || []);
    } catch (error) {
      console.error("Error fetching agencies:", error);
      toast({
        title: "Error",
        description: "Failed to load staffing agencies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackedAgencies = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("outreach_tracking")
        .select("agency_id")
        .eq("user_id", session.user.id);

      if (error) throw error;
      
      const tracked = new Set(data?.map(item => item.agency_id).filter(Boolean));
      setTrackedAgencies(tracked);
    } catch (error) {
      console.error("Error fetching tracked agencies:", error);
    }
  };

  const handleTrackAgency = async (agencyId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (trackedAgencies.has(agencyId)) {
        toast({
          title: "Already tracking",
          description: "This agency is already in your outreach list",
        });
        return;
      }

      const { error } = await supabase
        .from("outreach_tracking")
        .insert({
          user_id: session.user.id,
          agency_id: agencyId,
          outreach_type: "email",
          status: "pending",
        });

      if (error) throw error;

      setTrackedAgencies(new Set([...trackedAgencies, agencyId]));
      toast({
        title: "Agency added",
        description: "Added to your outreach tracking list",
      });
    } catch (error) {
      console.error("Error tracking agency:", error);
      toast({
        title: "Error",
        description: "Failed to add agency",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading agencies...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" size="lg" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-6 w-6" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Staffing Agencies Database</h1>
            <p className="text-xl text-muted-foreground">
              200+ recruiting firms specializing in interim executive and contract placements
            </p>
            {userIndustries.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">
                  Your expertise: <span className="font-medium">{userIndustries.join(", ")}</span>
                </p>
              </div>
            )}
          </div>

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, specialization, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-lg h-12"
                />
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Total Agencies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{agencies.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{trackedAgencies.size}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Suggested</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{suggestedAgencies.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Showing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{filteredAgencies.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* AI Suggested Agencies */}
          {suggestedAgencies.length > 0 && (
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  Recommended for Your Profile
                </CardTitle>
                <CardDescription className="text-lg">
                  Based on your resume analysis, these agencies match your expertise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {suggestedAgencies.map((agency) => (
                    <Card key={agency.id} className="bg-muted">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                              <Building className="h-5 w-5 text-primary" />
                              {agency.agency_name}
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {agency.specialization?.map((spec: string) => (
                                <Badge key={spec} variant="secondary">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                            {agency.location && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Globe className="h-4 w-4" />
                                {agency.location}
                              </p>
                            )}
                          </div>
                          <Badge className="bg-primary">
                            Match
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleTrackAgency(agency.id)}
                            disabled={trackedAgencies.has(agency.id)}
                            className="flex-1"
                          >
                            {trackedAgencies.has(agency.id) ? "Already Tracking" : "Track This Agency"}
                          </Button>
                          {agency.website && (
                            <Button
                              variant="outline"
                              onClick={() => window.open(agency.website, '_blank')}
                            >
                              <Globe className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Agencies List */}
          <div className="space-y-4">
            {filteredAgencies.map((agency) => (
              <Card key={agency.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl flex items-center gap-3 mb-2">
                        <Building className="h-6 w-6 text-primary" />
                        {agency.agency_name}
                        {trackedAgencies.has(agency.id) && (
                          <Badge variant="secondary" className="ml-2">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Tracking
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-lg">
                        <div className="flex items-center gap-2 mt-2">
                          <Globe className="h-4 w-4" />
                          {agency.location}
                        </div>
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => handleTrackAgency(agency.id)}
                      disabled={trackedAgencies.has(agency.id)}
                      variant={trackedAgencies.has(agency.id) ? "outline" : "default"}
                    >
                      {trackedAgencies.has(agency.id) ? "Tracking" : "Track Agency"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Specializations */}
                  {agency.specialization && (
                    <div>
                      <h4 className="font-semibold mb-2">Specializations:</h4>
                      <div className="flex flex-wrap gap-2">
                        {agency.specialization.map((spec: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                    {agency.contact_email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <a
                          href={`mailto:${agency.contact_email}`}
                          className="hover:text-primary hover:underline"
                        >
                          {agency.contact_email}
                        </a>
                      </div>
                    )}
                    {agency.contact_phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{agency.contact_phone}</span>
                      </div>
                    )}
                    {agency.website && (
                      <div className="flex items-center gap-2 text-muted-foreground md:col-span-2">
                        <Globe className="h-4 w-4" />
                        <a
                          href={agency.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary hover:underline"
                        >
                          {agency.website}
                        </a>
                      </div>
                    )}
                  </div>

                  {agency.notes && (
                    <div className="pt-4 border-t">
                      <p className="text-muted-foreground">{agency.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAgencies.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-xl text-muted-foreground">
                  No agencies found matching your search
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

const Agencies = () => {
  return (
    <ProtectedRoute>
      <AgenciesContent />
    </ProtectedRoute>
  );
};

export default Agencies;
