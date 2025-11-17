-- Create suspicious activities table to store detected threats
CREATE TABLE IF NOT EXISTS public.suspicious_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT NOT NULL, -- 'brute_force_ip', 'brute_force_user', 'privilege_escalation', 'suspicious_pattern'
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  detection_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  time_window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  time_window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  event_count INTEGER NOT NULL,
  details JSONB,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_suspicious_activities_type ON public.suspicious_activities(activity_type);
CREATE INDEX idx_suspicious_activities_severity ON public.suspicious_activities(severity);
CREATE INDEX idx_suspicious_activities_user_id ON public.suspicious_activities(user_id);
CREATE INDEX idx_suspicious_activities_ip ON public.suspicious_activities(ip_address);
CREATE INDEX idx_suspicious_activities_resolved ON public.suspicious_activities(resolved);
CREATE INDEX idx_suspicious_activities_detection_time ON public.suspicious_activities(detection_time DESC);

-- Enable RLS
ALTER TABLE public.suspicious_activities ENABLE ROW LEVEL SECURITY;

-- Only admins can view suspicious activities
CREATE POLICY "Admins can view suspicious activities"
ON public.suspicious_activities FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Only admins can update suspicious activities (to mark as resolved)
CREATE POLICY "Admins can update suspicious activities"
ON public.suspicious_activities FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Service role can insert suspicious activities
CREATE POLICY "Service role can insert suspicious activities"
ON public.suspicious_activities FOR INSERT
TO service_role
WITH CHECK (true);

-- Create function to detect suspicious patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _time_window INTERVAL := INTERVAL '15 minutes';
  _ip_threshold INTEGER := 5; -- 5 failed attempts from same IP
  _user_threshold INTEGER := 3; -- 3 failed attempts for same user
  _authz_threshold INTEGER := 3; -- 3 failed authorization attempts
  _current_time TIMESTAMP WITH TIME ZONE := NOW();
  _window_start TIMESTAMP WITH TIME ZONE := NOW() - _time_window;
BEGIN
  -- Detect brute force attacks by IP (multiple failed auth from same IP)
  INSERT INTO public.suspicious_activities (
    activity_type,
    severity,
    ip_address,
    time_window_start,
    time_window_end,
    event_count,
    details
  )
  SELECT 
    'brute_force_ip',
    CASE 
      WHEN COUNT(*) >= 10 THEN 'critical'
      WHEN COUNT(*) >= 7 THEN 'high'
      ELSE 'medium'
    END,
    ip_address,
    _window_start,
    _current_time,
    COUNT(*)::INTEGER,
    jsonb_build_object(
      'endpoints', jsonb_agg(DISTINCT endpoint),
      'user_agents', jsonb_agg(DISTINCT user_agent),
      'failed_attempts', COUNT(*)
    )
  FROM public.security_logs
  WHERE event_type = 'failed_auth'
    AND ip_address IS NOT NULL
    AND created_at >= _window_start
    AND created_at <= _current_time
    -- Exclude already detected patterns
    AND ip_address NOT IN (
      SELECT ip_address 
      FROM public.suspicious_activities 
      WHERE activity_type = 'brute_force_ip'
        AND detection_time >= _window_start
        AND ip_address IS NOT NULL
    )
  GROUP BY ip_address
  HAVING COUNT(*) >= _ip_threshold;

  -- Detect brute force attacks by user (multiple failed auth for same user)
  INSERT INTO public.suspicious_activities (
    activity_type,
    severity,
    user_id,
    time_window_start,
    time_window_end,
    event_count,
    details
  )
  SELECT 
    'brute_force_user',
    CASE 
      WHEN COUNT(*) >= 5 THEN 'high'
      ELSE 'medium'
    END,
    user_id,
    _window_start,
    _current_time,
    COUNT(*)::INTEGER,
    jsonb_build_object(
      'ip_addresses', jsonb_agg(DISTINCT ip_address),
      'endpoints', jsonb_agg(DISTINCT endpoint),
      'failed_attempts', COUNT(*)
    )
  FROM public.security_logs
  WHERE event_type = 'failed_auth'
    AND user_id IS NOT NULL
    AND created_at >= _window_start
    AND created_at <= _current_time
    AND user_id NOT IN (
      SELECT user_id 
      FROM public.suspicious_activities 
      WHERE activity_type = 'brute_force_user'
        AND detection_time >= _window_start
        AND user_id IS NOT NULL
    )
  GROUP BY user_id
  HAVING COUNT(*) >= _user_threshold;

  -- Detect privilege escalation attempts (multiple failed authz)
  INSERT INTO public.suspicious_activities (
    activity_type,
    severity,
    user_id,
    ip_address,
    time_window_start,
    time_window_end,
    event_count,
    details
  )
  SELECT 
    'privilege_escalation',
    'high',
    user_id,
    ip_address,
    _window_start,
    _current_time,
    COUNT(*)::INTEGER,
    jsonb_build_object(
      'endpoints', jsonb_agg(DISTINCT endpoint),
      'attempts', COUNT(*),
      'details', jsonb_agg(details)
    )
  FROM public.security_logs
  WHERE event_type = 'failed_authz'
    AND user_id IS NOT NULL
    AND created_at >= _window_start
    AND created_at <= _current_time
    AND user_id NOT IN (
      SELECT user_id 
      FROM public.suspicious_activities 
      WHERE activity_type = 'privilege_escalation'
        AND detection_time >= _window_start
        AND user_id IS NOT NULL
    )
  GROUP BY user_id, ip_address
  HAVING COUNT(*) >= _authz_threshold;

  -- Create notifications for new suspicious activities
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    complaint_id
  )
  SELECT 
    ur.user_id,
    'Suspicious Activity Detected',
    CASE 
      WHEN sa.activity_type = 'brute_force_ip' 
        THEN 'Multiple failed authentication attempts detected from IP: ' || COALESCE(sa.ip_address, 'unknown')
      WHEN sa.activity_type = 'brute_force_user' 
        THEN 'Multiple failed authentication attempts detected for a user account'
      WHEN sa.activity_type = 'privilege_escalation' 
        THEN 'Multiple privilege escalation attempts detected'
      ELSE 'Suspicious activity detected'
    END || ' (' || sa.event_count || ' attempts in 15 minutes)',
    NULL
  FROM public.suspicious_activities sa
  CROSS JOIN public.user_roles ur
  WHERE sa.detection_time >= _window_start
    AND ur.role = 'admin'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n 
      WHERE n.user_id = ur.user_id 
        AND n.created_at >= _window_start
        AND n.message LIKE '%' || COALESCE(sa.ip_address, sa.user_id::TEXT, 'unknown') || '%'
    );
END;
$$;