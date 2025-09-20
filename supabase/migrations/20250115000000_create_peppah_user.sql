-- Create authentication for peppah.tracks@gmail.com
-- This migration creates both the auth user and profile record

DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Check if user already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'peppah.tracks@gmail.com') THEN
    -- Create auth user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'peppah.tracks@gmail.com',
      -- Password hash for 'Peppah2024!'
      crypt('Peppah2024!', gen_salt('bf')),
      now(),
      now(),
      now(),
      encode(gen_random_bytes(32), 'hex'),
      encode(gen_random_bytes(32), 'hex'),
      '{"provider":"email","providers":["email"]}',
      '{"account_type":"client"}'
    ) RETURNING id INTO new_user_id;

    -- Create profile record
    INSERT INTO public.profiles (
      id,
      email,
      account_type,
      created_at,
      updated_at
    ) VALUES (
      new_user_id,
      'peppah.tracks@gmail.com',
      'client',
      now(),
      now()
    );

    RAISE NOTICE 'User peppah.tracks@gmail.com created successfully with ID: %', new_user_id;
  ELSE
    RAISE NOTICE 'User peppah.tracks@gmail.com already exists';
  END IF;
END $$;

















