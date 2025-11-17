-- Create security logs table for monitoring security events
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'failed_auth', 'failed_authz', 'suspicious_activity', 'rate_limit', etc.
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  endpoint TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX idx_security_logs_severity ON public.security_logs(severity);
CREATE INDEX idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX idx_security_logs_created_at ON public.security_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs
CREATE POLICY "Admins can view security logs"
ON public.security_logs FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Service role can insert security logs
CREATE POLICY "Service role can insert security logs"
ON public.security_logs FOR INSERT
TO service_role
WITH CHECK (true);

-- Create a function to log security events (can be called from edge functions)
CREATE OR REPLACE FUNCTION public.log_security_event(
  _event_type TEXT,
  _severity TEXT,
  _user_id UUID DEFAULT NULL,
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL,
  _endpoint TEXT DEFAULT NULL,
  _details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
BEGIN
  INSERT INTO public.security_logs (
    event_type,
    severity,
    user_id,
    ip_address,
    user_agent,
    endpoint,
    details
  ) VALUES (
    _event_type,
    _severity,
    _user_id,
    _ip_address,
    _user_agent,
    _endpoint,
    _details
  ) RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;