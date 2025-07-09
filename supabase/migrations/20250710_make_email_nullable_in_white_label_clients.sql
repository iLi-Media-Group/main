-- Migration: Make email column nullable in white_label_clients
ALTER TABLE white_label_clients ALTER COLUMN email DROP NOT NULL; 