import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { agency } from "@/lib/mcp-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ArrowLeft, Search, Building, Globe, Mail, Phone, CheckCircle, TrendingUp, 
  MessageSquare, Calendar, ExternalLink, Copy, Check, Trash2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchTemplateVariables, populateTemplate, generateMailtoLink, fetchUserTemplates } from "@/lib/templateService";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface OutreachRecord {
  id: string;
  status: string;
  outreach_type: string | null;
  notes: string | null;
  last_contact_date: string;
  created_at: string;
}

const AgenciesContent = () => {
  const [agencies, setAgencies] = useState<any[]>([]);
  const [filteredAgencies, setFilteredAgencies] = useState<any[]>([]);
  const [suggestedAgencies, setSuggestedAgencies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [trackedAgencies, setTrackedAgencies] = useState<Map<string, OutreachRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const [userIndustries, setUserIndustries] = useState<string[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [currentAgency, setCurrentAgency] = useState<any>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [expandedAgency, setExpandedAgency] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResumeAnalysis();
    fetchAgencies();
    fetchTrackedAgencies();
    fetchTemplates();
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

  const fetchTemplates = async () => {
    try {
      const templates = await fetchUserTemplates();
      setTemplates(templates);
    } catch (error: any) {
      toast({
        title: "Error loading templates",
        description: error.message,
        variant: "destructive",
      });
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
        .select("*")
        .eq("user_id", session.user.id);

      if (error) throw error;
      
      const trackedMap = new Map();
      data?.forEach(record => {
        trackedMap.set(record.agency_id, record);
      });
      setTrackedAgencies(trackedMap);
    } catch (error) {
      console.error("Error fetching tracked agencies:", error);
    }
  };

  const handleTrackAgency = async (agencyId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (trackedAgencies.has(agencyId)) {
        return;
      }

      // Use MCP agency matcher to track outreach
      await agency.trackOutreach(
        session.user.id,
        agencyId,
        'email',
        'Initial outreach tracking'
      );

      await fetchTrackedAgencies();
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

  const handleUpdateOutreach = async (agencyId: string, updates: Partial<OutreachRecord>) => {
    try {
      const record = trackedAgencies.get(agencyId);
      if (!record) return;

      const { error } = await supabase
        .from("outreach_tracking")
        .update({
          ...updates,
          last_contact_date: new Date().toISOString(),
        })
        .eq("id", record.id);

      if (error) throw error;

      await fetchTrackedAgencies();
      toast({
        title: "Updated",
        description: "Outreach record updated successfully",
      });
    } catch (error) {
      console.error("Error updating outreach:", error);
      toast({
        title: "Error",
        description: "Failed to update record",
        variant: "destructive",
      });
    }
  };

  const handleRemoveTracking = async (agencyId: string) => {
    try {
      const record = trackedAgencies.get(agencyId);
      if (!record) return;

      const { error } = await supabase
        .from("outreach_tracking")
        .delete()
        .eq("id", record.id);

      if (error) throw error;

      await fetchTrackedAgencies();
      toast({
        title: "Removed",
        description: "Agency removed from tracking",
      });
    } catch (error) {
      console.error("Error removing tracking:", error);
      toast({
        title: "Error",
        description: "Failed to remove agency",
        variant: "destructive",
      });
    }
  };

  const handleTemplateSelect = async (template: any, agency: any) => {
    setCurrentAgency(agency);
    setSelectedTemplate(template);
    setTemplateDialogOpen(true);
  };

  const handleSendTemplate = async () => {
    if (!selectedTemplate || !currentAgency) return;

    const variables = await fetchTemplateVariables(currentAgency.id);
    
    if (selectedTemplate.template_type === 'email' && currentAgency.contact_email) {
      const mailtoLink = generateMailtoLink(
        currentAgency.contact_email,
        selectedTemplate.subject_line || '',
        selectedTemplate.body_content,
        variables
      );
      window.location.href = mailtoLink;
      
      // Update outreach tracking
      if (trackedAgencies.has(currentAgency.id)) {
        await handleUpdateOutreach(currentAgency.id, {
          outreach_type: 'email',
          status: 'contacted',
        });
      } else {
        await handleTrackAgency(currentAgency.id);
      }
    } else {
      const populatedContent = populateTemplate(selectedTemplate.body_content, variables);
      navigator.clipboard.writeText(populatedContent);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
      
      toast({
        title: "Copied!",
        description: "Template copied to clipboard",
      });
    }
    
    setTemplateDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "contacted":
        return "default";
      case "responded":
        return "outline";
      case "interview":
        return "default";
      default:
        return "secondary";
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
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Staffing Agencies</h1>
            <p className="text-xl text-muted-foreground">
              200+ recruiting firms with integrated outreach tracking
            </p>
            {userIndustries.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">
                  Your expertise: <span className="font-medium">{userIndustries.join(", ")}</span>
                </p>
              </div>
            )}
          </div>

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
                    <AgencyCard 
                      key={agency.id} 
                      agency={agency}
                      outreach={trackedAgencies.get(agency.id)}
                      templates={templates}
                      onTrack={handleTrackAgency}
                      onUpdateOutreach={handleUpdateOutreach}
                      onRemoveTracking={handleRemoveTracking}
                      onTemplateSelect={handleTemplateSelect}
                      isExpanded={expandedAgency === agency.id}
                      onToggleExpand={() => setExpandedAgency(expandedAgency === agency.id ? null : agency.id)}
                      isRecommended
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {filteredAgencies.map((agency) => (
              <AgencyCard 
                key={agency.id} 
                agency={agency}
                outreach={trackedAgencies.get(agency.id)}
                templates={templates}
                onTrack={handleTrackAgency}
                onUpdateOutreach={handleUpdateOutreach}
                onRemoveTracking={handleRemoveTracking}
                onTemplateSelect={handleTemplateSelect}
                isExpanded={expandedAgency === agency.id}
                onToggleExpand={() => setExpandedAgency(expandedAgency === agency.id ? null : agency.id)}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate?.template_type === 'email' ? 'Send Email' : 'Copy Template'}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.template_type === 'email' 
                ? 'This will open your email client with the populated template'
                : 'Copy this template to use in your communication'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTemplate && (
              <>
                <div>
                  <h4 className="font-semibold mb-2">{selectedTemplate.template_name}</h4>
                  {selectedTemplate.subject_line && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Subject: {selectedTemplate.subject_line}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSendTemplate} className="flex-1">
                    {selectedTemplate.template_type === 'email' ? (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Open Email Client
                      </>
                    ) : (
                      <>
                        {copiedText ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        {copiedText ? 'Copied!' : 'Copy to Clipboard'}
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface AgencyCardProps {
  agency: any;
  outreach?: OutreachRecord;
  templates: any[];
  onTrack: (id: string) => void;
  onUpdateOutreach: (id: string, updates: Partial<OutreachRecord>) => void;
  onRemoveTracking: (id: string) => void;
  onTemplateSelect: (template: any, agency: any) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isRecommended?: boolean;
}

const AgencyCard = ({ 
  agency, 
  outreach, 
  templates,
  onTrack, 
  onUpdateOutreach,
  onRemoveTracking,
  onTemplateSelect,
  isExpanded,
  onToggleExpand,
  isRecommended 
}: AgencyCardProps) => {
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    status: outreach?.status || 'pending',
    outreach_type: outreach?.outreach_type || '',
    notes: outreach?.notes || '',
  });

  const emailTemplates = templates.filter(t => t.template_type === 'email');
  const linkedinTemplates = templates.filter(t => t.template_type === 'linkedin');
  const phoneTemplates = templates.filter(t => t.template_type === 'phone');

  return (
    <Card className={`hover:shadow-lg transition-shadow ${isRecommended ? 'bg-muted' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl flex items-center gap-3 mb-2">
              <Building className="h-6 w-6 text-primary" />
              {agency.agency_name}
              {outreach && (
                <Badge variant={outreach.status as any} className="ml-2">
                  {outreach.status}
                </Badge>
              )}
              {isRecommended && (
                <Badge className="bg-primary">Recommended</Badge>
              )}
            </CardTitle>
            <CardDescription className="text-lg">
              <div className="flex items-center gap-2 mt-2">
                <Globe className="h-4 w-4" />
                {agency.location}
              </div>
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {outreach ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveTracking(agency.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleExpand}
                >
                  {isExpanded ? 'Collapse' : 'Expand'}
                </Button>
              </>
            ) : (
              <Button onClick={() => onTrack(agency.id)}>
                Track Agency
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {/* Quick Actions for Tracked Agencies */}
        {outreach && (
          <div className="pt-4 border-t space-y-4">
            <div className="flex flex-wrap gap-2">
              {emailTemplates.length > 0 && agency.contact_email && (
                <Select onValueChange={(value) => {
                  const template = templates.find(t => t.id === value);
                  if (template) onTemplateSelect(template, agency);
                }}>
                  <SelectTrigger className="w-[200px]">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>Email Template</span>
                  </SelectTrigger>
                  <SelectContent>
                    {emailTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.template_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {linkedinTemplates.length > 0 && (
                <Select onValueChange={(value) => {
                  const template = templates.find(t => t.id === value);
                  if (template) onTemplateSelect(template, agency);
                }}>
                  <SelectTrigger className="w-[200px]">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <span>LinkedIn Template</span>
                  </SelectTrigger>
                  <SelectContent>
                    {linkedinTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.template_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {phoneTemplates.length > 0 && (
                <Select onValueChange={(value) => {
                  const template = templates.find(t => t.id === value);
                  if (template) onTemplateSelect(template, agency);
                }}>
                  <SelectTrigger className="w-[200px]">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>Phone Script</span>
                  </SelectTrigger>
                  <SelectContent>
                    {phoneTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.template_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Outreach Details</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                  >
                    {editMode ? 'Cancel' : 'Edit'}
                  </Button>
                </div>

                {editMode ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Status</label>
                      <Select
                        value={editData.status}
                        onValueChange={(value) => setEditData({ ...editData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="responded">Responded</SelectItem>
                          <SelectItem value="interview">Interview Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Outreach Type</label>
                      <Select
                        value={editData.outreach_type}
                        onValueChange={(value) => setEditData({ ...editData, outreach_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="in-person">In Person</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Notes</label>
                      <Textarea
                        value={editData.notes}
                        onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                        placeholder="Add notes about this outreach..."
                        rows={3}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        onUpdateOutreach(agency.id, editData);
                        setEditMode(false);
                      }}
                    >
                      Save Changes
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>Last Contact: {new Date(outreach.last_contact_date).toLocaleDateString()}</span>
                    </div>
                    {outreach.outreach_type && (
                      <p className="text-sm">
                        <span className="font-medium">Type:</span> {outreach.outreach_type}
                      </p>
                    )}
                    {outreach.notes && (
                      <div className="p-3 bg-background rounded">
                        <p className="text-sm font-medium mb-1">Notes:</p>
                        <p className="text-sm text-muted-foreground">{outreach.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Contract Details */}
        {(agency.contract_focus_rating || agency.typical_contract_duration_min || agency.typical_rate_min || agency.contract_permanent_split) && (
          <div className="pt-4 border-t space-y-3">
            <h4 className="font-semibold">Contract Details:</h4>
            
            {agency.contract_focus_rating && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Contract Focus:</span>
                <Badge variant={agency.contract_focus_rating >= 4 ? "default" : "secondary"}>
                  {agency.contract_focus_rating}/5 - {agency.contract_focus_rating >= 4 ? "High" : agency.contract_focus_rating >= 3 ? "Medium" : "Low"}
                </Badge>
              </div>
            )}

            {agency.typical_contract_duration_min && agency.typical_contract_duration_max && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Typical Duration:</span>
                <span className="text-sm font-medium">{agency.typical_contract_duration_min}-{agency.typical_contract_duration_max} months</span>
              </div>
            )}

            {agency.typical_rate_min && agency.typical_rate_max && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rate Range:</span>
                <span className="text-sm font-medium">${agency.typical_rate_min}-${agency.typical_rate_max}/hr</span>
              </div>
            )}

            {agency.contract_permanent_split && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Contract Split:</span>
                <span className="text-sm font-medium">{agency.contract_permanent_split}</span>
              </div>
            )}
          </div>
        )}

        {agency.notes && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2">Notes:</h4>
            <p className="text-sm text-muted-foreground">{agency.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
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
