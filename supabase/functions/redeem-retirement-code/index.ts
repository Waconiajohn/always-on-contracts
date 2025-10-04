import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    console.log("[REDEEM-RETIREMENT-CODE] Processing redemption");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const user = userData.user;
    const { code, deviceFingerprint } = await req.json();

    if (!code) throw new Error("Code is required");

    // Check if code exists and is valid
    const { data: accessCode, error: codeError } = await supabaseClient
      .from('retirement_access_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (codeError || !accessCode) {
      throw new Error("Invalid or expired code");
    }

    if (accessCode.user_id && accessCode.user_id !== user.id) {
      throw new Error("This code has already been redeemed by another user");
    }

    if (accessCode.user_id === user.id) {
      throw new Error("You have already redeemed this code");
    }

    // Get device fingerprint and IP for security
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    // Check for any active Stripe subscriptions to refund
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    
    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 10,
      });

      // Cancel subscriptions and issue refunds
      for (const subscription of subscriptions.data) {
        // Cancel subscription immediately
        await stripe.subscriptions.cancel(subscription.id);

        // Issue refund for the current billing period
        const charges = await stripe.charges.list({
          customer: customerId,
          limit: 1,
        });

        if (charges.data.length > 0) {
          const latestCharge = charges.data[0];
          if (latestCharge.amount > 0 && latestCharge.refunded === false) {
            const refund = await stripe.refunds.create({
              charge: latestCharge.id,
              reason: 'requested_by_customer',
            });

            // Record refund in database
            await supabaseClient.from('subscription_refunds').insert({
              user_id: user.id,
              stripe_refund_id: refund.id,
              amount: refund.amount,
              reason: "Retirement planning client - lifetime access granted",
              status: refund.status,
              processed_at: new Date().toISOString(),
            });

            console.log("[REDEEM-RETIREMENT-CODE] Refund processed:", refund.id);
          }
        }
      }
    }

    // Redeem the code
    await supabaseClient
      .from('retirement_access_codes')
      .update({
        user_id: user.id,
        redeemed_at: new Date().toISOString(),
        device_fingerprint: deviceFingerprint || null,
        ip_address: ipAddress,
      })
      .eq('id', accessCode.id);

    // Add retirement client role
    await supabaseClient
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'retirement_client',
      })
      .onConflict('user_id,role')
      .merge();

    console.log("[REDEEM-RETIREMENT-CODE] Code redeemed successfully");

    return new Response(JSON.stringify({
      success: true,
      message: "Retirement access activated. Your subscription has been refunded and you now have lifetime access to Concierge Elite features."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[REDEEM-RETIREMENT-CODE] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});