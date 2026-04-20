-- AhbooJ OS v3 — Smart Event System Migration
-- Run in Supabase SQL Editor

-- ============================================================
-- 1. dashboard_alerts
-- ============================================================
CREATE TABLE IF NOT EXISTS dashboard_alerts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type         text NOT NULL,
  severity     text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title        text NOT NULL,
  message      text,
  entity_type  text,
  entity_id    uuid,
  is_read      boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dashboard_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_dashboard_alerts" ON dashboard_alerts FOR ALL TO anon USING (true) WITH CHECK (true);
GRANT ALL ON dashboard_alerts TO anon;

-- ============================================================
-- 2. customer_milestones
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_milestones (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  milestone    text NOT NULL,
  reached_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customer_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_customer_milestones" ON customer_milestones FOR ALL TO anon USING (true) WITH CHECK (true);
GRANT ALL ON customer_milestones TO anon;

-- ============================================================
-- 3. updated_at columns
-- ============================================================
ALTER TABLE recipes    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE products   ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE customers  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE orders     ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE partner_orders ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ============================================================
-- 4. updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['recipes','products','ingredients','customers','orders','partner_orders']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'trg_' || t || '_updated_at'
        AND tgrelid = t::regclass
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
        t, t
      );
    END IF;
  END LOOP;
END;
$$;

-- ============================================================
-- 5. production_batches — add linking columns
-- ============================================================
ALTER TABLE production_batches
  ADD COLUMN IF NOT EXISTS linked_order_id         uuid REFERENCES orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_partner_order_id  uuid REFERENCES partner_orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS dispatch_status          text DEFAULT 'planned';

-- ============================================================
-- 6. products — product-level stock tracking
-- ============================================================
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock_on_hand numeric(10,2) DEFAULT 0;

-- ============================================================
-- 7. orders — last_updated_by (audit)
-- ============================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS last_status_change timestamptz;

-- ============================================================
-- 8. QC checklist log
-- ============================================================
CREATE TABLE IF NOT EXISTS order_qc_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  checked_at timestamptz NOT NULL DEFAULT now(),
  checklist  jsonb NOT NULL DEFAULT '{}'
);

ALTER TABLE order_qc_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_order_qc_log" ON order_qc_log FOR ALL TO anon USING (true) WITH CHECK (true);
GRANT ALL ON order_qc_log TO anon;

-- ============================================================
-- Done
-- ============================================================
