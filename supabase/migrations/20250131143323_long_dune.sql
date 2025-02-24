/*
  # Create test users in auth and public schema

  1. Changes
    - Create test users in auth.users
    - Create corresponding entries in public.users
    - Uses consistent UUIDs across auth and public schemas

  2. Security
    - Only creates users if they don't exist
    - Maintains referential integrity
*/

-- First create users in auth schema
DO $$
DECLARE
  dario_id uuid := '550e8400-e29b-41d4-a716-446655440000';
  sep_id uuid := '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  rob_id uuid := '7ba7b810-9dad-11d1-80b4-00c04fd430c8';
BEGIN
  -- Insert into auth.users if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = dario_id) THEN
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      dario_id,
      'dario@example.com',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Dario"}'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = sep_id) THEN
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      sep_id,
      'sep@example.com',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Sep"}'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = rob_id) THEN
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      rob_id,
      'rob@example.com',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Rob"}'
    );
  END IF;

  -- Now insert into public.users
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = dario_id) THEN
    INSERT INTO users (id, username, avatar_url)
    VALUES (
      dario_id,
      'dario',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=dario'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM users WHERE id = sep_id) THEN
    INSERT INTO users (id, username, avatar_url)
    VALUES (
      sep_id,
      'sep',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=sep'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM users WHERE id = rob_id) THEN
    INSERT INTO users (id, username, avatar_url)
    VALUES (
      rob_id,
      'rob',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=rob'
    );
  END IF;
END $$;