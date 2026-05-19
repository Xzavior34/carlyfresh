-- Add push_token column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_token text;
