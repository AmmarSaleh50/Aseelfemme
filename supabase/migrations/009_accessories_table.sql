-- Create accessories table
CREATE TABLE IF NOT EXISTS accessories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  description_en TEXT,
  description_ar TEXT,
  image_url TEXT,
  beeorder_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE accessories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public accessories are viewable by everyone" 
  ON accessories FOR SELECT 
  USING (true);

CREATE POLICY "Admins can insert accessories" 
  ON accessories FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update accessories" 
  ON accessories FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete accessories" 
  ON accessories FOR DELETE 
  USING (auth.role() = 'authenticated');
