-- ============================================================
-- AhbooJ OS — Full Database Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- CORE SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value text,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO settings (key, value) VALUES
  ('business_name', 'AhbooJ Desserts'),
  ('owner_name', 'Hassan Jhaboo'),
  ('currency', 'TTD'),
  ('instagram', '@ahbooj'),
  ('whatsapp_primary', '18684934260'),
  ('whatsapp_secondary', '18687985765'),
  ('brevo_list_id', '3'),
  ('reserve_minimum_weeks', '2'),
  ('direct_margin_floor', '55'),
  ('cafe_margin_floor', '35')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- INGREDIENTS & INVENTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS ingredients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text, -- 'panna_cotta', 'lemon_bar', 'truffle', 'shared', 'chai', 'packaging'
  unit text NOT NULL, -- 'g', 'ml', 'unit', 'pack'
  cost_per_unit numeric(10,4) NOT NULL,
  stock_on_hand numeric(10,2) DEFAULT 0,
  low_stock_threshold numeric(10,2) DEFAULT 0,
  supplier_id uuid,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ingredient_purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id uuid REFERENCES ingredients(id),
  supplier_id uuid,
  quantity_purchased numeric(10,2) NOT NULL,
  unit text NOT NULL,
  total_price_paid numeric(10,2) NOT NULL,
  cost_per_unit_calculated numeric(10,4) GENERATED ALWAYS AS (total_price_paid / NULLIF(quantity_purchased, 0)) STORED,
  purchase_date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- RECIPES
-- ============================================================
CREATE TABLE IF NOT EXISTS recipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text, -- 'panna_cotta', 'truffle', 'bar', 'concentrate', 'syrup'
  base_yield_units integer NOT NULL,
  yield_unit_label text NOT NULL,
  instructions text,
  is_active boolean DEFAULT true,
  version integer DEFAULT 1,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id uuid REFERENCES ingredients(id),
  quantity numeric(10,3) NOT NULL,
  unit text NOT NULL,
  notes text
);

