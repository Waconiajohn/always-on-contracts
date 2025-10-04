import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    console.error("[WEBHOOK] Missing signature or secret");
    return new Response("Webhook signature or secret missing", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    console.log("[WEBHOOK] Event type:", event.type);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Get customer email
        const customer = await stripe.customers.retrieve(customerId);
        const email = (customer as Stripe.Customer).email;

        if (!email) {
          console.error("[WEBHOOK] Customer has no email");
          break;
        }

        // Find user by email
        const { data: userData } = await supabase.auth.admin.listUsers();
        const user = userData?.users.find(u => u.email === email);

        if (!user) {
          console.error("[WEBHOOK] User not found for email:", email);
          break;
        }

        // Determine tier
        const productId = subscription.items.data[0].price.product as string;
        const PRODUCT_IDS: Record<string, string> = {
          "prod_TAyQgE67mxaoNI": "career_starter",
          "prod_TAybgX9QeEJjT6": "always_ready",
          "prod_TAycNGYUgk9a76": "concierge_elite",
        };
        const tier = PRODUCT_IDS[productId] || "career_starter";

        // Update subscription record
        await supabase.from("subscriptions").upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          tier,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        }, {
          onConflict: "stripe_subscription_id"
        });

        console.log("[WEBHOOK] Subscription updated for user:", user.id);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        // Find referral
        const { data: referral } = await supabase
          .from("affiliate_referrals")
          .select("id, affiliate_id")
          .eq("subscription_id", subscriptionId)
          .eq("converted_at", null)
          .single();

        if (!referral) {
          console.log("[WEBHOOK] No referral found for subscription:", subscriptionId);
          break;
        }

        // Get affiliate commission rate
        const { data: affiliate } = await supabase
          .from("affiliates")
          .select("commission_rate")
          .eq("id", referral.affiliate_id)
          .single();

        if (!affiliate) break;

        // Calculate commission (30% of payment)
        const commissionRate = affiliate.commission_rate / 100;
        const amountCents = Math.floor((invoice.amount_paid || 0) * commissionRate);

        // Create commission record
        await supabase.from("affiliate_commissions").insert({
          affiliate_id: referral.affiliate_id,
          referral_id: referral.id,
          subscription_id: subscriptionId,
          amount_cents: amountCents,
          currency: invoice.currency,
          status: "pending",
        });

        // Mark referral as converted
        await supabase
          .from("affiliate_referrals")
          .update({ converted_at: new Date().toISOString() })
          .eq("id", referral.id);

        // Update affiliate stats
        await supabase.rpc("increment_affiliate_earnings", {
          affiliate_id: referral.affiliate_id,
          amount: amountCents,
        });

        console.log("[WEBHOOK] Commission created for affiliate:", referral.affiliate_id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update subscription status
        await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", subscription.id);

        console.log("[WEBHOOK] Subscription canceled:", subscription.id);
        break;
      }

      default:
        console.log("[WEBHOOK] Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[WEBHOOK] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
