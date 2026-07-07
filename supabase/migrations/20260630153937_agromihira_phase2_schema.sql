/*
# AgroMihira Phase 2 schema

1. New Tables
- `officers`: agricultural officers directory (name, district, phone, specialization, available flag)
- `officer_messages`: chat messages between farmers and officers (sender_role: farmer/officer, user_id, officer_id, content)
- `appointments`: farmer appointment bookings with officers (user_id, officer_id, date, time_slot, reason, status)
- `disease_reports`: crop disease detection submissions (user_id, image_url, crop, result, confidence, treatment, created_at)
- `feedback`: farmer feedback submissions (user_id, category, message, rating, created_at)
- `content_items`: shared content for government schemes, agri news, market prices (type, title, body, extra json, created_at)

2. Security
- Enable RLS on all tables.
- officers: SELECT for authenticated (directory is shared); writes restricted to service role.
- officer_messages: owner-scoped CRUD for farmers (auth.uid() = user_id).
- appointments: owner-scoped CRUD for farmers (auth.uid() = user_id).
- disease_reports: owner-scoped CRUD (auth.uid() = user_id).
- feedback: owner-scoped insert + select (auth.uid() = user_id).
- content_items: SELECT for authenticated (shared content); writes restricted to service role.

3. Notes
- All owner tables default user_id to auth.uid() so client inserts succeed without passing user_id.
- Seeded sample officers, content items (schemes, news, market prices).
*/

-- Officers directory
CREATE TABLE IF NOT EXISTS officers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  district text NOT NULL DEFAULT 'Srikakulam',
  phone text NOT NULL,
  specialization text NOT NULL,
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE officers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_officers" ON officers;
CREATE POLICY "select_officers" ON officers FOR SELECT
  TO authenticated USING (true);

