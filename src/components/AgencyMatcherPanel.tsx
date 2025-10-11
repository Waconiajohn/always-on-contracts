import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { agency } from "@/lib/mcp-client";
import { Building2, Star, Phone, Mail, ExternalLink, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface AgencyMatcherPanelProps {
  userId: string;
  targetRoles?: string[];
  industries?: string[];
}

export const AgencyMatcherPanel = ({ userId, targetRoles = [], industries = [] }: AgencyMatcherPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<any>(null);
  const [agencyDetails, setAgencyDetails] = useState<any>(null);
  const [outreachNotes, setOutreachNotes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (targetRoles.length > 0 || industries.length > 0) {
      findMatches();
    }
  }, [targetRoles, industries]);

  const findMatches = async () => {
    setLoading(true);
    try {
      const result = await agency.matchAgencies(userId, targetRoles, industries);
      setMatches(result.data || []);
      toast({
        title: "Agencies Found",
        description: `Found ${result.data?.length || 0} matching agencies`,
      });
    } catch (error: any) {
      toast({
        title: "Error finding agencies",
        description: error.message || "Failed to find matching agencies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const viewAgencyDetails = async (agencyId: string) => {
    setLoading(true);
    try {
      const result = await agency.getAgencyInsights(agencyId);
      setAgencyDetails(result.data);
    } catch (error: any) {
      toast({
        title: "Error loading details",
        description: error.message || "Failed to load agency details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const trackOutreach = async (agencyId: string, outreachType: string) => {
    try {
      await agency.trackOutreach(userId, agencyId, outreachType, outreachNotes);
      toast({
        title: "Outreach Tracked",
        description: "Your outreach has been recorded",
      });
      setOutreachNotes("");
      setSelectedAgency(null);
    } catch (error: any) {
      toast({
        title: "Error tracking outreach",
        description: error.message || "Failed to track outreach",
        variant: "destructive",
      });
    }
  };

  const submitRating = async (agencyId: string, rating: number) => {
    try {
      await agency.rateAgency(userId, agencyId, rating);
      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback!",
      });
      await findMatches(); // Refresh matches
    } catch (error: any) {
      toast({
        title: "Error submitting rating",
        description: error.message || "Failed to submit rating",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Agency Matcher
          </h2>
          <p className="text-muted-foreground">
            Find staffing agencies that match your career goals
          </p>
        </div>
        <Button onClick={findMatches} disabled={loading}>
          {loading ? "Searching..." : "Refresh Matches"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {matches.map((match) => (
          <Card key={match.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {match.agency_name}
                    {match.match_score > 50 && (
                      <Badge variant="default">
                        {match.match_score}% Match
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {match.location || 'Location not specified'}
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAgency(match);
                        viewAgencyDetails(match.id);
                      }}
                    >
                      Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{match.agency_name}</DialogTitle>
                      <DialogDescription>Agency Details & Contact Information</DialogDescription>
                    </DialogHeader>
                    {agencyDetails && selectedAgency?.id === match.id && (
                      <div className="space-y-4">
                        {agencyDetails.specialization && (
                          <div>
                            <Label className="text-sm font-semibold">Specializations:</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {agencyDetails.specialization.map((spec: string, i: number) => (
                                <Badge key={i} variant="secondary">{spec}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          {agencyDetails.contact_email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <a href={`mailto:${agencyDetails.contact_email}`} className="text-sm hover:underline">
                                {agencyDetails.contact_email}
                              </a>
                            </div>
                          )}
                          {agencyDetails.contact_phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <a href={`tel:${agencyDetails.contact_phone}`} className="text-sm hover:underline">
                                {agencyDetails.contact_phone}
                              </a>
                            </div>
                          )}
                          {agencyDetails.website && (
                            <div className="flex items-center gap-2 col-span-2">
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                              <a href={agencyDetails.website} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
                                Visit Website
                              </a>
                            </div>
                          )}
                        </div>

                        {agencyDetails.average_rating > 0 && (
                          <div className="flex items-center gap-2">
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{agencyDetails.average_rating.toFixed(1)}</span>
                            <span className="text-sm text-muted-foreground">
                              ({agencyDetails.total_ratings} reviews)
                            </span>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="outreach-notes">Track Outreach:</Label>
                          <Textarea
                            id="outreach-notes"
                            value={outreachNotes}
                            onChange={(e) => setOutreachNotes(e.target.value)}
                            placeholder="Add notes about your outreach..."
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button onClick={() => trackOutreach(match.id, 'email')} size="sm">
                              <Mail className="h-4 w-4 mr-2" />
                              Email Sent
                            </Button>
                            <Button onClick={() => trackOutreach(match.id, 'phone')} size="sm" variant="outline">
                              <Phone className="h-4 w-4 mr-2" />
                              Called
                            </Button>
                            <Button onClick={() => trackOutreach(match.id, 'linkedin')} size="sm" variant="outline">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              LinkedIn
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {match.specialization && match.specialization.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {match.specialization.slice(0, 3).map((spec: string, i: number) => (
                    <Badge key={i} variant="outline">{spec}</Badge>
                  ))}
                  {match.specialization.length > 3 && (
                    <Badge variant="outline">+{match.specialization.length - 3} more</Badge>
                  )}
                </div>
              )}

              {match.typical_rate_min && match.typical_rate_max && (
                <div className="text-sm text-muted-foreground">
                  Typical Rate: ${match.typical_rate_min}-${match.typical_rate_max}/hr
                </div>
              )}

              <div className="flex gap-2 items-center text-sm">
                <span className="text-muted-foreground">Rate this agency:</span>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => submitRating(match.id, rating)}
                    className="hover:scale-110 transition-transform"
                  >
                    <Star className="h-4 w-4 text-yellow-400 hover:fill-yellow-400" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {matches.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Matches Yet</h3>
            <p className="text-muted-foreground">
              Complete your profile with target roles and industries to find matching agencies
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
