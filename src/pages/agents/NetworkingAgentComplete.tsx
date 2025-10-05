import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Network, Users, Calendar, MessageSquare, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useNetworkingContacts } from "@/hooks/useNetworkingContacts";
import { format } from "date-fns";

export default function NetworkingAgentComplete() {
  const { contacts, loading, createContact, updateContact, deleteContact } = useNetworkingContacts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [formData, setFormData] = useState({
    contact_name: "",
    contact_title: "",
    contact_company: "",
    contact_email: "",
    contact_linkedin: "",
    relationship_strength: "weak",
    tags: "",
    notes: "",
    last_contact_date: "",
    next_follow_up_date: ""
  });

  const resetForm = () => {
    setFormData({
      contact_name: "",
      contact_title: "",
      contact_company: "",
      contact_email: "",
      contact_linkedin: "",
      relationship_strength: "weak",
      tags: "",
      notes: "",
      last_contact_date: "",
      next_follow_up_date: ""
    });
    setEditingContact(null);
  };

  const handleSave = async () => {
    const contactData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : null,
      last_contact_date: formData.last_contact_date || null,
      next_follow_up_date: formData.next_follow_up_date || null
    };

    if (editingContact) {
      await updateContact(editingContact.id, contactData);
    } else {
      await createContact(contactData as any);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (contact: any) => {
    setEditingContact(contact);
    setFormData({
      contact_name: contact.contact_name,
      contact_title: contact.contact_title || "",
      contact_company: contact.contact_company || "",
      contact_email: contact.contact_email || "",
      contact_linkedin: contact.contact_linkedin || "",
      relationship_strength: contact.relationship_strength || "weak",
      tags: contact.tags?.join(', ') || "",
      notes: contact.notes || "",
      last_contact_date: contact.last_contact_date || "",
      next_follow_up_date: contact.next_follow_up_date || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    await deleteContact(id);
  };

  const upcomingFollowUps = contacts.filter(c => 
    c.next_follow_up_date && new Date(c.next_follow_up_date) >= new Date()
  ).length;

  const recentInteractions = contacts.filter(c => 
    c.last_contact_date && 
    (new Date().getTime() - new Date(c.last_contact_date).getTime()) / (1000 * 60 * 60 * 24) <= 30
  ).length;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-4xl font-bold">Networking Agent</h1>
          <Badge variant="outline">MCP-Powered</Badge>
        </div>
        <p className="text-muted-foreground">Strategic networking guidance and relationship management</p>
      </div>

      <div className="grid gap-6">
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{contacts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Managed contacts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Follow-ups Due
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{upcomingFollowUps}</div>
              <p className="text-xs text-muted-foreground mt-1">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Recent Interactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{recentInteractions}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Your Network</CardTitle>
                <CardDescription>Manage your professional contacts and relationships</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingContact ? "Edit Contact" : "Add New Contact"}</DialogTitle>
                    <DialogDescription>
                      Keep track of your professional relationships
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contact_name">Name *</Label>
                        <Input
                          id="contact_name"
                          value={formData.contact_name}
                          onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact_title">Title</Label>
                        <Input
                          id="contact_title"
                          value={formData.contact_title}
                          onChange={(e) => setFormData({ ...formData, contact_title: e.target.value })}
                          placeholder="Senior Manager"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contact_company">Company</Label>
                        <Input
                          id="contact_company"
                          value={formData.contact_company}
                          onChange={(e) => setFormData({ ...formData, contact_company: e.target.value })}
                          placeholder="Acme Corp"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact_email">Email</Label>
                        <Input
                          id="contact_email"
                          type="email"
                          value={formData.contact_email}
                          onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                          placeholder="john@acme.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_linkedin">LinkedIn Profile</Label>
                      <Input
                        id="contact_linkedin"
                        value={formData.contact_linkedin}
                        onChange={(e) => setFormData({ ...formData, contact_linkedin: e.target.value })}
                        placeholder="https://linkedin.com/in/johndoe"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="relationship_strength">Relationship Strength</Label>
                      <Select value={formData.relationship_strength} onValueChange={(value) => setFormData({ ...formData, relationship_strength: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weak">Weak</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="strong">Strong</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="mentor, hiring manager, referral"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="last_contact_date">Last Contact</Label>
                        <Input
                          id="last_contact_date"
                          type="date"
                          value={formData.last_contact_date}
                          onChange={(e) => setFormData({ ...formData, last_contact_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="next_follow_up_date">Next Follow-up</Label>
                        <Input
                          id="next_follow_up_date"
                          type="date"
                          value={formData.next_follow_up_date}
                          onChange={(e) => setFormData({ ...formData, next_follow_up_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Add any relevant notes about this contact..."
                        rows={4}
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
                    <Button onClick={handleSave} disabled={!formData.contact_name}>
                      {editingContact ? "Update" : "Create"} Contact
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : contacts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No contacts yet. Add your first contact above!</p>
            ) : (
              <div className="space-y-4">
                {contacts.map((contact) => (
                  <Card key={contact.id} className="border-2">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{contact.contact_name}</CardTitle>
                          <CardDescription className="mt-1">
                            {contact.contact_title && <span>{contact.contact_title}</span>}
                            {contact.contact_title && contact.contact_company && <span> • </span>}
                            {contact.contact_company && <span>{contact.contact_company}</span>}
                          </CardDescription>
                          <div className="flex gap-2 mt-2">
                            {contact.relationship_strength && (
                              <Badge variant={contact.relationship_strength === 'strong' ? 'default' : 'secondary'}>
                                {contact.relationship_strength}
                              </Badge>
                            )}
                            {contact.tags?.map((tag, idx) => (
                              <Badge key={idx} variant="outline">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(contact)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(contact.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {contact.contact_email && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Email:</span> {contact.contact_email}
                        </div>
                      )}
                      {contact.last_contact_date && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Last Contact:</span> {format(new Date(contact.last_contact_date), 'MMM d, yyyy')}
                        </div>
                      )}
                      {contact.next_follow_up_date && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Follow-up:</span> {format(new Date(contact.next_follow_up_date), 'MMM d, yyyy')}
                        </div>
                      )}
                      {contact.notes && (
                        <div className="text-sm mt-2 p-3 bg-muted rounded">
                          <span className="text-muted-foreground">Notes:</span>
                          <p className="mt-1">{contact.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
