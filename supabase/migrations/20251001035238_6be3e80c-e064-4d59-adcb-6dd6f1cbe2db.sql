-- Add target_positions column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN target_positions text[] DEFAULT NULL;