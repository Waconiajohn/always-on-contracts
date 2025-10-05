-- Drop the old problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Verify the correct policy exists (this should already be in place)
-- If it doesn't exist, create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND policyname = 'Admins can manage all user roles'
  ) THEN
    CREATE POLICY "Admins can manage all user roles"
    ON public.user_roles
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;