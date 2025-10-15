-- Grant full access to the user account
INSERT INTO public.retirement_access_codes (user_id, code, is_active, created_by, created_at)
VALUES ('ce0e7705-f4f3-47e0-9aaa-99c6ea325b1b', 'ADMIN_FULL_ACCESS', true, 'ce0e7705-f4f3-47e0-9aaa-99c6ea325b1b', now())
ON CONFLICT (code) DO UPDATE SET is_active = true, user_id = 'ce0e7705-f4f3-47e0-9aaa-99c6ea325b1b';