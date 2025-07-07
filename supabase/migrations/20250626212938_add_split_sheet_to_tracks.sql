/*
  # Add Split Sheet Support to Tracks

  1. Changes
    - Add split_sheet_url column to tracks table for PDF split sheets
    - This allows producers to upload split sheets showing all contributors
    - Clients can view split sheets to understand the complete production team

  2. Purpose
    - Provides transparency about who contributed to each track
    - Helps clients understand it's a one-stop production despite multiple contributors
    - Essential for licensing and rights management
*/

-- Add split_sheet_url column to tracks table
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS split_sheet_url text;

-- Add comment to document the purpose
COMMENT ON COLUMN tracks.split_sheet_url IS 'URL to PDF split sheet showing all contributors and their percentages for this track';

-- Create index for efficient querying of tracks with split sheets
CREATE INDEX IF NOT EXISTS idx_tracks_split_sheet_url 
ON tracks(split_sheet_url) 
WHERE split_sheet_url IS NOT NULL;

-- Migration: Add owner_email column to white_label_clients table
ALTER TABLE white_label_clients ADD COLUMN IF NOT EXISTS owner_email TEXT;
