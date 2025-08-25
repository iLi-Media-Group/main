-- Check if artist_applications table exists and create it if needed
DO $$
BEGIN
    -- Check if the table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'artist_applications') THEN
        -- Create the artist_applications table
        CREATE TABLE artist_applications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            artist_type TEXT NOT NULL CHECK (artist_type IN ('solo', 'duo', 'band')),
            primary_genre TEXT NOT NULL,
            stage_name TEXT,
            music_producer TEXT NOT NULL,
            production_method TEXT NOT NULL,
            uses_premade_tracks TEXT,
            master_rights_owner TEXT NOT NULL,
            publishing_rights_owner TEXT NOT NULL,
            shares_ownership TEXT,
            ownership_explanation TEXT,
            is_one_stop TEXT,
            has_streaming_releases TEXT,
            streaming_links TEXT,
            catalog_track_count TEXT,
            has_instrumentals TEXT,
            has_stems TEXT,
            has_sync_licenses TEXT,
            understands_rights_requirement TEXT,
            account_manager_name TEXT NOT NULL,
            account_manager_email TEXT NOT NULL,
            account_manager_phone TEXT NOT NULL,
            account_manager_authority TEXT,
            additional_info TEXT,
            application_score INTEGER DEFAULT 0,
            score_breakdown JSONB,
            status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'approved', 'rejected')),
            -- Sync licensing and quiz fields
            sync_licensing_course TEXT,
            quiz_question_1 TEXT,
            quiz_question_2 TEXT,
            quiz_question_3 TEXT,
            quiz_question_4 TEXT,
            quiz_question_5 TEXT,
            quiz_score INTEGER DEFAULT 0,
            quiz_total_questions INTEGER DEFAULT 5,
            quiz_completed BOOLEAN DEFAULT false
        );

        -- Enable RLS
        ALTER TABLE artist_applications ENABLE ROW LEVEL SECURITY;

        -- Create indexes
        CREATE INDEX idx_artist_applications_status ON artist_applications(status);
        CREATE INDEX idx_artist_applications_created_at ON artist_applications(created_at);
        CREATE INDEX idx_artist_applications_email ON artist_applications(email);
        CREATE INDEX idx_artist_applications_score ON artist_applications(application_score);

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Allow inserts for anonymous users" ON artist_applications;
        DROP POLICY IF EXISTS "Allow admins to read all applications" ON artist_applications;
        DROP POLICY IF EXISTS "Allow admins to update applications" ON artist_applications;

        -- Create policies
        CREATE POLICY "Allow inserts for anonymous users" ON artist_applications
            FOR INSERT WITH CHECK (true);

        CREATE POLICY "Allow admins to read all applications" ON artist_applications
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.account_type IN ('admin', 'admin,producer')
                )
            );

        CREATE POLICY "Allow admins to update applications" ON artist_applications
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.account_type IN ('admin', 'admin,producer')
                )
            );

        RAISE NOTICE 'artist_applications table created successfully';
    ELSE
        RAISE NOTICE 'artist_applications table already exists';
    END IF;
END $$;
