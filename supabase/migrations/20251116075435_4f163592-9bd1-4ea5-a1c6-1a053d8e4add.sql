-- Fix notifications table RLS policy to prevent unauthorized inserts
-- Drop the overly permissive policy that allows any authenticated user to create notifications
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a new policy that restricts notification creation to service role only
-- This ensures only backend systems (triggers, edge functions with service role) can create notifications
CREATE POLICY "Service role can create notifications"
ON public.notifications FOR INSERT
TO service_role
WITH CHECK (true);

-- Note: Applications should create notifications through:
-- 1. Database triggers (SECURITY DEFINER functions)
-- 2. Edge functions using service role key
-- 3. Backend systems, not directly from client code