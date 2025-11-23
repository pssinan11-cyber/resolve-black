-- Enable realtime for complaints table
ALTER TABLE public.complaints REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;

-- Enable realtime for comments table
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

-- Enable realtime for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;