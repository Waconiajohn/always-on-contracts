import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error('[send-interview-communication] Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      communicationId, 
      recipientEmail, 
      recipientName,
      subject,
      body,
      scheduledFor
    } = await req.json();

    // Get user's profile for sender info
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', user.id)
      .single();

    const senderEmail = profile?.email || 'noreply@example.com';
    const senderName = profile?.full_name || 'Career Copilot User';

    // If scheduled for future, just update the communication record
    if (scheduledFor && new Date(scheduledFor) > new Date()) {
      const { error: updateError } = await supabaseClient
        .from('interview_communications')
        .update({
          status: 'scheduled',
          scheduled_for: scheduledFor,
          recipient_email: recipientEmail,
          recipient_name: recipientName,
          subject_line: subject,
          body_content: body
        })
        .eq('id', communicationId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email scheduled successfully',
          scheduled: true 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Check if SENDGRID_API_KEY is available
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
    const sendgridSender = Deno.env.get('SENDGRID_SENDER_EMAIL');

    if (!sendgridApiKey || !sendgridSender) {
      console.warn('SendGrid not configured, simulating email send');
      
      // Update communication as sent (simulation)
      const { error: updateError } = await supabaseClient
        .from('interview_communications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          recipient_email: recipientEmail,
          recipient_name: recipientName,
          subject_line: subject,
          body_content: body
        })
        .eq('id', communicationId);

      if (updateError) throw updateError;

      // Update job project follow-up status
      const { data: comm } = await supabaseClient
        .from('interview_communications')
        .select('job_project_id, communication_type')
        .eq('id', communicationId)
        .single();

      if (comm) {
        await supabaseClient
          .from('job_projects')
          .update({
            follow_up_sent: true,
            next_follow_up_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('id', comm.job_project_id);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email simulated (SendGrid not configured)',
          simulated: true 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Send actual email via SendGrid
    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: recipientEmail, name: recipientName }],
          subject: subject
        }],
        from: { email: sendgridSender, name: senderName },
        reply_to: { email: senderEmail, name: senderName },
        content: [{
          type: 'text/html',
          value: body.replace(/\n/g, '<br>')
        }]
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('SendGrid error:', emailResponse.status, errorText);
      
      // Mark as failed
      await supabaseClient
        .from('interview_communications')
        .update({
          status: 'failed',
          metadata: { error: errorText }
        })
        .eq('id', communicationId);

      throw new Error(`Email sending failed: ${emailResponse.status}`);
    }

    // Update communication as sent
    const { error: updateError } = await supabaseClient
      .from('interview_communications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        subject_line: subject,
        body_content: body
      })
      .eq('id', communicationId);

    if (updateError) throw updateError;

    // Update job project follow-up status
    const { data: comm } = await supabaseClient
      .from('interview_communications')
      .select('job_project_id, communication_type')
      .eq('id', communicationId)
      .single();

    if (comm) {
      await supabaseClient
        .from('job_projects')
        .update({
          follow_up_sent: true,
          next_follow_up_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', comm.job_project_id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error sending communication:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});