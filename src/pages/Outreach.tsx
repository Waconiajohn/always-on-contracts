import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, Mail, Phone, Globe, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface OutreachRecord {
  id: string;
  agency_id: string;
  status: string;
  outreach_type: string;
  notes: string;
  last_contact_date: string;
  agency: {
    agency_name: string;
    contact_email: string;
    contact_phone: string;
    website: string;
    specialization: string[];
    location: string;
  };
}

const OutreachContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [outreach, setOutreach] = useState<OutreachRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    status: string;
    outreach_type: string;
    notes: string;
  }>({ status: "", outreach_type: "", notes: "" });

  useEffect(() => {
    fetchOutreach();
  }, []);

  const fetchOutreach = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("outreach_tracking")
        .select(`
          *,
          agency:staffing_agencies!outreach_tracking_agency_id_fkey(
            agency_name,
            contact_email,
            contact_phone,
            website,
            specialization,
            location
          )
        `)
        .eq("user_id", user.id)
        .order("last_contact_date", { ascending: false });

      if (error) throw error;
      setOutreach(data || []);
    } catch (error) {
      console.error("Error fetching outreach:", error);
      toast({
        title: "Error",
        description: "Failed to load outreach records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: OutreachRecord) => {
    setEditingId(record.id);
    setEditData({
      status: record.status,
      outreach_type: record.outreach_type || "",
      notes: record.notes || "",
    });
  };

  const handleSave = async (id: string) => {
    try {
      const { error } = await supabase
        .from("outreach_tracking")
        .update({
          status: editData.status,
          outreach_type: editData.outreach_type,
          notes: editData.notes,
          last_contact_date: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Outreach record updated",
      });

      setEditingId(null);
      fetchOutreach();
    } catch (error) {
      console.error("Error updating outreach:", error);
      toast({
        title: "Error",
        description: "Failed to update record",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("outreach_tracking")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Outreach record removed",
      });

      fetchOutreach();
    } catch (error) {
      console.error("Error deleting outreach:", error);
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive",
      });
    }
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-xl text-muted-foreground">Loading outreach records...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" size="lg" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-6 w-6" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Outreach Management</h1>
          <p className="text-xl text-muted-foreground">
            Track and manage your staffing agency outreach
          </p>
        </div>

        {outreach.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-lg text-muted-foreground mb-4">
                You haven't tracked any agencies yet.
              </p>
              <div className="flex justify-center">
                <Button onClick={() => navigate("/agencies")}>
                  Browse Agencies
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {outreach.map((record) => (
              <Card key={record.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">
                        {record.agency.agency_name}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {record.agency.specialization?.map((spec) => (
                          <Badge key={spec} variant="outline">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Badge variant={getStatusColor(record.status)}>
                      {record.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Agency Details */}
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {record.agency.contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${record.agency.contact_email}`}
                          className="text-primary hover:underline"
                        >
                          {record.agency.contact_email}
                        </a>
                      </div>
                    )}
                    {record.agency.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{record.agency.contact_phone}</span>
                      </div>
                    )}
                    {record.agency.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={record.agency.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {record.agency.website}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Last Contact: {new Date(record.last_contact_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Edit Form or Display */}
                  {editingId === record.id ? (
                    <div className="space-y-4 p-4 bg-muted rounded-lg">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Status</label>
                          <Select
                            value={editData.status}
                            onValueChange={(value) =>
                              setEditData({ ...editData, status: value })
                            }
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
                          <label className="text-sm font-medium mb-2 block">
                            Outreach Type
                          </label>
                          <Select
                            value={editData.outreach_type}
                            onValueChange={(value) =>
                              setEditData({ ...editData, outreach_type: value })
                            }
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
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Notes</label>
                        <Textarea
                          value={editData.notes}
                          onChange={(e) =>
                            setEditData({ ...editData, notes: e.target.value })
                          }
                          placeholder="Add notes about this outreach..."
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleSave(record.id)}>Save</Button>
                        <Button variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {record.outreach_type && (
                        <p className="text-sm">
                          <span className="font-medium">Outreach Type:</span>{" "}
                          {record.outreach_type}
                        </p>
                      )}
                      {record.notes && (
                        <div className="p-3 bg-muted rounded">
                          <p className="text-sm font-medium mb-1">Notes:</p>
                          <p className="text-sm text-muted-foreground">{record.notes}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleEdit(record)}>
                          Update
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Outreach Record?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove {record.agency.agency_name} from your tracked
                                agencies. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(record.id)}>
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const Outreach = () => {
  return (
    <ProtectedRoute>
      <OutreachContent />
    </ProtectedRoute>
  );
};

export default Outreach;
