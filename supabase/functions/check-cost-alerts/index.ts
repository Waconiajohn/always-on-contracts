/**
 * Cost Alert System - Monitor usage and send alerts
 *
 * Runs on cron schedule to check if users are approaching limits
 * Sends email/notification when:
 * - 80% of quota reached
 * - 90% of quota reached
 * - 100% of quota reached (over limit)
 * - Budget exceeded
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/response-helpers.ts';

interface AlertConfig {
  userId: string;
  email: string;
  tier: string;
  percentUsed: number;
  requestsUsed: number;
  requestsLimit: number;
  costSpent: number;
  costBudget: number;
  daysUntilReset: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[COST-ALERTS] Starting alert check...');

    // Fetch all users with their quota status
    const { data: users, error } = await supabase
      .from('user_quota_status')
      .select('*');

    if (error) throw error;

    const alertsSent = {
      warning_80: 0,
      warning_90: 0,
      critical_100: 0,
      budget_exceeded: 0
    };

    for (const user of users || []) {
      const percentUsed = user.percent_used || 0;
      const budgetPercent = (user.monthly_cost_spent_usd / user.monthly_cost_budget_usd) * 100;

      // Check if we should send alerts
      const shouldAlert80 = percentUsed >= 80 && percentUsed < 90;
      const shouldAlert90 = percentUsed >= 90 && percentUsed < 100;
      const shouldAlert100 = user.is_over_limit;
      const shouldAlertBudget = budgetPercent >= 90;

      // Check if alert was already sent recently (don't spam)
      const { data: recentAlerts } = await supabase
        .from('cost_alerts_sent')
        .select('*')
        .eq('user_id', user.user_id)
        .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('sent_at', { ascending: false })
        .limit(1);

      const lastAlert = recentAlerts?.[0];
      const lastAlertType = lastAlert?.alert_type;

      // Send 80% warning
      if (shouldAlert80 && lastAlertType !== 'warning_80') {
        await sendAlert(supabase, {
          userId: user.user_id,
          email: user.email || '',
          tier: user.tier,
          percentUsed,
          requestsUsed: user.monthly_request_count,
          requestsLimit: user.monthly_request_limit,
          costSpent: user.monthly_cost_spent_usd,
          costBudget: user.monthly_cost_budget_usd,
          daysUntilReset: user.days_until_reset
        }, 'warning_80');
        alertsSent.warning_80++;
      }

      // Send 90% warning
      if (shouldAlert90 && lastAlertType !== 'warning_90' && lastAlertType !== 'warning_80') {
        await sendAlert(supabase, {
          userId: user.user_id,
          email: user.email || '',
          tier: user.tier,
          percentUsed,
          requestsUsed: user.monthly_request_count,
          requestsLimit: user.monthly_request_limit,
          costSpent: user.monthly_cost_spent_usd,
          costBudget: user.monthly_cost_budget_usd,
          daysUntilReset: user.days_until_reset
        }, 'warning_90');
        alertsSent.warning_90++;
      }

      // Send critical 100% alert
      if (shouldAlert100 && lastAlertType !== 'critical_100') {
        await sendAlert(supabase, {
          userId: user.user_id,
          email: user.email || '',
          tier: user.tier,
          percentUsed,
          requestsUsed: user.monthly_request_count,
          requestsLimit: user.monthly_request_limit,
          costSpent: user.monthly_cost_spent_usd,
          costBudget: user.monthly_cost_budget_usd,
          daysUntilReset: user.days_until_reset
        }, 'critical_100');
        alertsSent.critical_100++;
      }

      // Send budget exceeded alert
      if (shouldAlertBudget && lastAlertType !== 'budget_exceeded') {
        await sendAlert(supabase, {
          userId: user.user_id,
          email: user.email || '',
          tier: user.tier,
          percentUsed,
          requestsUsed: user.monthly_request_count,
          requestsLimit: user.monthly_request_limit,
          costSpent: user.monthly_cost_spent_usd,
          costBudget: user.monthly_cost_budget_usd,
          daysUntilReset: user.days_until_reset
        }, 'budget_exceeded');
        alertsSent.budget_exceeded++;
      }
    }

    console.log('[COST-ALERTS] Alert check complete:', alertsSent);

    return new Response(
      JSON.stringify({
        success: true,
        usersChecked: users?.length || 0,
        alertsSent
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[COST-ALERTS] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function sendAlert(
  supabase: any,
  config: AlertConfig,
  alertType: string
) {
  const messages = {
    warning_80: {
      subject: '⚠️ You've used 80% of your AI quota',
      body: `You've used ${config.percentUsed.toFixed(0)}% of your monthly AI requests (${config.requestsUsed}/${config.requestsLimit}). Your quota resets in ${config.daysUntilReset} days. Consider upgrading to avoid interruptions.`
    },
    warning_90: {
      subject: '🚨 You've used 90% of your AI quota',
      body: `You're approaching your limit! You've used ${config.requestsUsed} of ${config.requestsLimit} monthly requests. Only ${config.requestsLimit - config.requestsUsed} requests remaining. Upgrade now to continue.`
    },
    critical_100: {
      subject: '🛑 AI Quota Exceeded - Upgrade Required',
      body: `You've exceeded your ${config.tier} tier limit of ${config.requestsLimit} monthly requests. AI features are now disabled. Upgrade to continue using AI-powered features.`
    },
    budget_exceeded: {
      subject: '💰 AI Budget Alert - 90% Spent',
      body: `You've spent $${config.costSpent.toFixed(2)} of your $${config.costBudget.toFixed(2)} monthly budget (${((config.costSpent/config.costBudget)*100).toFixed(0)}%). Consider upgrading for higher limits.`
    }
  };

  const message = messages[alertType as keyof typeof messages];

  // TODO: Send actual email via Resend, SendGrid, or Supabase Auth
  // For now, just log and record in database
  console.log(`[COST-ALERTS] ${alertType} for user ${config.userId}:`, message.subject);

  // Record alert in database
  await supabase.from('cost_alerts_sent').insert({
    user_id: config.userId,
    alert_type: alertType,
    message_subject: message.subject,
    message_body: message.body,
    sent_at: new Date().toISOString()
  });

  // Create in-app notification
  await supabase.from('notifications').insert({
    user_id: config.userId,
    type: 'quota_alert',
    title: message.subject,
    message: message.body,
    read: false,
    created_at: new Date().toISOString()
  });
}

// Deno serve helper
function serve(handler: (req: Request) => Promise<Response>) {
  Deno.serve(handler);
}
