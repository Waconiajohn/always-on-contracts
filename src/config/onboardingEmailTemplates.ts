export type OnboardingEmailId =
  | "welcome"
  | "targetedResume"
  | "linkedinPresence"
  | "interviewsAndRetirement";

export interface OnboardingEmailTemplate {
  id: OnboardingEmailId;
  subject: string;
  bodyText: string;
}

export const ONBOARDING_EMAIL_TEMPLATES: Record<
  OnboardingEmailId,
  OnboardingEmailTemplate
> = {
  welcome: {
    id: "welcome",
    subject: "Welcome – let's build your Career Vault",
    bodyText: `
Hi {{firstName}},

Welcome — and thanks for trusting us with your next chapter.

The first thing we'll do together is build your Career Vault: a single, accurate record of your experience, results, and strengths. You upload your resume once, answer a few focused questions, and we do the heavy lifting—quantifying accomplishments, clarifying scope, and capturing the way you actually lead.

From there, every targeted resume, LinkedIn update, and interview prep guide comes from the same master record. No more starting from a blank page for each opportunity.

What to do next (5–10 minutes):

1. Upload your most recent resume
2. Review the initial Career Vault summary
3. Answer 2–3 short Smart Questions to sharpen your story

You stay in control at every step. You can edit, add, or remove anything in your Career Vault as we go.

When you're ready, click below to begin:

Start building my Career Vault: {{appUrl}}/career-vault

Best,
{{senderName}}
`.trim(),
  },

  targetedResume: {
    id: "targetedResume",
    subject: "Turn your Career Vault into a targeted resume",
    bodyText: `
Hi {{firstName}},

Now that your Career Vault is taking shape, you can use it to build resumes that speak directly to a specific role.

Instead of rewriting everything from scratch, we:

• Start with your Career Vault (your "master file")
• Align it to a job description you paste or save
• Highlight the most relevant achievements, metrics, and skills for that opportunity

You stay in control — you can adjust wording, emphasis, and level of detail before you download or send anything.

Try this next:

1. Save or paste a job posting you're interested in
2. Click "Build targeted resume" from that job
3. Review the suggested resume and make any edits you prefer

Every time you strengthen your Career Vault, your future resumes get better automatically.

Build my first targeted resume: {{appUrl}}/resume-builder

Best,
{{senderName}}
`.trim(),
  },

  linkedinPresence: {
    id: "linkedinPresence",
    subject: "Use your Career Vault to refresh LinkedIn",
    bodyText: `
Hi {{firstName}},

Your Career Vault doesn't just power resumes — it also makes LinkedIn much easier.

Because your experience, results, and leadership story are already organized, we can help you:

• Draft a headline that matches your target roles
• Shape an About summary that sounds like you
• Refresh experience bullets with clear, quantified impact
• Turn key experiences into thoughtful LinkedIn posts

You don't need to guess what to say. We pull from your Career Vault, and you decide what to keep or adjust.

Good next step:

• Open the LinkedIn section in the app
• Start with your headline and About summary
• Then update one or two roles with stronger impact statements

Refresh my LinkedIn from my Career Vault: {{appUrl}}/linkedin

Warmly,
{{senderName}}
`.trim(),
  },

  interviewsAndRetirement: {
    id: "interviewsAndRetirement",
    subject: "From Career Vault to confident interviews",
    bodyText: `
Hi {{firstName}},

As you start to get traction, your Career Vault becomes your best interview resource.

We use it to:

• Pull out ready-made stories for behavioral questions (results, scope, team leadership, change)
• Align your examples to a specific job description
• Organize everything into a simple prep guide you can review before each meeting

You don't have to invent stories on the spot — we start from the data you've already given us, then help you shape it into clear, confident answers.

If it's helpful, we can also connect your career decisions with the retirement side of your transition. As a client who opens an account for retirement planning, the software is included at no additional cost.

You can:

• Generate an interview prep guide here: {{appUrl}}/interview-prep
• Learn more about retirement planning support here: {{appUrl}}/retirement

If you prefer to focus only on the job search, that's perfectly fine — you're always in control of how you use these tools.

Best regards,
{{senderName}}
`.trim(),
  },
};
