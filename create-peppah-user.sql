-- Create authentication for peppah.tracks@gmail.com
-- Run this script in the Supabase SQL Editor
-- This script handles cases where profile exists but auth user doesn't

DO $$
DECLARE
  new_user_id uuid;
  existing_profile_id uuid;
BEGIN
  -- Check if profile already exists
  SELECT id INTO existing_profile_id FROM public.profiles WHERE email = 'peppah.tracks@gmail.com';
  
  -- Check if auth user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'peppah.tracks@gmail.com') THEN
    RAISE NOTICE 'User peppah.tracks@gmail.com already exists in auth.users';
  ELSE
    -- Create auth user using existing profile ID if available
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
      COALESCE(existing_profile_id, gen_random_uuid()), -- Use existing profile ID if available
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

    -- Only create profile if it doesn't exist
    IF existing_profile_id IS NULL THEN
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
      -- Profile exists, update it to match the auth user ID
      UPDATE public.profiles 
      SET id = new_user_id, 
          updated_at = now()
      WHERE email = 'peppah.tracks@gmail.com';
      RAISE NOTICE 'Auth user created and linked to existing profile with ID: %', new_user_id;
    END IF;
  END IF;
END $$;
