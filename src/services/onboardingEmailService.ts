import { ONBOARDING_EMAIL_TEMPLATES, OnboardingEmailId } from "@/config/onboardingEmailTemplates";
import { supabase } from "@/integrations/supabase/client";

interface SendOnboardingEmailOptions {
  userId: string;
  email: string;
  firstName?: string | null;
  appUrl: string;
  senderName?: string;
}

/**
 * Simple token replacement for {{firstName}}, {{appUrl}}, {{senderName}}
 */
function renderTemplate(
  templateBody: string,
  options: SendOnboardingEmailOptions
): string {
  const { firstName, appUrl, senderName } = options;

  return templateBody
    .replace(/{{firstName}}/g, firstName || "there")
    .replace(/{{appUrl}}/g, appUrl)
    .replace(/{{senderName}}/g, senderName || "Your Master Resume Team");
}

export async function sendOnboardingEmail(
  templateId: OnboardingEmailId,
  options: SendOnboardingEmailOptions
) {
  const template = ONBOARDING_EMAIL_TEMPLATES[templateId];
  if (!template) {
    console.warn("Unknown onboarding email template:", templateId);
    return;
  }

  const bodyText = renderTemplate(template.bodyText, options);

  try {
    const { error } = await supabase.functions.invoke("send-onboarding-email", {
      body: {
        to: options.email,
        subject: template.subject,
        text: bodyText,
        userId: options.userId,
        templateId,
      },
    });

    if (error) {
      console.error("Failed to send onboarding email:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error sending onboarding email:", error);
    throw error;
  }
}
