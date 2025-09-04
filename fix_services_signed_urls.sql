-- Fix services table: Convert signed URLs to public URLs for public bucket access
-- This converts expired signed URLs to the correct public URL format

-- First, let's see what we're working with
SELECT 
  id,
  name,
  image,
  CASE
    WHEN image LIKE '%/object/sign/service-images/%' THEN 'SIGNED_URL'
    WHEN image LIKE '%/object/public/service-images/%' THEN 'PUBLIC_URL'
    WHEN image LIKE '%?token=%' THEN 'SIGNED_URL_WITH_TOKEN'
    WHEN image IS NULL OR image = '' THEN 'NULL_OR_EMPTY'
    ELSE 'OTHER'
  END as image_type
FROM services
WHERE image IS NOT NULL AND image != ''
ORDER BY image_type, name;

-- Convert signed URLs to public URLs
UPDATE services
SET image = regexp_replace(image, '/object/sign/service-images/', '/object/public/service-images/')
WHERE image LIKE '%/object/sign/service-images/%';

-- Remove token parameters from URLs
UPDATE services
SET image = regexp_replace(image, '\?token=.*$', '')
WHERE image LIKE '%?token=%';

-- Also fix image2 and image3 columns if they exist
UPDATE services
SET image2 = regexp_replace(image2, '/object/sign/service-images/', '/object/public/service-images/')
WHERE image2 LIKE '%/object/sign/service-images/%';

UPDATE services
SET image2 = regexp_replace(image2, '\?token=.*$', '')
WHERE image2 LIKE '%?token=%';

UPDATE services
SET image3 = regexp_replace(image3, '/object/sign/service-images/', '/object/public/service-images/')
WHERE image3 LIKE '%/object/sign/service-images/%';

UPDATE services
SET image3 = regexp_replace(image3, '\?token=.*$', '')
WHERE image3 LIKE '%?token=%';

-- Verify the changes
SELECT 
  id,
  name,
  image,
  CASE
    WHEN image LIKE '%/object/public/service-images/%' THEN 'PUBLIC_URL'
    WHEN image IS NULL OR image = '' THEN 'NULL_OR_EMPTY'
    ELSE 'OTHER'
  END as image_type
FROM services
WHERE image IS NOT NULL AND image != ''
ORDER BY image_type, name;

-- Example of what a service should look like after the fix:
-- Before: https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/sign/service-images/87908a71-faf4-4624-b2d3-e3cc15f272b5.png?token=...
-- After: https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/public/service-images/87908a71-faf4-4624-b2d3-e3cc15f272b5.png
