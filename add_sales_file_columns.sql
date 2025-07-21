-- Migration: Add file path columns to sales table for split sheets, stems, and trackouts
ALTER TABLE sales
  ADD COLUMN split_sheet_path text,
  ADD COLUMN stems_path text,
  ADD COLUMN trackouts_path text,
  ADD COLUMN mp3_path text; 