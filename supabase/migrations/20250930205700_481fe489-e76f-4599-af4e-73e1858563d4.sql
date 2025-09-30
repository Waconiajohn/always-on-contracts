-- Add more staffing agencies for comprehensive database
INSERT INTO public.staffing_agencies (agency_name, specialization, contact_email, website, location, notes) VALUES
('Michael Page', ARRAY['Finance', 'Operations', 'HR', 'Technology'], 'info@michaelpage.com', 'https://www.michaelpage.com', 'Global', 'Leading mid-to-senior level recruitment'),
('Spencer Stuart', ARRAY['Executive Search', 'Board Services', 'Leadership Advisory'], 'contact@spencerstuart.com', 'https://www.spencerstuart.com', 'Global', 'Top executive search firm'),
('Egon Zehnder', ARRAY['Executive Search', 'Board Consulting', 'Leadership Development'], 'info@egonzehnder.com', 'https://www.egonzehnder.com', 'Global', 'Executive search and leadership consulting'),
('DHR Global', ARRAY['Executive Search', 'Interim Leadership'], 'info@dhrglobal.com', 'https://www.dhrglobal.com', 'Global', 'Private equity backed search firm'),
('N2Growth', ARRAY['Executive Search', 'Leadership Consulting', 'Interim Executives'], 'info@n2growth.com', 'https://www.n2growth.com', 'Global', 'C-suite and board-level search'),
('Boyden', ARRAY['Executive Search', 'Interim Management', 'Leadership Consulting'], 'info@boyden.com', 'https://www.boyden.com', 'Global', 'Global executive search'),
('Korn Ferry', ARRAY['Executive Search', 'Leadership Development', 'Organizational Strategy'], 'info@kornferry.com', 'https://www.kornferry.com', 'Global', 'Largest executive search firm'),
('Odgers Berndtson', ARRAY['Executive Search', 'Board Practice', 'Leadership Assessment'], 'info@odgersberndtson.com', 'https://www.odgersberndtson.com', 'Global', 'International executive search'),
('Vaco', ARRAY['Finance', 'Accounting', 'Technology', 'Advisory'], 'info@vaco.com', 'https://www.vaco.com', 'National', 'Consulting and staffing services'),
('Lucas Group', ARRAY['Operations', 'Engineering', 'Technology', 'Sales'], 'info@lucasgroup.com', 'https://www.lucasgroup.com', 'National', 'Executive recruiting and career transition'),
('Sanford Rose Associates', ARRAY['Executive Search', 'Professional Staffing'], 'info@sanfordrose.com', 'https://www.sanfordrose.com', 'National', 'Franchise-based recruiting network'),
('Battalia Winston', ARRAY['Executive Search', 'Board Services'], 'info@battaliawinston.com', 'https://www.battaliawinston.com', 'National', 'Executive search and board services'),
('InterimExecs', ARRAY['Interim Executive', 'Interim Management', 'Project Leadership'], 'info@interimexecs.com', 'https://www.interimexecs.com', 'National', 'Specialized in interim placements'),
('Cerius Executives', ARRAY['Interim Executive', 'Project Management', 'Business Transformation'], 'info@ceriusexecutives.com', 'https://www.ceriusexecutives.com', 'National', 'On-demand executive talent'),
('Tatum', ARRAY['Finance', 'Accounting', 'Technology', 'Operations'], 'info@tatumllc.com', 'https://www.tatumllc.com', 'National', 'Executive level consultants'),
('Business Talent Group', ARRAY['Strategy', 'Operations', 'Technology', 'Marketing'], 'info@businesstalentgroup.com', 'https://www.businesstalentgroup.com', 'National', 'Independent consultants and executives'),
('Hatchet', ARRAY['Operations', 'Finance', 'Technology'], 'info@hatchet.ai', 'https://www.hatchet.ai', 'National', 'Executive search and interim leadership'),
('Flexe Talent', ARRAY['CX', 'Operations', 'Technology'], 'info@flexetalent.com', 'https://www.flexetalent.com', 'National', 'Flexible executive talent'),
('Magellan International', ARRAY['Executive Search', 'Consulting'], 'info@magellan-intl.com', 'https://www.magellan-intl.com', 'National', 'Executive recruitment services'),
('CTPartners', ARRAY['Executive Search', 'Leadership Advisory'], 'info@ctnet.com', 'https://www.ctpartners.com', 'Global', 'Executive search and talent advisory')
ON CONFLICT DO NOTHING;