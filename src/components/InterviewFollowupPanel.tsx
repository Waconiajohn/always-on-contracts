import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, Clock, CheckCircle, Calendar, Sparkles, AlertCircle } from "lucide-react";
import { 
  GenerateInterviewFollowupSchema, 
  SendCommunicationSchema,
  safeValidateInput,
  invokeEdgeFunction 
} from '@/lib/edgeFunction';
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InterviewFollowupPanelProps {
  userId: string;
  jobProjectId?: string;
}

export const InterviewFollowupPanel = ({ userId, jobProjectId }: InterviewFollowupPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(jobProjectId || "");
  const [communications, setCommunications] = useState<any[]>([]);
  const [communicationType, setCommunicationType] = useState<string>("thank_you");
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [customInstructions, setCustomInstructions] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchInterviewingProjects();
    if (jobProjectId) {
      setSelectedProject(jobProjectId);
      fetchCommunications(jobProjectId);
    }
  }, [userId, jobProjectId]);

  const fetchInterviewingProjects = async () => {
    const { data, error } = await supabase
      .from('job_projects')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['interviewing', 'researching'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProjects(data);
    }
  };

  const fetchCommunications = async (projectId: string) => {
    const { data, error } = await supabase
      .from('interview_communications')
      .select('*')
      .eq('job_project_id', projectId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCommunications(data);
    }
  };

  const generateFollowup = async () => {
    if (!selectedProject) {
      toast({
        title: "Project Required",
        description: "Please select a job project first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const validation = safeValidateInput(GenerateInterviewFollowupSchema, {
        jobProjectId: selectedProject,
        communicationType: communicationType as 'thank_you' | 'follow_up' | 'check_in',
        customInstructions
      });

      if (!validation.success) {
        setLoading(false);
        return;
      }

      const { data, error } = await invokeEdgeFunction(
        supabase,
        'generate-interview-followup',
        validation.data,
        { successMessage: 'Email generated successfully!' }
      );

      if (error) return;

      setGeneratedContent(data);
      
      // Pre-fill recipient info if available
      if (data.variables?.interviewer_name) {
        setRecipientName(data.variables.interviewer_name);
      }
      
      // Get project interviewer email
      const project = projects.find(p => p.id === selectedProject);
      if (project?.interviewer_email) {
        setRecipientEmail(project.interviewer_email);
      }

    } finally {
      setLoading(false);
    }
  };

  const sendCommunication = async () => {
    if (!generatedContent || !recipientEmail) {
      toast({
        title: "Missing Information",
        description: "Please provide recipient email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First create the communication record
      const { data: newComm, error: createError } = await supabase
        .from('interview_communications')
        .insert({
          user_id: userId,
          job_project_id: selectedProject,
          communication_type: communicationType,
          subject_line: generatedContent.subject,
          body_content: generatedContent.body,
          recipient_email: recipientEmail,
          recipient_name: recipientName,
          status: 'draft'
        })
        .select()
        .single();

      if (createError) throw createError;

      // Send the email  
      const validation = safeValidateInput(SendCommunicationSchema, {
        communicationId: newComm.id,
        recipientEmail,
        recipientName,
        subject: generatedContent.subject,
        body: generatedContent.body,
        scheduledFor: null
      });

      if (!validation.success) {
        setLoading(false);
        return;
      }

      const { data, error } = await invokeEdgeFunction(
        supabase,
        'send-interview-communication',
        validation.data
      );

      if (error) return;
      
      toast({
        title: data?.simulated ? "Email Simulated" : "Email Sent",
        description: data?.message || "Communication sent successfully",
      });

      // Refresh communications list
      fetchCommunications(selectedProject);
      setGeneratedContent(null);
      setCustomInstructions("");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Mail className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCommunicationTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Active Interviews Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Interview
          </CardTitle>
          <CardDescription>
            Choose a job project to create follow-up communications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Job Project</Label>
            <Select value={selectedProject} onValueChange={(value) => {
              setSelectedProject(value);
              fetchCommunications(value);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.project_name} - {project.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {projects.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <p>No active job projects. Create one to start tracking interview follow-ups.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Communication Timeline */}
      {selectedProject && communications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Communication Timeline</CardTitle>
            <CardDescription>Your follow-up history for this position</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {communications.map((comm) => (
                <div key={comm.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getStatusIcon(comm.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{getCommunicationTypeLabel(comm.communication_type)}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {comm.sent_at ? format(new Date(comm.sent_at), 'MMM d, yyyy') : 'Not sent'}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{comm.subject_line}</p>
                    {comm.recipient_name && (
                      <p className="text-xs text-muted-foreground">To: {comm.recipient_name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Compose */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Follow-up Email
          </CardTitle>
          <CardDescription>
            AI-powered email generation using your Career Vault data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email Type</Label>
            <Select value={communicationType} onValueChange={setCommunicationType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thank_you">Thank You (24-48 hours post-interview)</SelectItem>
                <SelectItem value="follow_up">Follow-up (5-7 days)</SelectItem>
                <SelectItem value="check_in">Check-in (2+ weeks)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Custom Instructions (Optional)</Label>
            <Textarea
              placeholder="E.g., 'Mention the discussion about AI implementation' or 'Reference the team culture'"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            onClick={generateFollowup} 
            disabled={loading || !selectedProject}
            className="w-full"
          >
            {loading ? "Generating..." : "Generate Email with AI"}
          </Button>

          {generatedContent && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div>
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <p className="font-medium">{generatedContent.subject}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Body</Label>
                <Textarea
                  value={generatedContent.body}
                  onChange={(e) => setGeneratedContent({...generatedContent, body: e.target.value})}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Recipient Email</Label>
                  <Input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="interviewer@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Recipient Name</Label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Jane Smith"
                  />
                </div>
              </div>

              {generatedContent.tips && (
                <div className="p-3 bg-blue-500/10 border-l-4 border-blue-500 rounded">
                  <h4 className="font-semibold text-sm mb-2">💡 Tips</h4>
                  <ul className="text-sm space-y-1">
                    {generatedContent.tips.map((tip: string, i: number) => (
                      <li key={i}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={sendCommunication} disabled={loading} className="flex-1">
                  <Send className="mr-2 h-4 w-4" />
                  {loading ? "Sending..." : "Send Now"}
                </Button>
                <Button variant="outline" onClick={() => setGeneratedContent(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};