-- Enable realtime for comments table
ALTER TABLE public.comments REPLICA IDENTITY FULL;

-- The comments table will automatically be included in realtime publication