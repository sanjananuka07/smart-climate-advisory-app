-- Enable phone auth for farmers
-- Make email optional for farmers, required for officers
-- Add phone as unique identifier for farmers

-- Add phone column to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;

-- Add unique constraint on phone for farmers
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;

-- Remove trigger that auto-confirms users (we want officers to verify email)
DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;
DROP FUNCTION IF EXISTS public.auto_confirm_user();

-- Create function to auto-confirm farmer accounts (phone-based)
CREATE OR REPLACE FUNCTION public.handle_farmer_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- For farmers (no email or phone auth), auto-confirm
  IF NEW.raw_user_meta_data->>'role' = 'farmer' THEN
    UPDATE auth.users 
    SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_farmer
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_farmer_signup();

COMMENT ON COLUMN profiles.phone IS 'Phone number for farmers (primary identifier)';