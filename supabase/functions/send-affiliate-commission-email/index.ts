import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  affiliateEmail: string;
  affiliateName: string;
  commissionAmount: number;
  referralEmail: string;
  subscriptionTier: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { affiliateEmail, affiliateName, commissionAmount, referralEmail, subscriptionTier }: EmailRequest = await req.json();
    
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
    if (!SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY not configured');
    }

    const emailBody = {
      personalizations: [
        {
          to: [{ email: affiliateEmail }],
          subject: '🎉 New Commission Earned!',
        },
      ],
      from: {
        email: Deno.env.get('SENDGRID_SENDER_EMAIL') || 'noreply@careeriq.com',
        name: 'CareerIQ',
      },
      content: [
        {
          type: 'text/html',
          value: `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                  .amount { font-size: 32px; font-weight: bold; color: #667eea; margin: 20px 0; }
                  .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                  .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                  .detail-label { font-weight: 600; color: #6b7280; }
                  .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>💰 Commission Earned!</h1>
                  </div>
                  <div class="content">
                    <p>Hi ${affiliateName || 'there'},</p>
                    <p>Great news! You've earned a new commission from a referral.</p>
                    
                    <div class="amount">$${commissionAmount.toFixed(2)}</div>
                    
                    <div class="details">
                      <div class="detail-row">
                        <span class="detail-label">Referral Email:</span>
                        <span>${referralEmail}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">Subscription Tier:</span>
                        <span>${subscriptionTier}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">Commission Amount:</span>
                        <span>$${commissionAmount.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <p>This commission has been added to your affiliate account and will be included in your next payout.</p>
                    
                    <p style="text-align: center; margin-top: 30px;">
                      <a href="${req.headers.get('origin')}/affiliate-portal" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">View Dashboard</a>
                    </p>
                  </div>
                  <div class="footer">
                    <p>Thank you for being a valued affiliate partner!</p>
                    <p style="font-size: 12px; color: #9ca3af;">This is an automated notification from Career Coach Platform</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        },
      ],
    };

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SendGrid error:', response.status, errorText);
      throw new Error(`SendGrid API error: ${response.status}`);
    }

    console.log('Commission email sent successfully to:', affiliateEmail);

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending commission email:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
