import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, User, Mail, Phone, Briefcase, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";
import { AIMatchingPreferences } from "@/components/AIMatchingPreferences";
import { VaultNuclearReset } from "@/components/career-vault/VaultNuclearReset";

interface Profile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  current_employment_status: string | null;
}

const ProfileContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { subscription, loading: subLoading, manageSubscription } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vaultId, setVaultId] = useState<string | undefined>(undefined);
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    email: "",
    phone: "",
    current_employment_status: "unemployed",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch vault data including resume text
      const { data: vaultData } = await supabase
        .from("career_vault")
        .select("id, resume_raw_text")
        .eq("user_id", user.id)
        .maybeSingle();

      if (vaultData) {
        setVaultId(vaultData.id);
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          email: data.email || user.email || "",
          phone: data.phone || "",
          current_employment_status: data.current_employment_status || "unemployed",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          current_employment_status: profile.current_employment_status,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-xl text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" size="lg" onClick={() => navigate("/home")}>
            <ArrowLeft className="mr-2 h-6 w-6" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Profile Settings</h1>
            <p className="text-xl text-muted-foreground">
              Manage your account information and preferences
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-base">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </div>
                </Label>
                <Input
                  id="full_name"
                  placeholder="John Doe"
                  value={profile.full_name || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, full_name: e.target.value })
                  }
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ""}
                  disabled
                  className="text-base bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Email cannot be changed. Contact support if you need to update it.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-base">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </div>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={profile.phone || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment_status" className="text-base">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="h-4 w-4" />
                    Current Employment Status
                  </div>
                </Label>
                <Select
                  value={profile.current_employment_status || "unemployed"}
                  onValueChange={(value) =>
                    setProfile({ ...profile, current_employment_status: value })
                  }
                >
                  <SelectTrigger className="text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unemployed">Looking for Contract</SelectItem>
                    <SelectItem value="employed">Currently Under Contract</SelectItem>
                    <SelectItem value="between_contracts">Between Contracts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full text-lg py-6"
                >
                  <Save className="mr-2 h-5 w-5" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Subscription & Billing</CardTitle>
              <CardDescription>
                Manage your subscription plan and billing settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-base font-medium">Current Plan</span>
                <div className="flex items-center gap-2">
                  {subLoading ? (
                    <span className="text-base text-muted-foreground">Loading...</span>
                  ) : subscription?.is_retirement_client ? (
                    <Badge className="text-sm font-semibold">Retirement Client - Lifetime Access</Badge>
                  ) : subscription?.subscribed ? (
                    <Badge variant="default" className="text-sm font-semibold">
                      {subscription.tier === 'career_starter' && 'Career Starter'}
                      {subscription.tier === 'always_ready' && 'Always Ready'}
                      {subscription.tier === 'concierge_elite' && 'Concierge Elite'}
                    </Badge>
                  ) : (
                    <span className="text-base text-muted-foreground">Free</span>
                  )}
                </div>
              </div>
              
              {subscription?.subscribed && subscription?.subscription_end && (
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-base font-medium">Renewal Date</span>
                  <span className="text-base text-muted-foreground">
                    {new Date(subscription.subscription_end).toLocaleDateString()}
                  </span>
                </div>
              )}

              {subscription?.cancel_at_period_end && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    Your subscription will end on {new Date(subscription.subscription_end!).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              <div className="pt-4 space-y-3">
                {subscription?.subscribed && !subscription?.is_retirement_client && (
                  <Button
                    variant="outline"
                    onClick={manageSubscription}
                    className="w-full text-lg py-6"
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    Manage Subscription
                  </Button>
                )}
                
                {!subscription?.subscribed && !subscription?.is_retirement_client && (
                  <Button
                    onClick={() => navigate("/pricing")}
                    className="w-full text-lg py-6"
                  >
                    View Plans
                  </Button>
                )}

                {!subscription?.is_retirement_client && (
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/redeem-code")}
                    className="w-full text-base"
                  >
                    Have a retirement access code?
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <AIMatchingPreferences />

          {vaultId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Vault Management</CardTitle>
                <CardDescription>
                  Advanced vault operations and data management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VaultNuclearReset vaultId={vaultId} />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

const Profile = () => {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
};

export default Profile;
