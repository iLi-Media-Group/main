-- Add sample services data
INSERT INTO services (type, name, description, contact, website, image, subgenres, tier, style_tags) VALUES
-- Recording Studios
('studios', 'Echo Valley Studios', 'Professional recording studio specializing in vocal tracking and full band sessions. State-of-the-art equipment and experienced engineers.', 'info@echovalleystudios.com', 'https://echovalleystudios.com', 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=400&h=400&fit=crop', ARRAY['Vocal Tracking (Hip-Hop, R&B, Pop, etc.)', 'Full Band Tracking (Rock, Jazz, Indie)'], 'Premium Studio', NULL),

('studios', 'Urban Beats Lab', 'Hip-hop focused studio with dedicated vocal booths and mixing suites. Perfect for rappers and producers.', 'book@urbanbeatslab.com', 'https://urbanbeatslab.com', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop', ARRAY['Vocal Tracking (Hip-Hop, R&B, Pop, etc.)', 'Mixing Suite Access'], 'Premium Studio', NULL),

('studios', 'Podcast Pro Studio', 'Specialized podcast recording facility with sound-treated rooms and professional audio equipment.', 'hello@podcastpro.com', 'https://podcastpro.com', 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=400&fit=crop', ARRAY['Podcast Recording', 'Voiceover/ADR'], 'Project Studio', NULL),

-- Recording Engineers
('engineers', 'Sarah Chen', 'Award-winning mixing engineer with 15+ years experience in pop, rock, and electronic music.', 'sarah@mixmaster.com', 'https://mixmaster.com', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop', ARRAY['Mixing Engineer', 'Mastering Engineer'], NULL, NULL),

('engineers', 'Marcus Johnson', 'Vocal specialist engineer known for working with top R&B and hip-hop artists. Expert in vocal processing and effects.', 'marcus@vocalpro.com', 'https://vocalpro.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', ARRAY['Vocal Engineer', 'Post-Production Engineer'], NULL, NULL),

('engineers', 'Alex Rivera', 'Live recording specialist with experience in capturing concerts, festivals, and acoustic sessions.', 'alex@livesound.com', 'https://livesound.com', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop', ARRAY['Live Recording Engineer', 'Sound Design / FX Engineer'], NULL, NULL),

-- Graphic Artists
('artists', 'Creative Canvas Studio', 'Full-service design studio specializing in album artwork, branding, and promotional materials.', 'hello@creativecanvas.com', 'https://creativecanvas.com', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=400&fit=crop', ARRAY['Cover Art Design', 'Branding Packages', 'Album Packaging Design'], NULL, ARRAY['Modern', 'Minimalist', '3D']),

('artists', 'Retro Design Co.', 'Vintage-inspired artwork and branding with a focus on retro aesthetics and hand-drawn elements.', 'info@retrodesign.com', 'https://retrodesign.com', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', ARRAY['Cover Art Design', 'Logo Design', 'Merch Design'], NULL, ARRAY['Retro', 'Hand-Drawn', 'Vintage']),

('artists', 'Digital Dreams', 'Modern digital art studio specializing in 3D renders, motion graphics, and social media content.', 'contact@digitaldreams.com', 'https://digitaldreams.com', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop', ARRAY['Motion Graphics / Lyric Videos', 'YouTube Thumbnails', 'Instagram Promo Design'], NULL, ARRAY['3D', 'Modern', 'Abstract']),

('artists', 'Cartoon Creations', 'Fun and playful cartoon-style artwork perfect for children''s music, comedy, and light-hearted projects.', 'hello@cartooncreations.com', 'https://cartooncreations.com', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', ARRAY['Cover Art Design', 'YouTube Thumbnails', 'Merch Design'], NULL, ARRAY['Cartoon', 'Playful', 'Colorful']);

-- Add more sample data for variety
INSERT INTO services (type, name, description, contact, website, image, subgenres, tier, style_tags) VALUES
('studios', 'Mobile Recording Solutions', 'On-location recording services for events, live performances, and location shoots.', 'mobile@recordingsolutions.com', 'https://recordingsolutions.com', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop', ARRAY['Mobile Studio', 'Live Recording Engineer'], 'Mobile Studio', NULL),

('engineers', 'Emma Thompson', 'Podcast and voiceover specialist with expertise in audio restoration and cleanup.', 'emma@voicepro.com', 'https://voicepro.com', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop', ARRAY['Podcast Engineer', 'Audio Restoration / Cleanup'], NULL, NULL),

('artists', 'Photorealistic Pro', 'Hyper-realistic artwork and photorealistic designs for premium album releases.', 'contact@photorealisticpro.com', 'https://photorealisticpro.com', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=400&fit=crop', ARRAY['Cover Art Design', 'Album Packaging Design'], NULL, ARRAY['Photorealistic', 'Modern', 'Premium']); 