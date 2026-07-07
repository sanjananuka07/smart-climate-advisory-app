/*
# AgroMihira core schema

1. New Tables
- `profiles`: farmer profile data linked to auth.users (name, mobile, district, village, farm_size, soil_type, preferred_language, crops_grown)
- `climate_alerts`: published climate alerts (type, risk level, description, precautions, active flag)
- `chat_messages`: AI assistant conversation history per user (role, content)

2. Security
- Enable RLS on all tables.
- profiles: owner-scoped CRUD (auth.uid() = user_id).
- climate_alerts: SELECT for authenticated (shared advisory data); INSERT/UPDATE/DELETE restricted to service role (admin publishes via backend).
- chat_messages: owner-scoped CRUD (auth.uid() = user_id).

3. Notes
- profiles.user_id defaults to auth.uid() so inserts from the client succeed even when user_id is omitted.
- chat_messages.user_id defaults to auth.uid() for the same reason.
- climate_alerts has no user_id — it is shared advisory content readable by all authenticated users.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  mobile_number text,
  district text DEFAULT 'Srikakulam',
  village text,
  farm_size numeric,
  soil_type text,
  preferred_language text DEFAULT 'en',
  crops_grown text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS climate_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high')),
  title text NOT NULL,
  description text NOT NULL,
  precautions text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE climate_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_alerts" ON climate_alerts;
CREATE POLICY "select_alerts" ON climate_alerts FOR SELECT
  TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_messages" ON chat_messages;
CREATE POLICY "select_own_messages" ON chat_messages FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_messages" ON chat_messages;
CREATE POLICY "insert_own_messages" ON chat_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_messages" ON chat_messages;
CREATE POLICY "delete_own_messages" ON chat_messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

INSERT INTO climate_alerts (alert_type, risk_level, title, description, precautions) VALUES
  ('heavy_rainfall', 'moderate', 'Heavy Rainfall Expected', 'Rainfall of 80-120mm expected over the next 48 hours in Srikakulam district. Low-lying areas may experience waterlogging.', 'Ensure proper drainage in fields. Delay fertilizer application. Harvest mature crops immediately. Move stored produce to higher ground.'),
  ('heat_wave', 'high', 'Heat Wave Warning', 'Temperatures expected to reach 42-44°C between 11 AM and 4 PM over the next 3 days.', 'Avoid field work during peak hours. Ensure adequate irrigation. Use mulch to retain soil moisture. Provide shade for livestock.'),
  ('strong_winds', 'moderate', 'Strong Winds Alert', 'Wind speeds of 40-50 km/h expected. Risk of lodging in tall crops.', 'Stake young plants. Delay pesticide spraying. Inspect and reinforce greenhouse structures.')
ON CONFLICT DO NOTHING;
