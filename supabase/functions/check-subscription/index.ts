import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const getAllowedOrigin = (): string => {
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN');
  return allowedOrigin || '*';
};

const corsHeaders = {
  "Access-Control-Allow-Origin": getAllowedOrigin(),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRODUCT_IDS = {
  "prod_TAyQgE67mxaoNI": "career_starter",
  "prod_TAybgX9QeEJjT6": "always_ready",
  "prod_TAycNGYUgk9a76": "concierge_elite",
};

// Module access by tier
const TIER_MODULES: Record<string, string[]> = {
  free: ['quick_score'],
  career_starter: ['quick_score', 'resume_jobs_studio', 'career_vault'],
  always_ready: ['quick_score', 'resume_jobs_studio', 'career_vault', 'linkedin_pro', 'interview_mastery'],
  concierge_elite: ['quick_score', 'resume_jobs_studio', 'career_vault', 'linkedin_pro', 'interview_mastery'],
};

async function syncModuleAccess(supabaseClient: any, userId: string, tier: string) {
  const modules = TIER_MODULES[tier] || TIER_MODULES.free;
  
  // Delete existing bundled access (keep individual purchases)
  await supabaseClient
    .from('module_access')
    .delete()
    .eq('user_id', userId)
    .eq('access_type', 'bundled');

  // Insert new module access based on tier
  const moduleRecords = modules.map(module => ({
    user_id: userId,
    module,
    access_type: 'bundled',
  }));

  if (moduleRecords.length > 0) {
    await supabaseClient
      .from('module_access')
      .upsert(moduleRecords, { 
        onConflict: 'user_id,module',
        ignoreDuplicates: false 
      });
  }

  // Update profile subscription_tier
  await supabaseClient
    .from('profiles')
    .update({ subscription_tier: tier })
    .eq('user_id', userId);

  console.log(`[CHECK-SUBSCRIPTION] Synced ${modules.length} modules for tier: ${tier}`);
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
    console.log("[CHECK-SUBSCRIPTION] Starting subscription check");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("User not authenticated");

    const user = userData.user;
    console.log("[CHECK-SUBSCRIPTION] Checking for user:", user.id);

    // Check for retirement client access
    const { data: retirementAccess } = await supabaseClient
      .from('retirement_access_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (retirementAccess) {
      console.log("[CHECK-SUBSCRIPTION] User has retirement access");
      await syncModuleAccess(supabaseClient, user.id, 'concierge_elite');
      return new Response(JSON.stringify({
        subscribed: true,
        tier: "concierge_elite",
        is_retirement_client: true,
        subscription_end: null // Lifetime access
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2024-06-20" 
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      console.log("[CHECK-SUBSCRIPTION] No customer found");
      await syncModuleAccess(supabaseClient, user.id, 'free');
      return new Response(JSON.stringify({ subscribed: false, tier: 'free' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      console.log("[CHECK-SUBSCRIPTION] No active subscription");
      await syncModuleAccess(supabaseClient, user.id, 'free');
      return new Response(JSON.stringify({ subscribed: false, tier: 'free' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subscription = subscriptions.data[0];
    const productId = subscription.items.data[0].price.product as string;
    const tier = PRODUCT_IDS[productId as keyof typeof PRODUCT_IDS] || "career_starter";
    const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();

    // Update local subscription record
    await supabaseClient
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        tier: tier,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: subscriptionEnd,
        cancel_at_period_end: subscription.cancel_at_period_end,
      }, {
        onConflict: 'stripe_subscription_id'
      });

    // Sync module access based on tier
    await syncModuleAccess(supabaseClient, user.id, tier);

    console.log("[CHECK-SUBSCRIPTION] Active subscription found:", tier);

    return new Response(JSON.stringify({
      subscribed: true,
      tier: tier,
      subscription_end: subscriptionEnd,
      cancel_at_period_end: subscription.cancel_at_period_end,
      is_retirement_client: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[CHECK-SUBSCRIPTION] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
