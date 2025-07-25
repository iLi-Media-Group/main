-- Add AI-generated music field to producer_applications table
-- This is a disqualifying question - if "Yes", the application will be auto-disqualified

DO $$
BEGIN
  -- Add the ai_generated_music column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'producer_applications' AND column_name = 'ai_generated_music'
  ) THEN
    ALTER TABLE public.producer_applications ADD COLUMN ai_generated_music text;
    
    -- Add a comment to explain the field
    COMMENT ON COLUMN public.producer_applications.ai_generated_music IS 'Disqualifying question: Do you use AI to create music? (Yes/No)';
  END IF;
END $$;

-- Update the auto_disqualified logic to include AI-generated music
-- This will be handled in the application logic when the form is submitted 