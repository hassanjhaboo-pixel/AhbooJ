-- =============================================================================
-- AHBOOJ DESSERT BUSINESS DATABASE
-- File: 00_run_all.sql
-- Description: Master script — run all migrations in order
--
-- Usage (from terminal):
--   psql -U <user> -d <database> -f database/00_run_all.sql
--
-- Or run each file individually in order:
--   01_core.sql              → Extensions, enums, locations, staff
--   02_products.sql          → Categories, products, variants, recipes
--   03_inventory.sql         → Suppliers, purchase orders, inventory
--   04_customers_orders.sql  → Customers, orders, payments
--   05_promotions_reviews.sql→ Promotions, gift cards, loyalty, reviews
--   06_seed.sql              → Sample data (development/testing only)
-- =============================================================================

\i database/01_core.sql
\i database/02_products.sql
\i database/03_inventory.sql
\i database/04_customers_orders.sql
\i database/05_promotions_reviews.sql

-- Uncomment the line below to load sample data (development only):
-- \i database/06_seed.sql
