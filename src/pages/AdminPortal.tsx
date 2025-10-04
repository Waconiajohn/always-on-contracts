import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Gift, Users, Key, Plus } from "lucide-react";
import { toast } from "sonner";

export default function AdminPortal() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [promoType, setPromoType] = useState("friends_family");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [promoCodes, setPromoCodes] = useState<any[]>([]);

  // Retirement code state
  const [retirementCodes, setRetirementCodes] = useState<any[]>([]);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single();

      setIsAdmin(!!roles);
      
      if (roles) {
        loadPromoCodes();
        loadRetirementCodes();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPromoCodes = async () => {
    const { data } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });
    
    setPromoCodes(data || []);
  };

  const loadRetirementCodes = async () => {
    const { data } = await supabase
      .from('retirement_access_codes')
      .select('*')
      .order('created_at', { ascending: false });
    
    setRetirementCodes(data || []);
  };

  const generatePromoCode = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('promo_codes')
        .insert({
          code: promoCode.toUpperCase(),
          code_type: promoType,
          discount_type: discountType,
          discount_value: parseInt(discountValue),
          created_by: session.user.id,
          is_active: true
        });

      if (error) throw error;

      toast.success("Promo code created!");
      setPromoCode("");
      setDiscountValue("");
      loadPromoCodes();
    } catch (error: any) {
      toast.error(error.message || "Failed to create promo code");
    }
  };

  const generateRetirementCode = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const code = `RET${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      const { error } = await supabase
        .from('retirement_access_codes')
        .insert({
          code,
          created_by: session.user.id,
          is_active: true
        });

      if (error) throw error;

      toast.success(`Retirement code created: ${code}`);
      loadRetirementCodes();
    } catch (error: any) {
      toast.error(error.message || "Failed to create retirement code");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-center">Admin Access Required</CardTitle>
            <CardDescription className="text-center">
              You don't have permission to access this page
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Portal</h1>
            <p className="text-muted-foreground">Manage subscriptions, codes, and affiliates</p>
          </div>
        </div>

        <Tabs defaultValue="promo-codes">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="promo-codes">
              <Gift className="h-4 w-4 mr-2" />
              Promo Codes
            </TabsTrigger>
            <TabsTrigger value="retirement-codes">
              <Key className="h-4 w-4 mr-2" />
              Retirement Codes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="promo-codes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Promo Code</CardTitle>
                <CardDescription>Generate discount codes for friends, family, or marketing campaigns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Code</Label>
                    <Input
                      placeholder="FRIENDS2025"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={promoType} onValueChange={setPromoType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friends_family">Friends & Family</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="affiliate">Affiliate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Discount Type</Label>
                    <Select value={discountType} onValueChange={setDiscountType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Discount Value</Label>
                    <Input
                      type="number"
                      placeholder={discountType === 'percentage' ? '20' : '10'}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={generatePromoCode} disabled={!promoCode || !discountValue}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Promo Code
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Promo Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Uses</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promoCodes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell className="font-mono">{code.code}</TableCell>
                        <TableCell>{code.code_type}</TableCell>
                        <TableCell>
                          {code.discount_type === 'percentage' ? `${code.discount_value}%` : `$${code.discount_value}`}
                        </TableCell>
                        <TableCell>
                          {code.current_uses}{code.max_uses ? `/${code.max_uses}` : ''}
                        </TableCell>
                        <TableCell>
                          <Badge variant={code.is_active ? 'default' : 'secondary'}>
                            {code.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retirement-codes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generate Retirement Access Code</CardTitle>
                <CardDescription>Create unique codes for retirement planning clients</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={generateRetirementCode}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate New Code
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retirement Access Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Redeemed By</TableHead>
                      <TableHead>Redeemed At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {retirementCodes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell className="font-mono">{code.code}</TableCell>
                        <TableCell>
                          <Badge variant={code.user_id ? 'secondary' : 'default'}>
                            {code.user_id ? 'Redeemed' : 'Available'}
                          </Badge>
                        </TableCell>
                        <TableCell>{code.user_id ? code.user_id.substring(0, 8) + '...' : '-'}</TableCell>
                        <TableCell>
                          {code.redeemed_at ? new Date(code.redeemed_at).toLocaleDateString() : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}