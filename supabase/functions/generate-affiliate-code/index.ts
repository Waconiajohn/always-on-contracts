import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateReferralCode(userId: string): string {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const userPart = userId.substring(0, 6).toUpperCase();
  return `${userPart}${randomPart}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    console.log("[GENERATE-AFFILIATE-CODE] Processing affiliate signup");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const user = userData.user;
    const { payoutEmail } = await req.json();

    // Check if user already has an affiliate account
    const { data: existing } = await supabaseClient
      .from('affiliates')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return new Response(JSON.stringify({
        referralCode: existing.referral_code,
        affiliate: existing
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate unique referral code
    let referralCode = generateReferralCode(user.id);
    let attempts = 0;
    
    while (attempts < 10) {
      const { data: codeExists } = await supabaseClient
        .from('affiliates')
        .select('id')
        .eq('referral_code', referralCode)
        .single();

      if (!codeExists) break;
      referralCode = generateReferralCode(user.id);
      attempts++;
    }

    // Create affiliate account with 30% commission rate
    const { data: affiliate, error: createError } = await supabaseClient
      .from('affiliates')
      .insert({
        user_id: user.id,
        referral_code: referralCode,
        commission_rate: 30, // 30% recurring commission
        payout_email: payoutEmail || user.email,
        status: 'active',
      })
      .select()
      .single();

    if (createError) throw createError;

    // Add affiliate role
    await supabaseClient
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: 'affiliate',
      }, {
        onConflict: 'user_id,role'
      });

    console.log("[GENERATE-AFFILIATE-CODE] Affiliate account created:", referralCode);

    return new Response(JSON.stringify({
      referralCode,
      affiliate
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GENERATE-AFFILIATE-CODE] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});