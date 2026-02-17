-- Seed 3 fake users and their profiles (names, roles, company).
-- Passwords are 'password123' for all seed users.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Fake user 1: Sarah Chen - Project Manager at Acme Construction
DO $$
DECLARE
  v_id UUID := 'a1b2c3d4-e5f6-4789-a012-345678901234';
  v_pw TEXT := crypt('password123', gen_salt('bf'));
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    v_id,
    COALESCE((SELECT id FROM auth.instances LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid),
    'authenticated',
    'authenticated',
    'sarah.chen@example.com',
    v_pw,
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_id, v_id,
    format('{"sub": "%s", "email": "sarah.chen@example.com"}', v_id)::jsonb,
    'email', v_id::text, NOW(), NOW(), NOW()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (user_id, first_name, last_name, role, company, updated_at)
  VALUES (v_id, 'Sarah', 'Chen', 'Project Manager', 'Acme Construction', NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    company = EXCLUDED.company,
    updated_at = NOW();
END $$;

-- Fake user 2: Marcus Webb - Superintendent at Ridge Builders
DO $$
DECLARE
  v_id UUID := 'b2c3d4e5-f6a7-4890-b123-456789012345';
  v_pw TEXT := crypt('password123', gen_salt('bf'));
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    v_id,
    COALESCE((SELECT id FROM auth.instances LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid),
    'authenticated',
    'authenticated',
    'marcus.webb@example.com',
    v_pw,
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_id, v_id,
    format('{"sub": "%s", "email": "marcus.webb@example.com"}', v_id)::jsonb,
    'email', v_id::text, NOW(), NOW(), NOW()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (user_id, first_name, last_name, role, company, updated_at)
  VALUES (v_id, 'Marcus', 'Webb', 'Superintendent', 'Ridge Builders', NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    company = EXCLUDED.company,
    updated_at = NOW();
END $$;

-- Fake user 3: Elena Torres - Site Engineer at Pacific Development Co
DO $$
DECLARE
  v_id UUID := 'c3d4e5f6-a7b8-4901-c234-567890123456';
  v_pw TEXT := crypt('password123', gen_salt('bf'));
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    v_id,
    COALESCE((SELECT id FROM auth.instances LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid),
    'authenticated',
    'authenticated',
    'elena.torres@example.com',
    v_pw,
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_id, v_id,
    format('{"sub": "%s", "email": "elena.torres@example.com"}', v_id)::jsonb,
    'email', v_id::text, NOW(), NOW(), NOW()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (user_id, first_name, last_name, role, company, updated_at)
  VALUES (v_id, 'Elena', 'Torres', 'Site Engineer', 'Pacific Development Co', NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    company = EXCLUDED.company,
    updated_at = NOW();
END $$;
