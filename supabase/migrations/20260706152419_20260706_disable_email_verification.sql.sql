-- Disable email confirmation for the project
-- This needs to be done via SQL since we can't access Supabase dashboard

-- Update auth settings to disable email confirmation
-- Note: In production, this would be done in Supabase Dashboard > Authentication > Settings
-- For now, we'll ensure users are auto-confirmed on signup via a trigger

-- Create or replace function to auto-confirm users
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto confirm email for new users
  UPDATE auth.users 
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-confirmation
DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_confirm
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();