-- ============================================================
-- PRODUCTS / SKUs
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  sku text UNIQUE,
  category text,
  tier text,
  recipe_id uuid REFERENCES recipes(id),
  direct_price numeric(10,2),
  cafe_price numeric(10,2),
  cost_per_unit numeric(10,2),
  direct_margin numeric(5,2) GENERATED ALWAYS AS (
    CASE WHEN direct_price > 0 THEN ROUND(((direct_price - cost_per_unit) / direct_price) * 100, 2) ELSE 0 END
  ) STORED,
  cafe_margin numeric(5,2) GENERATED ALWAYS AS (
    CASE WHEN cafe_price > 0 THEN ROUND(((cafe_price - cost_per_unit) / cafe_price) * 100, 2) ELSE 0 END
  ) STORED,
  is_active boolean DEFAULT true,
  channel text DEFAULT 'both',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- SUPPLIERS
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text,
  contact_name text,
  phone text,
  email text,
  address text,
  payment_terms text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supplier_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id uuid REFERENCES suppliers(id),
  amount numeric(10,2) NOT NULL,
  description text,
  due_date date,
  paid_date date,
  status text DEFAULT 'outstanding',
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- CUSTOMERS (CRM)
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text,
  email text,
  instagram_handle text,
  channel text DEFAULT 'direct',
  referred_by uuid REFERENCES customers(id),
  on_whatsapp_list boolean DEFAULT false,
  on_email_list boolean DEFAULT false,
  brevo_contact_id text,
  total_orders integer DEFAULT 0,
  total_spend numeric(10,2) DEFAULT 0,
  last_order_date date,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number text UNIQUE,
  customer_id uuid REFERENCES customers(id),
  order_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'pending',
  channel text,
  subtotal numeric(10,2),
  total numeric(10,2),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity integer NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  line_total numeric(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- ============================================================
-- B2B PARTNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS partners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  address text,
  payment_terms text DEFAULT 'Net 14',
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number text UNIQUE,
  partner_id uuid REFERENCES partners(id),
  order_date date DEFAULT CURRENT_DATE,
  delivery_date date,
  status text DEFAULT 'pending',
  subtotal numeric(10,2),
  total numeric(10,2),
  due_date date,
  paid_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_order_id uuid REFERENCES partner_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity integer NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  line_total numeric(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- ============================================================
-- PRODUCTION
-- ============================================================
CREATE TABLE IF NOT EXISTS production_batches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_number text UNIQUE,
  recipe_id uuid REFERENCES recipes(id),
  product_id uuid REFERENCES products(id),
  production_date date DEFAULT CURRENT_DATE,
  planned_yield integer,
  actual_yield integer,
  batch_cost numeric(10,2),
  cost_per_unit numeric(10,2) GENERATED ALWAYS AS (
    CASE WHEN actual_yield > 0 THEN ROUND(batch_cost / actual_yield, 2) ELSE 0 END
  ) STORED,
  channel_allocation text,
  qc_passed boolean,
  qc_notes text,
  produced_by text DEFAULT 'Hassan',
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS production_qc_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id uuid REFERENCES production_batches(id),
  check_category text,
  check_name text,
  passed boolean,
  notes text,
  checked_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS production_shopping_lists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  week_of date,
  status text DEFAULT 'draft',
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  shopping_list_id uuid REFERENCES production_shopping_lists(id),
  ingredient_id uuid REFERENCES ingredients(id),
  quantity_needed numeric(10,2),
  unit text,
  estimated_cost numeric(10,2),
  is_purchased boolean DEFAULT false
);

-- ============================================================
-- FINANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS ledger (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_date date DEFAULT CURRENT_DATE,
  type text NOT NULL,
  category text,
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  reference_id uuid,
  reference_type text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS owner_draws (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  draw_date date DEFAULT CURRENT_DATE,
  amount numeric(10,2) NOT NULL,
  approved boolean DEFAULT false,
  rule_check_passed boolean,
  rule_check_notes text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reserves (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date date DEFAULT CURRENT_DATE,
  total_cash numeric(10,2),
  operating_reserve numeric(10,2),
  personal_float numeric(10,2),
  reserve_weeks_covered numeric(5,2),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  period_type text,
  period_label text,
  revenue_target numeric(10,2),
  revenue_actual numeric(10,2) DEFAULT 0,
  order_count_target integer,
  order_count_actual integer DEFAULT 0,
  customer_count_target integer,
  customer_count_actual integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_date date DEFAULT CURRENT_DATE,
  description text,
  amount numeric(10,2),
  category text,
  reference text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- EMAIL MARKETING
-- ============================================================
CREATE TABLE IF NOT EXISTS email_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  subject text,
  body_html text,
  body_text text,
  campaign_type text,
  brevo_campaign_id text,
  status text DEFAULT 'draft',
  sent_at timestamptz,
  recipient_count integer,
  open_rate numeric(5,2),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- WHATSAPP BROADCASTS
-- ============================================================
CREATE TABLE IF NOT EXISTS broadcasts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  broadcast_date date DEFAULT CURRENT_DATE,
  message_text text NOT NULL,
  products_featured text[],
  sent boolean DEFAULT false,
  estimated_reach integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- AI AGENT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_type text NOT NULL,
  input_context jsonb,
  output text,
  tokens_used integer,
  run_at timestamptz DEFAULT now()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_qc_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE reserves ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl text;
  tbls text[] := ARRAY[
    'settings','ingredients','ingredient_purchases','recipes','recipe_ingredients',
    'products','suppliers','supplier_payments','customers','orders','order_items',
    'partners','partner_orders','partner_order_items','production_batches',
    'production_qc_log','production_shopping_lists','shopping_list_items',
    'ledger','owner_draws','reserves','goals','tax_entries',
    'email_campaigns','broadcasts','agent_runs'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format(
      'DO $inner$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = %L AND policyname = %L) THEN CREATE POLICY %I ON %I TO anon USING (true) WITH CHECK (true); END IF; END $inner$',
      tbl, 'allow_all_' || tbl, 'allow_all_' || tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Kafneo B2B partner
INSERT INTO partners (name, contact_name, payment_terms, is_active)
VALUES ('Kafneo', 'Kafneo Manager', 'Net 14', true)
ON CONFLICT DO NOTHING;

-- Core ingredients
INSERT INTO ingredients (name, category, unit, cost_per_unit, low_stock_threshold) VALUES
('Heavy Cream', 'panna_cotta', 'ml', 0.0750, 500),
('Full Cream (case)', 'panna_cotta', 'ml', 0.0167, 1000),
('Gelatin', 'panna_cotta', 'g', 0.2500, 50),
('Brown Sugar', 'shared', 'g', 0.0122, 500),
('White Sugar', 'shared', 'g', 0.0126, 200),
('Vanilla Extract', 'panna_cotta', 'ml', 0.8629, 20),
('Vanilla Essence', 'panna_cotta', 'ml', 0.1691, 30),
('Coffee Essence', 'panna_cotta', 'ml', 0.1099, 30),
('Instant Coffee', 'panna_cotta', 'g', 0.3500, 50),
('Mocha Chocolate', 'panna_cotta', 'g', 0.1667, 100),
('Cocoa Powder', 'panna_cotta', 'g', 0.1500, 100),
('Cream Cheese', 'panna_cotta', 'g', 0.1323, 150),
('Dulce de Leche', 'panna_cotta', 'ml', 0.0380, 200),
('Matcha Powder', 'panna_cotta', 'g', 2.0000, 20),
('Coconut Milk Powder', 'panna_cotta', 'g', 0.2000, 100),
('Salted Butter', 'shared', 'g', 0.1474, 200),
('Margarine', 'shared', 'g', 0.0660, 200),
('Digestive Biscuits', 'lemon_bar', 'g', 0.0476, 150),
('Condensed Milk', 'lemon_bar', 'ml', 0.0430, 200),
('Eggs', 'shared', 'unit', 2.2500, 12),
('Lemon Juice', 'lemon_bar', 'ml', 0.0400, 100),
('White Chocolate', 'truffle', 'g', 0.3077, 100),
('Dark Chocolate', 'truffle', 'g', 0.2000, 100),
('Hazelnuts', 'truffle', 'g', 0.3400, 50),
('Rose Essence', 'truffle', 'ml', 0.2536, 20),
('Biscoff Cookie Butter', 'shared', 'g', 0.2353, 100),
('Chai Spice Mix', 'chai', 'g', 0.1000, 100);

-- Q2 2026 goals
INSERT INTO goals (period_type, period_label, revenue_target, order_count_target, customer_count_target)
VALUES
  ('monthly', 'April 2026', 2500, 30, 25),
  ('monthly', 'May 2026', 3500, 40, 32),
  ('monthly', 'June 2026', 4000, 50, 40),
  ('quarterly', 'Q2 2026', 10000, 120, 40)
ON CONFLICT DO NOTHING;
