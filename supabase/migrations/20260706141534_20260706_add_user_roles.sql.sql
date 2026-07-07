-- Add role support for farmers and officers
-- 1. Add role column to profiles table
-- 2. Add officer-specific fields
-- 3. Create officer_profiles table for additional officer info

-- Add role to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'officer'));

-- Add officer-specific fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS designation text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_id text;

-- Create officer_profiles table to link auth users with officers table
CREATE TABLE IF NOT EXISTS officer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  officer_id uuid REFERENCES officers(id) ON DELETE SET NULL,
  department text,
  designation text,
  employee_id text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE officer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_officer_profile" ON officer_profiles;
CREATE POLICY "select_own_officer_profile" ON officer_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_officer_profile" ON officer_profiles;
CREATE POLICY "insert_own_officer_profile" ON officer_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_officer_profile" ON officer_profiles;
CREATE POLICY "update_own_officer_profile" ON officer_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Add trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, mobile_number, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'mobile_number',
    COALESCE(NEW.raw_user_meta_data->>'role', 'farmer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TABLE profiles IS 'User profiles for both farmers and officers';
COMMENT ON COLUMN profiles.role IS 'User role: farmer or officer';
COMMENT ON TABLE officer_profiles IS 'Additional profile data for agriculture officers';