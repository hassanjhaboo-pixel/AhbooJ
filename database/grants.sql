-- ============================================================
-- AhbooJ OS — Permission Grants
-- Run this in the Supabase SQL editor if tables already exist.
-- This is also appended to ahbooj_os_schema.sql for fresh installs.
--
-- Root cause: Postgres requires explicit GRANT on tables even
-- when RLS is enabled. Without these, every query returns
-- "permission denied for table X" regardless of RLS policies.
-- ============================================================

-- Schema usage
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- All existing tables → anon (used by the app's anon key) and authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON
  settings,
  ingredients,
  ingredient_purchases,
  recipes,
  recipe_ingredients,
  products,
  suppliers,
  supplier_payments,
  customers,
  orders,
  order_items,
  partners,
  partner_orders,
  partner_order_items,
  production_batches,
  production_qc_log,
  production_shopping_lists,
  shopping_list_items,
  ledger,
  owner_draws,
  reserves,
  goals,
  tax_entries,
  email_campaigns,
  broadcasts,
  agent_runs
TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  settings,
  ingredients,
  ingredient_purchases,
  recipes,
  recipe_ingredients,
  products,
  suppliers,
  supplier_payments,
  customers,
  orders,
  order_items,
  partners,
  partner_orders,
  partner_order_items,
  production_batches,
  production_qc_log,
  production_shopping_lists,
  shopping_list_items,
  ledger,
  owner_draws,
  reserves,
  goals,
  tax_entries,
  email_campaigns,
  broadcasts,
  agent_runs
TO authenticated;

-- Sequences (uuid primary keys don't need sequences, but cover any serial columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Default privileges: any tables created in the future get the same grants
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