-- Officer chat messages
CREATE TABLE IF NOT EXISTS officer_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  officer_id uuid NOT NULL REFERENCES officers(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('farmer', 'officer')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE officer_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_officer_messages" ON officer_messages;
CREATE POLICY "select_own_officer_messages" ON officer_messages FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_officer_messages" ON officer_messages;
CREATE POLICY "insert_own_officer_messages" ON officer_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_officer_messages" ON officer_messages;
CREATE POLICY "delete_own_officer_messages" ON officer_messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  officer_id uuid NOT NULL REFERENCES officers(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  time_slot text NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_appointments" ON appointments;
CREATE POLICY "select_own_appointments" ON appointments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_appointments" ON appointments;
CREATE POLICY "insert_own_appointments" ON appointments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_appointments" ON appointments;
CREATE POLICY "delete_own_appointments" ON appointments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Disease reports (image stored in Supabase Storage)
CREATE TABLE IF NOT EXISTS disease_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  crop text,
  result text,
  confidence numeric,
  treatment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE disease_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_disease_reports" ON disease_reports;
CREATE POLICY "select_own_disease_reports" ON disease_reports FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_disease_reports" ON disease_reports;
CREATE POLICY "insert_own_disease_reports" ON disease_reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_disease_reports" ON disease_reports;
CREATE POLICY "delete_own_disease_reports" ON disease_reports FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  message text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_feedback" ON feedback;
CREATE POLICY "select_own_feedback" ON feedback FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_feedback" ON feedback;
CREATE POLICY "insert_own_feedback" ON feedback FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Content items (schemes, news, market prices)
CREATE TABLE IF NOT EXISTS content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('scheme', 'news', 'market_price')),
  title text NOT NULL,
  body text NOT NULL,
  extra jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_content" ON content_items;
CREATE POLICY "select_content" ON content_items FOR SELECT
  TO authenticated USING (true);

-- Seed officers
INSERT INTO officers (name, district, phone, specialization) VALUES
  ('Dr. Ramesh Babu', 'Srikakulam', '+91 98765 43210', 'Paddy & Pulses Specialist'),
  ('Smt. Lakshmi Devi', 'Srikakulam', '+91 98480 11223', 'Soil Health & Fertilizers'),
  ('Sri Krishna Murthy', 'Srikakulam', '+91 90000 55667', 'Pest & Disease Management'),
  ('Dr. Anjali Rao', 'Srikakulam', '+91 91210 77889', 'Horticulture & Vegetables')
ON CONFLICT DO NOTHING;

-- Seed government schemes
INSERT INTO content_items (type, title, body, extra) VALUES
  ('scheme', 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)', 'Income support of Rs 6,000 per year to all eligible farmer families in three equal installments. Eligibility: small and marginal farmers holding cultivable land.', '{"benefit": "Rs 6,000/year", "deadline": "Open throughout the year"}'),
  ('scheme', 'Rythu Bharosa (YSR)', 'Financial assistance of Rs 13,500 per annum to each farmer family in Andhra Pradesh, including tenant farmers. Released in three installments.', '{"benefit": "Rs 13,500/year", "deadline": "May, Oct, Jan installments"}'),
  ('scheme', 'Crop Insurance (PMFBY)', 'Pradhan Mantri Fasal Bima Yojana provides comprehensive crop insurance against natural calamities, pests and diseases. Premium: 2% for Kharif, 1.5% for Rabi.', '{"benefit": "Full crop insurance", "deadline": "Before sowing season"}'),
  ('scheme', 'Soil Health Card Scheme', 'Free soil health cards to all farmers with nutrient status and fertilizer recommendations based on soil testing. Renew every 2 years.', '{"benefit": "Free soil testing", "deadline": "Continuous"}')
ON CONFLICT DO NOTHING;

-- Seed agricultural news
INSERT INTO content_items (type, title, body, extra) VALUES
  ('news', 'Monsoon arrives early in Srikakulam', 'The southwest monsoon has reached Srikakulam district 3 days ahead of the normal date. IMD forecasts above-normal rainfall (106% of LPA) for the season. Farmers advised to complete sowing activities.', '{"date": "2024-06-05", "source": "IMD"}'),
  ('news', 'New drought-resistant paddy variety released', 'ANGRAU has released a new paddy variety "Srikakulam Sona" with 15% higher yield and improved drought tolerance. Suitable for both Kharif and Rabi seasons in coastal Andhra.', '{"date": "2024-05-20", "source": "ANGRAU"}'),
  ('news', 'MSP increased for Kharif crops 2024', 'The government has announced increased Minimum Support Prices for Kharif crops. Paddy MSP raised to Rs 2,300/quintal, maize to Rs 2,222/quintal, groundnut to Rs 6,783/quintal.', '{"date": "2024-06-12", "source": "Ministry of Agriculture"}'),
  ('news', 'Free soil testing camps in Srikakulam mandals', 'The Agriculture Department is organizing free soil testing camps across all mandals in Srikakulam district this month. Farmers can get their soil tested and receive recommendations on the spot.', '{"date": "2024-06-15", "source": "Dept of Agriculture"}')
ON CONFLICT DO NOTHING;

-- Seed market prices
INSERT INTO content_items (type, title, body, extra) VALUES
  ('market_price', 'Paddy (Common)', 'Current market price at Srikakulam regulated market.', '{"price": "2,300", "unit": "Rs/quintal", "trend": "up", "change": "+50"}'),
  ('market_price', 'Maize', 'Current market price at Srikakulam regulated market.', '{"price": "2,180", "unit": "Rs/quintal", "trend": "down", "change": "-20"}'),
  ('market_price', 'Groundnut', 'Current market price at Srikakulam regulated market.', '{"price": "6,500", "unit": "Rs/quintal", "trend": "up", "change": "+150"}'),
  ('market_price', 'Bengal Gram (Chickpea)', 'Current market price at Srikakulam regulated market.', '{"price": "5,400", "unit": "Rs/quintal", "trend": "stable", "change": "0"}'),
  ('market_price', 'Black Gram (Urad)', 'Current market price at Srikakulam regulated market.', '{"price": "6,800", "unit": "Rs/quintal", "trend": "up", "change": "+100"}'),
  ('market_price', 'Green Gram (Moong)', 'Current market price at Srikakulam regulated market.', '{"price": "7,200", "unit": "Rs/quintal", "trend": "down", "change": "-80"}')
ON CONFLICT DO NOTHING;
