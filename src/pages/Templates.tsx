import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2, Mail, MessageSquare, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface Template {
  id: string;
  template_name: string;
  template_type: string;
  subject_line: string | null;
  body_content: string;
  created_at: string;
}

const TemplatesContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  
  const [formData, setFormData] = useState({
    template_name: "",
    template_type: "email",
    subject_line: "",
    body_content: ""
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("communication_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      template_name: "",
      template_type: "email",
      subject_line: "",
      body_content: ""
    });
    setEditingTemplate(null);
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingTemplate) {
        const { error } = await supabase
          .from("communication_templates")
          .update({
            template_name: formData.template_name,
            template_type: formData.template_type,
            subject_line: formData.subject_line || null,
            body_content: formData.body_content,
          })
          .eq("id", editingTemplate.id);

        if (error) throw error;
        toast({ title: "Template updated successfully!" });
      } else {
        const { error } = await supabase
          .from("communication_templates")
          .insert({
            user_id: user.id,
            template_name: formData.template_name,
            template_type: formData.template_type,
            subject_line: formData.subject_line || null,
            body_content: formData.body_content,
          });

        if (error) throw error;
        toast({ title: "Template created successfully!" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      template_name: template.template_name,
      template_type: template.template_type,
      subject_line: template.subject_line || "",
      body_content: template.body_content,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const { error } = await supabase
        .from("communication_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Template deleted successfully!" });
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-5 w-5" />;
      case "linkedin":
        return <MessageSquare className="h-5 w-5" />;
      case "phone":
        return <Phone className="h-5 w-5" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Communication Templates</h1>
              <p className="text-muted-foreground mt-1">
                Create and manage templates for outreach
              </p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? "Edit Template" : "Create New Template"}</DialogTitle>
                <DialogDescription>
                  Use variables like {`{{agency_name}}, {{position}}, {{your_name}}`} in your templates
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="template_name">Template Name</Label>
                  <Input
                    id="template_name"
                    value={formData.template_name}
                    onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                    placeholder="e.g., Initial Outreach Email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template_type">Template Type</Label>
                  <Select
                    value={formData.template_type}
                    onValueChange={(value) => setFormData({ ...formData, template_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="linkedin">LinkedIn Message</SelectItem>
                      <SelectItem value="phone">Phone Script</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.template_type === "email" && (
                  <div className="space-y-2">
                    <Label htmlFor="subject_line">Subject Line</Label>
                    <Input
                      id="subject_line"
                      value={formData.subject_line}
                      onChange={(e) => setFormData({ ...formData, subject_line: e.target.value })}
                      placeholder="e.g., Experienced {{position}} Seeking Opportunities"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="body_content">Message Content</Label>
                  <Textarea
                    id="body_content"
                    value={formData.body_content}
                    onChange={(e) => setFormData({ ...formData, body_content: e.target.value })}
                    placeholder={`Dear {{agency_name}} team,\n\nI am reaching out to explore potential opportunities...`}
                    rows={12}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!formData.template_name || !formData.body_content}>
                  {editingTemplate ? "Update" : "Create"} Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first communication template to streamline your outreach
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(template.template_type)}
                      <CardTitle className="text-lg">{template.template_name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="capitalize">
                    {template.template_type}
                    {template.subject_line && ` • ${template.subject_line.substring(0, 40)}...`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-4">
                    {template.body_content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Templates = () => {
  return (
    <ProtectedRoute>
      <TemplatesContent />
    </ProtectedRoute>
  );
};

export default Templates;