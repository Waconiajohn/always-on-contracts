-- Clean up test activity data
DELETE FROM public.vault_activity_log 
WHERE description = 'Test activity';