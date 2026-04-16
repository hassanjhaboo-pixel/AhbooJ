-- ============================================================
-- AhbooJ OS — Update Prompt v2 Migrations
-- Run this in the Supabase SQL Editor after the base schema
-- ============================================================

-- ============================================================
-- SECTION 8: Categories standalone entity
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  applies_to text[] DEFAULT '{}', -- ['products','recipes','ingredients']
  sort_order integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Seed default categories
INSERT INTO categories (name, slug, applies_to, sort_order) VALUES
  ('Panna Cotta',    'panna_cotta',    ARRAY['products','recipes','ingredients'], 1),
  ('Lemon Bar',      'lemon_bar',      ARRAY['products','recipes','ingredients'], 2),
  ('Truffle',        'truffle',        ARRAY['products','recipes','ingredients'], 3),
  ('Chai',           'chai',           ARRAY['products','recipes','ingredients'], 4),
  ('Packaging',      'packaging',      ARRAY['ingredients'],                      5),
  ('Shared',         'shared',         ARRAY['ingredients'],                      6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SECTION 7: Product multi-tier pricing
-- ============================================================
CREATE TABLE IF NOT EXISTS product_tiers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  tier_name text NOT NULL,         -- 'direct', 'cafe', 'wholesale', 'event'
  price numeric(10,2) NOT NULL,
  is_default boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (product_id, tier_name)
);

-- ============================================================
-- SECTION 12: Wastage tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS wastage_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id uuid REFERENCES production_batches(id) ON DELETE SET NULL,
  ingredient_id uuid REFERENCES ingredients(id) ON DELETE SET NULL,
  waste_date date DEFAULT CURRENT_DATE,
  quantity_wasted numeric(10,3) NOT NULL,
  unit text NOT NULL,
  estimated_cost numeric(10,2),
  reason text,                      -- 'over_production', 'spoilage', 'qc_fail', 'spillage', 'other'
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- SECTION 16: Daily task list / weekly schedule
-- ============================================================
CREATE TABLE IF NOT EXISTS weekly_schedule (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  week_of date NOT NULL,            -- Monday of that week
  day_of_week integer NOT NULL,     -- 0=Mon … 6=Sun
  task_text text NOT NULL,
  task_type text DEFAULT 'task',    -- 'task','production','admin','delivery','marketing'
  is_done boolean DEFAULT false,
  done_at timestamptz,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- SECTION 3 & 4: Alter orders — add payment_status
-- (status already supports text, just add new column)
-- ============================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_date date;

-- ============================================================
-- SECTION 4: Alter ledger — add source linkage columns
-- ============================================================
ALTER TABLE ledger
  ADD COLUMN IF NOT EXISTS source_type text,  -- 'order', 'partner_order', 'draw', 'manual'
  ADD COLUMN IF NOT EXISTS source_id uuid;

-- ============================================================
-- SECTION 13: Alter customers — add birthday columns
-- ============================================================
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS birthday_month integer CHECK (birthday_month BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS birthday_day integer CHECK (birthday_day BETWEEN 1 AND 31),
  ADD COLUMN IF NOT EXISTS referral_count integer DEFAULT 0;

-- ============================================================
-- SECTION 20: Alter goals — add milestone columns
-- ============================================================
ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS milestone_25 boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS milestone_50 boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS milestone_75 boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS milestone_100 boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS milestone_notes text;

-- ============================================================
-- RLS for new tables
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wastage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY allow_all_categories      ON categories      TO anon USING (true) WITH CHECK (true);
CREATE POLICY allow_all_product_tiers   ON product_tiers   TO anon USING (true) WITH CHECK (true);
CREATE POLICY allow_all_wastage_log     ON wastage_log     TO anon USING (true) WITH CHECK (true);
CREATE POLICY allow_all_weekly_schedule ON weekly_schedule TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- GRANTs for new tables
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON categories,product_tiers,wastage_log,weekly_schedule TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON categories,product_tiers,wastage_log,weekly_schedule TO authenticated;
