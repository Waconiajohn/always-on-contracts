import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIER_PRICES = {
  career_starter: "price_1SEcTVHMkjyR13vqQ8HAjxbX",
  always_ready: "price_1SEcegHMkjyR13vqUUZuaKLq",
  concierge_elite: "price_1SEcewHMkjyR13vqIkAj7gzf",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    console.log("[CREATE-CHECKOUT] Starting checkout session creation");
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !data.user?.email) throw new Error("User not authenticated");

    const user = data.user;
    console.log("[CREATE-CHECKOUT] User authenticated:", user.id);

    const { tier, referralCode, promoCode } = await req.json();
    
    if (!tier || !TIER_PRICES[tier as keyof typeof TIER_PRICES]) {
      throw new Error("Invalid subscription tier");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data[0]?.id;

    if (!customerId) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id }
      });
      customerId = newCustomer.id;
      console.log("[CREATE-CHECKOUT] Created new customer:", customerId);
    }

    // Handle affiliate referral tracking
    if (referralCode) {
      const { data: affiliate } = await supabaseClient
        .from('affiliates')
        .select('id')
        .eq('referral_code', referralCode)
        .eq('status', 'active')
        .single();

      if (affiliate) {
        await supabaseClient.from('affiliate_referrals').insert({
          affiliate_id: affiliate.id,
          referred_user_id: user.id,
          referral_token: referralCode
        });
        console.log("[CREATE-CHECKOUT] Tracked affiliate referral");
      }
    }

    // Create checkout session
    const sessionConfig: any = {
      customer: customerId,
      line_items: [{
        price: TIER_PRICES[tier as keyof typeof TIER_PRICES],
        quantity: 1,
      }],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/pricing`,
      metadata: {
        supabase_user_id: user.id,
        tier: tier,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          tier: tier,
        }
      }
    };

    // Apply promo code if provided
    if (promoCode) {
      const { data: promo } = await supabaseClient
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode)
        .eq('is_active', true)
        .single();

      if (promo) {
        const now = new Date();
        const expired = promo.expires_at && new Date(promo.expires_at) < now;
        const maxed = promo.max_uses && promo.current_uses >= promo.max_uses;

        if (!expired && !maxed) {
          // Create Stripe coupon and apply
          const coupon = await stripe.coupons.create({
            [promo.discount_type === 'percentage' ? 'percent_off' : 'amount_off']: promo.discount_value,
            duration: 'once',
          });
          sessionConfig.discounts = [{ coupon: coupon.id }];
          
          // Increment usage
          await supabaseClient
            .from('promo_codes')
            .update({ current_uses: promo.current_uses + 1 })
            .eq('id', promo.id);
          
          console.log("[CREATE-CHECKOUT] Applied promo code:", promoCode);
        }
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    console.log("[CREATE-CHECKOUT] Session created:", session.id);

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[CREATE-CHECKOUT] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});