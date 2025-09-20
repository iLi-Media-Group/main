-- Add screening questions to producer applications table
-- Run this in Supabase SQL Editor to add the new fields

-- Add new screening question fields
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS signed_to_label TEXT CHECK (signed_to_label IN ('Yes', 'No')),
ADD COLUMN IF NOT EXISTS label_relationship_explanation TEXT,
ADD COLUMN IF NOT EXISTS signed_to_publisher TEXT CHECK (signed_to_publisher IN ('Yes', 'No')),
ADD COLUMN IF NOT EXISTS publisher_relationship_explanation TEXT,
ADD COLUMN IF NOT EXISTS signed_to_manager TEXT CHECK (signed_to_manager IN ('Yes', 'No')),
ADD COLUMN IF NOT EXISTS manager_relationship_explanation TEXT,
ADD COLUMN IF NOT EXISTS entity_collects_payment TEXT CHECK (entity_collects_payment IN ('Yes', 'No')),
ADD COLUMN IF NOT EXISTS payment_collection_explanation TEXT,
ADD COLUMN IF NOT EXISTS production_master_percentage INTEGER CHECK (production_master_percentage >= 0 AND production_master_percentage <= 100);

-- Add a computed column to determine if application should be saved for later review
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS requires_review BOOLEAN GENERATED ALWAYS AS (
  signed_to_label = 'Yes' OR 
  signed_to_publisher = 'Yes' OR 
  signed_to_manager = 'Yes' OR 
  entity_collects_payment = 'Yes' OR 
  (production_master_percentage IS NOT NULL AND production_master_percentage < 100)
) STORED;

-- Add index for efficient querying of applications that need review
CREATE INDEX IF NOT EXISTS idx_producer_applications_requires_review 
ON producer_applications(requires_review) 
WHERE requires_review = true;

-- Add index for production master percentage queries
CREATE INDEX IF NOT EXISTS idx_producer_applications_master_percentage 
ON producer_applications(production_master_percentage) 
WHERE production_master_percentage < 100;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'producer_applications' 
AND column_name IN (
  'signed_to_label',
  'label_relationship_explanation',
  'signed_to_publisher',
  'publisher_relationship_explanation',
  'signed_to_manager',
  'manager_relationship_explanation',
  'entity_collects_payment',
  'payment_collection_explanation',
  'production_master_percentage',
  'requires_review'
)
ORDER BY column_name;
