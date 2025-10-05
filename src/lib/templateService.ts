import { supabase } from "@/integrations/supabase/client";

export interface Template {
  id: string;
  template_name: string;
  template_type: string;
  subject_line: string | null;
  body_content: string;
  created_at: string;
  user_id: string;
}

interface TemplateVariables {
  // User data
  your_name?: string;
  your_email?: string;
  your_phone?: string;
  
  // Resume data
  your_title?: string;
  years_experience?: number;
  key_achievements?: string[];
  target_rate?: string;
  skills?: string[];
  
  // Agency data
  agency_name?: string;
  contact_name?: string;
  specialization?: string;
  
  // Job data
  job_title?: string;
  company_name?: string;
  position?: string;
}

export const fetchTemplateVariables = async (agencyId?: string): Promise<TemplateVariables> => {
  const variables: TemplateVariables = {};
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return variables;

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      variables.your_name = profile.full_name || '';
      variables.your_email = profile.email || user.email;
      variables.your_phone = profile.phone || '';
    }

    // Fetch resume analysis
    const { data: analysis } = await supabase
      .from('resume_analysis')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (analysis) {
      variables.years_experience = analysis.years_experience || 0;
      variables.key_achievements = analysis.key_achievements || [];
      variables.skills = analysis.skills || [];
      
      if (analysis.target_hourly_rate_min && analysis.target_hourly_rate_max) {
        variables.target_rate = `$${analysis.target_hourly_rate_min}-$${analysis.target_hourly_rate_max}/hr`;
      }
      
      if (analysis.recommended_positions && analysis.recommended_positions.length > 0) {
        variables.your_title = analysis.recommended_positions[0];
        variables.position = analysis.recommended_positions[0];
      }
    }

    // Fetch agency data if provided
    if (agencyId) {
      const { data: agency } = await supabase
        .from('staffing_agencies')
        .select('agency_name, specialization')
        .eq('id', agencyId)
        .single();

      if (agency) {
        variables.agency_name = agency.agency_name;
        variables.specialization = agency.specialization?.[0] || '';
      }
    }
  } catch (error) {
    console.error('Error fetching template variables:', error);
  }

  return variables;
};

/**
 * Fetch all communication templates for the authenticated user
 * @returns Array of templates sorted by creation date (newest first)
 * @throws Error if user is not authenticated or if database query fails
 */
export const fetchUserTemplates = async (): Promise<Template[]> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) throw userError;
  if (!user) throw new Error("User not authenticated");
  
  const { data, error } = await supabase
    .from("communication_templates")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
    
  if (error) throw error;
  return data || [];
};

export const populateTemplate = (template: string, variables: TemplateVariables): string => {
  let populated = template;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    
    if (Array.isArray(value)) {
      populated = populated.replace(regex, value.slice(0, 3).join(', '));
    } else {
      populated = populated.replace(regex, String(value || ''));
    }
  });

  // Remove any remaining unpopulated variables
  populated = populated.replace(/{{[^}]+}}/g, '[Not Available]');

  return populated;
};

export const generateMailtoLink = (
  toEmail: string,
  subject: string,
  body: string,
  variables: TemplateVariables
): string => {
  const populatedSubject = populateTemplate(subject, variables);
  const populatedBody = populateTemplate(body, variables);
  
  return `mailto:${toEmail}?subject=${encodeURIComponent(populatedSubject)}&body=${encodeURIComponent(populatedBody)}`;
};
