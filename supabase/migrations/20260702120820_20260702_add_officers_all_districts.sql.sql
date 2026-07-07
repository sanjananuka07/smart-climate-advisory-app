-- Add officers for all Andhra Pradesh districts
INSERT INTO officers (name, district, phone, specialization, available) VALUES
  -- Vizianagaram
  ('Dr. Venkateswara Rao', 'Vizianagaram', '+91 98765 11111', 'Paddy & Sugarcane Specialist', true),
  ('Smt. Satyavathi', 'Vizianagaram', '+91 98480 22222', 'Soil Health Expert', true),
  -- Visakhapatnam
  ('Dr. Koteswara Rao', 'Visakhapatnam', '+91 98765 33333', 'Horticulture & Cashew', true),
  ('Sri Appa Rao', 'Visakhapatnam', '+91 98480 44444', 'Pest Management', false),
  -- East Godavari
  ('Dr. Ramprasad', 'East Godavari', '+91 98765 55555', 'Paddy & Aquaculture', true),
  ('Smt. Latha Devi', 'East Godavari', '+91 98480 66666', 'Coconut & Arecanut', true),
  -- West Godavari
  ('Dr. Narayana Swamy', 'West Godavari', '+91 98765 77777', 'Paddy Specialist', true),
  ('Sri Rama Rao', 'West Godavari', '+91 98480 88888', 'Irrigation Expert', true),
  -- Krishna
  ('Dr. Prasad Rao', 'Krishna', '+91 98765 99999', 'Chili & Cotton Specialist', true),
  ('Smt. Lakshmi', 'Krishna', '+91 91210 10101', 'Vegetable Crops', true),
  -- Guntur
  ('Dr. Reddy Prasad', 'Guntur', '+91 98765 12121', 'Chili & Tobacco Specialist', true),
  ('Sri Srinivasa Rao', 'Guntur', '+91 98480 13131', 'Cotton Expert', true),
  -- Prakasam
  ('Dr. Subba Rao', 'Prakasam', '+91 98765 14141', 'Drought-Resistant Crops', true),
  ('Smt. Mary', 'Prakasam', '+91 98480 15151', 'Groundnut & Millets', true),
  -- Nellore
  ('Dr. Pavan Kumar', 'Nellore', '+91 98765 16161', 'Paddy & Aqua Culture', true),
  ('Sri Venkat', 'Nellore', '+91 98480 17171', 'Fisheries Integration', true),
  -- Chittoor
  ('Dr. Sreenivasulu', 'Chittoor', '+91 98765 18181', 'Tomato & Vegetable Crops', true),
  ('Smt. Padmavathi', 'Chittoor', '+91 98480 19191', 'Mango & Fruits Expert', false),
  -- Anantapur
  ('Dr. Obulesu', 'Anantapur', '+91 98765 20202', 'Groundnut & Millets', true),
  ('Sri Hanumanthu', 'Anantapur', '+91 98480 21212', 'Drought Management', true),
  -- Kurnool
  ('Dr. Gangi Reddy', 'Kurnool', '+91 98765 22222', 'Sunflower & Groundnut', true),
  ('Smt. Sarojini', 'Kurnool', '+91 98480 23232', 'Cotton & Pulses', true),
  -- Kadapa
  ('Dr. Ramachandra', 'Kadapa', '+91 98765 24242', 'Millets & Oil Seeds', true),
  ('Sri Naveen Kumar', 'Kadapa', '+91 98480 25252', 'Groundnut & Tobacco', true)
ON CONFLICT DO NOTHING;