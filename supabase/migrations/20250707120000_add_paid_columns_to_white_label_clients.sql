-- Migration: Add paid columns and plan to white_label_clients
ALTER TABLE white_label_clients
  ADD COLUMN IF NOT EXISTS ai_search_assistance_paid BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS producer_onboarding_paid BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deep_media_search_paid BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'starter'; 