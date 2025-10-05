-- Create a security definer function to check user roles
-- This function bypasses RLS to prevent infinite recursion
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Drop existing policies on user_roles
drop policy if exists "Admins can manage user roles" on public.user_roles;
drop policy if exists "Users can view their own roles" on public.user_roles;

-- Create new policies using the security definer function
create policy "Admins can manage all user roles"
on public.user_roles
for all
using (public.has_role(auth.uid(), 'admin'));

create policy "Users can view their own roles"
on public.user_roles
for select
using (auth.uid() = user_id);