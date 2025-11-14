-- Enable full replica identity for extraction_progress table
ALTER TABLE extraction_progress REPLICA IDENTITY FULL;