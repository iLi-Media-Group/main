-- Add sample data for testing analytics
-- This will create sample sales, sync proposals, and custom sync requests

-- First, let's check if we have any profiles to work with
SELECT 'CHECKING PROFILES' as info;
SELECT id, email, account_type FROM profiles LIMIT 5;

-- Add sample track license sales
-- Note: Replace the UUIDs with actual profile and track IDs from your database
INSERT INTO sales (
  track_id,
  buyer_id,
  license_type,
  amount,
  payment_method,
  transaction_id,
  created_at,
  licensee_info,
  producer_id
) VALUES 
-- Sample sales for the last 3 months
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'exclusive', 299.99, 'stripe', 'txn_001', NOW() - INTERVAL '2 days', '{"company": "Sample Studio"}', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', 'non_exclusive', 149.99, 'stripe', 'txn_002', NOW() - INTERVAL '5 days', '{"company": "Music Label"}', '550e8400-e29b-41d4-a716-446655440006'),
('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440008', 'exclusive', 399.99, 'stripe', 'txn_003', NOW() - INTERVAL '10 days', '{"company": "Film Studio"}', '550e8400-e29b-41d4-a716-446655440009'),
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440011', 'non_exclusive', 199.99, 'stripe', 'txn_004', NOW() - INTERVAL '15 days', '{"company": "TV Network"}', '550e8400-e29b-41d4-a716-446655440012'),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440014', 'exclusive', 599.99, 'stripe', 'txn_005', NOW() - INTERVAL '20 days', '{"company": "Game Studio"}', '550e8400-e29b-41d4-a716-446655440015');

-- Add sample sync proposals
INSERT INTO sync_proposals (
  track_id,
  client_id,
  sync_fee,
  payment_status,
  status,
  created_at
) VALUES 
-- Sample sync proposals for the last 3 months
('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440017', 250.00, 'paid', 'accepted', NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440019', 175.00, 'paid', 'accepted', NOW() - INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440021', 300.00, 'paid', 'accepted', NOW() - INTERVAL '12 days'),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440023', 200.00, 'paid', 'accepted', NOW() - INTERVAL '18 days'),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440025', 350.00, 'paid', 'accepted', NOW() - INTERVAL '25 days');

-- Add sample custom sync requests
INSERT INTO custom_sync_requests (
  client_id,
  preferred_producer_id,
  sync_fee,
  status,
  created_at
) VALUES 
-- Sample custom sync requests for the last 3 months
('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440027', 400.00, 'completed', NOW() - INTERVAL '4 days'),
('550e8400-e29b-41d4-a716-446655440028', '550e8400-e29b-41d4-a716-446655440029', 275.00, 'completed', NOW() - INTERVAL '8 days'),
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440031', 325.00, 'completed', NOW() - INTERVAL '14 days'),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440033', 225.00, 'completed', NOW() - INTERVAL '19 days'),
('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440035', 450.00, 'completed', NOW() - INTERVAL '26 days');

-- Verify the data was added
SELECT 'VERIFICATION - SALES' as info;
SELECT COUNT(*) as total_sales FROM sales;

SELECT 'VERIFICATION - SYNC PROPOSALS' as info;
SELECT COUNT(*) as total_sync_proposals FROM sync_proposals WHERE payment_status = 'paid' AND status = 'accepted';

SELECT 'VERIFICATION - CUSTOM SYNC REQUESTS' as info;
SELECT COUNT(*) as total_custom_sync_requests FROM custom_sync_requests WHERE status = 'completed';

-- Show total revenue
SELECT 'TOTAL REVENUE SUMMARY' as info;
SELECT 
  'Track Sales' as type,
  COUNT(*) as count,
  SUM(amount) as revenue
FROM sales 
WHERE deleted_at IS NULL
UNION ALL
SELECT 
  'Sync Proposals' as type,
  COUNT(*) as count,
  SUM(sync_fee) as revenue
FROM sync_proposals 
WHERE payment_status = 'paid' AND status = 'accepted'
UNION ALL
SELECT 
  'Custom Sync Requests' as type,
  COUNT(*) as count,
  SUM(sync_fee) as revenue
FROM custom_sync_requests 
WHERE status = 'completed'; 