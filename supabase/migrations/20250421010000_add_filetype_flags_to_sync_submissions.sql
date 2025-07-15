-- Add filetype flags to sync_submissions
ALTER TABLE sync_submissions
  ADD COLUMN has_mp3 BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN has_stems BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN has_trackouts BOOLEAN NOT NULL DEFAULT FALSE; 