-- Update all admin policies to use the has_role function to prevent infinite recursion

-- Update promo_codes policies
DROP POLICY IF EXISTS "Admins can manage promo codes" ON public.promo_codes;
CREATE POLICY "Admins can manage promo codes"
ON public.promo_codes
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update retirement_access_codes policies
DROP POLICY IF EXISTS "Admins can manage retirement codes" ON public.retirement_access_codes;
CREATE POLICY "Admins can manage retirement codes"
ON public.retirement_access_codes
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update affiliate_commissions policies
DROP POLICY IF EXISTS "Admins can update commissions" ON public.affiliate_commissions;
CREATE POLICY "Admins can update commissions"
ON public.affiliate_commissions
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Update affiliate_fraud_flags policies
DROP POLICY IF EXISTS "Admins can view fraud flags" ON public.affiliate_fraud_flags;
CREATE POLICY "Admins can view fraud flags"
ON public.affiliate_fraud_flags
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Update affiliates policies
DROP POLICY IF EXISTS "Admins can manage affiliates" ON public.affiliates;
CREATE POLICY "Admins can manage affiliates"
ON public.affiliates
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));