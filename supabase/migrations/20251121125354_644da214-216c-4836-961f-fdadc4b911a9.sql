-- Critical Security Fix: Add explicit denial of anonymous access to all sensitive tables

-- Profiles table: Deny anonymous access
CREATE POLICY "Deny anonymous access to profiles" 
ON public.profiles 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- User roles table: Deny anonymous access
CREATE POLICY "Deny anonymous access to user_roles" 
ON public.user_roles 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Complaints table: Deny anonymous access
CREATE POLICY "Deny anonymous access to complaints" 
ON public.complaints 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Attachments table: Deny anonymous access
CREATE POLICY "Deny anonymous access to attachments" 
ON public.attachments 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Comments table: Deny anonymous access
CREATE POLICY "Deny anonymous access to comments" 
ON public.comments 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Ratings table: Deny anonymous access
CREATE POLICY "Deny anonymous access to ratings" 
ON public.ratings 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Notifications table: Deny anonymous access
CREATE POLICY "Deny anonymous access to notifications" 
ON public.notifications 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Audit log table: Deny anonymous access
CREATE POLICY "Deny anonymous access to audit_log" 
ON public.audit_log 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Security logs table: Deny anonymous access
CREATE POLICY "Deny anonymous access to security_logs" 
ON public.security_logs 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Suspicious activities table: Deny anonymous access
CREATE POLICY "Deny anonymous access to suspicious_activities" 
ON public.suspicious_activities 
FOR ALL 
USING (auth.uid() IS NOT NULL);