-- Create communication_templates table
CREATE TABLE public.communication_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'email',
  subject_line TEXT,
  body_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.communication_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own templates"
ON public.communication_templates
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates"
ON public.communication_templates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
ON public.communication_templates
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
ON public.communication_templates
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_communication_templates_updated_at
BEFORE UPDATE ON public.communication_templates
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();