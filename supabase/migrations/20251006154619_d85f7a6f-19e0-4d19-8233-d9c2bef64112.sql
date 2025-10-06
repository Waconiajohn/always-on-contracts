-- Enable realtime for processing queue
ALTER PUBLICATION supabase_realtime ADD TABLE public.resume_processing_queue;

-- Enable realtime for processing logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.processing_logs;