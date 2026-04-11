-- =============================================================================
-- AHBOOJ DESSERT BUSINESS DATABASE
-- File: 06_seed.sql
-- Description: Sample data for development and testing
-- =============================================================================

-- =============================================================================
-- LOCATIONS
-- =============================================================================

INSERT INTO locations (id, name, slug, address_line1, city, state, postal_code, country, phone, email, timezone, delivery_radius_km, opening_hours) VALUES
(
    'aaaaaaaa-0001-0001-0001-000000000001',
    'AhbooJ Downtown',
    'downtown',
    '123 Sweet Street',
    'New York', 'NY', '10001', 'US',
    '+1-212-555-0101',
    'downtown@ahbooj.com',
    'America/New_York',
    10.0,
    '{"mon":{"open":"08:00","close":"21:00"},"tue":{"open":"08:00","close":"21:00"},"wed":{"open":"08:00","close":"21:00"},"thu":{"open":"08:00","close":"21:00"},"fri":{"open":"08:00","close":"22:00"},"sat":{"open":"09:00","close":"22:00"},"sun":{"open":"10:00","close":"19:00"}}'
),
(
    'aaaaaaaa-0001-0001-0001-000000000002',
    'AhbooJ Uptown',
    'uptown',
    '456 Pastry Avenue',
    'New York', 'NY', '10025', 'US',
    '+1-212-555-0202',
    'uptown@ahbooj.com',
    'America/New_York',
    8.0,
    '{"mon":{"open":"09:00","close":"20:00"},"tue":{"open":"09:00","close":"20:00"},"wed":{"open":"09:00","close":"20:00"},"thu":{"open":"09:00","close":"20:00"},"fri":{"open":"09:00","close":"21:00"},"sat":{"open":"10:00","close":"21:00"},"sun":{"open":"10:00","close":"18:00"}}'
);

-- =============================================================================
-- STAFF
-- =============================================================================

INSERT INTO staff (id, location_id, first_name, last_name, email, phone, role, is_active, hired_at) VALUES
('bbbbbbbb-0001-0001-0001-000000000001', 'aaaaaaaa-0001-0001-0001-000000000001', 'Hassan',  'Jhaboo',   'hassan@ahbooj.com',   '+1-212-555-1001', 'owner',    TRUE, '2022-01-01'),
('bbbbbbbb-0001-0001-0001-000000000002', 'aaaaaaaa-0001-0001-0001-000000000001', 'Maria',   'Gonzalez', 'maria@ahbooj.com',    '+1-212-555-1002', 'manager',  TRUE, '2022-03-15'),
('bbbbbbbb-0001-0001-0001-000000000003', 'aaaaaaaa-0001-0001-0001-000000000001', 'James',   'Baker',    'james@ahbooj.com',    '+1-212-555-1003', 'baker',    TRUE, '2022-06-01'),
('bbbbbbbb-0001-0001-0001-000000000004', 'aaaaaaaa-0001-0001-0001-000000000001', 'Amara',   'Diallo',   'amara@ahbooj.com',    '+1-212-555-1004', 'decorator',TRUE, '2023-01-10'),
('bbbbbbbb-0001-0001-0001-000000000005', 'aaaaaaaa-0001-0001-0001-000000000002', 'Sophie',  'Chen',     'sophie@ahbooj.com',   '+1-212-555-1005', 'manager',  TRUE, '2022-09-01'),
('bbbbbbbb-0001-0001-0001-000000000006', 'aaaaaaaa-0001-0001-0001-000000000001', 'Derek',   'Miles',    'derek@ahbooj.com',    '+1-212-555-1006', 'delivery_driver', TRUE, '2023-05-20');

-- =============================================================================
-- CATEGORIES
-- =============================================================================

INSERT INTO categories (id, parent_id, name, slug, description, display_order) VALUES
-- Top-level
('cccccccc-0001-0001-0001-000000000001', NULL, 'Cakes',       'cakes',     'Celebration and everyday cakes', 1),
('cccccccc-0001-0001-0001-000000000002', NULL, 'Pastries',    'pastries',  'Freshly baked pastries',          2),
('cccccccc-0001-0001-0001-000000000003', NULL, 'Frozen',      'frozen',    'Ice cream, gelato, and sorbet',   3),
('cccccccc-0001-0001-0001-000000000004', NULL, 'Cookies',     'cookies',   'Artisan cookies and bars',        4),
('cccccccc-0001-0001-0001-000000000005', NULL, 'Beverages',   'beverages', 'Hot and cold dessert drinks',     5),
-- Cake sub-categories
('cccccccc-0001-0001-0002-000000000001', 'cccccccc-0001-0001-0001-000000000001', 'Birthday Cakes',  'birthday-cakes',  NULL, 1),
('cccccccc-0001-0001-0002-000000000002', 'cccccccc-0001-0001-0001-000000000001', 'Wedding Cakes',   'wedding-cakes',   NULL, 2),
('cccccccc-0001-0001-0002-000000000003', 'cccccccc-0001-0001-0001-000000000001', 'Cheesecakes',     'cheesecakes',     NULL, 3),
-- Pastry sub-categories
('cccccccc-0001-0001-0003-000000000001', 'cccccccc-0001-0001-0001-000000000002', 'Croissants',  'croissants',  NULL, 1),
('cccccccc-0001-0001-0003-000000000002', 'cccccccc-0001-0001-0001-000000000002', 'Eclairs',     'eclairs',     NULL, 2),
('cccccccc-0001-0001-0003-000000000003', 'cccccccc-0001-0001-0001-000000000002', 'Macarons',    'macarons',    NULL, 3);

-- =============================================================================
-- PRODUCTS
-- =============================================================================

INSERT INTO products (id, category_id, name, slug, description, base_price, cost_price, is_active, is_featured, prep_time_minutes, shelf_life_hours, tags) VALUES
(
    'dddddddd-0001-0001-0001-000000000001',
    'cccccccc-0001-0001-0002-000000000001',
    'Classic Birthday Cake',
    'classic-birthday-cake',
    'Moist vanilla sponge layered with silky buttercream frosting, customizable for any occasion.',
    45.00, 12.00, TRUE, TRUE, 60, 72,
    ARRAY['vanilla','customizable','celebration']
),
(
    'dddddddd-0001-0001-0001-000000000002',
    'cccccccc-0001-0001-0002-000000000003',
    'New York Cheesecake',
    'new-york-cheesecake',
    'Dense, creamy New York-style cheesecake on a buttery graham cracker crust.',
    38.00, 9.50, TRUE, TRUE, 240, 96,
    ARRAY['classic','cream-cheese','no-gluten-option']
),
(
    'dddddddd-0001-0001-0001-000000000003',
    'cccccccc-0001-0001-0003-000000000001',
    'Butter Croissant',
    'butter-croissant',
    'Flaky, golden-brown croissant made with premium European butter.',
    4.50, 1.20, TRUE, FALSE, 180, 24,
    ARRAY['buttery','flaky','breakfast']
),
(
    'dddddddd-0001-0001-0001-000000000004',
    'cccccccc-0001-0001-0003-000000000003',
    'French Macaron (Single)',
    'french-macaron-single',
    'Delicate almond meringue shells sandwiched with ganache or buttercream. Available in seasonal flavors.',
    3.50, 0.95, TRUE, TRUE, 30, 72,
    ARRAY['french','almond','gluten-free','seasonal']
),
(
    'dddddddd-0001-0001-0001-000000000005',
    'cccccccc-0001-0001-0001-000000000003',
    'Salted Caramel Ice Cream (Scoop)',
    'salted-caramel-ice-cream',
    'Rich, house-made salted caramel ice cream. One generous scoop.',
    6.00, 1.80, TRUE, FALSE, 5, 0,
    ARRAY['ice-cream','caramel','frozen']
),
(
    'dddddddd-0001-0001-0001-000000000006',
    'cccccccc-0001-0001-0001-000000000004',
    'Chocolate Chip Cookie',
    'chocolate-chip-cookie',
    'Thick, gooey chocolate chip cookies baked fresh daily.',
    3.00, 0.75, TRUE, FALSE, 20, 48,
    ARRAY['cookie','chocolate','daily-fresh']
);

-- =============================================================================
-- PRODUCT ALLERGENS
-- =============================================================================

INSERT INTO product_allergens (product_id, allergen, is_contains) VALUES
('dddddddd-0001-0001-0001-000000000001', 'gluten', TRUE),
('dddddddd-0001-0001-0001-000000000001', 'dairy',  TRUE),
('dddddddd-0001-0001-0001-000000000001', 'eggs',   TRUE),
('dddddddd-0001-0001-0001-000000000002', 'dairy',  TRUE),
('dddddddd-0001-0001-0001-000000000002', 'eggs',   TRUE),
('dddddddd-0001-0001-0001-000000000002', 'gluten', TRUE),
('dddddddd-0001-0001-0001-000000000003', 'gluten', TRUE),
('dddddddd-0001-0001-0001-000000000003', 'dairy',  TRUE),
('dddddddd-0001-0001-0001-000000000004', 'nuts',   TRUE),  -- almonds
('dddddddd-0001-0001-0001-000000000004', 'eggs',   TRUE),
('dddddddd-0001-0001-0001-000000000005', 'dairy',  TRUE),
('dddddddd-0001-0001-0001-000000000006', 'gluten', TRUE),
('dddddddd-0001-0001-0001-000000000006', 'dairy',  TRUE),
('dddddddd-0001-0001-0001-000000000006', 'eggs',   TRUE);

-- =============================================================================
-- PRODUCT VARIANTS (Size options for Birthday Cake)
-- =============================================================================

INSERT INTO variant_option_groups (id, product_id, name, display_order, is_required) VALUES
('eeeeeeee-0001-0001-0001-000000000001', 'dddddddd-0001-0001-0001-000000000001', 'Size',   1, TRUE),
('eeeeeeee-0001-0001-0001-000000000002', 'dddddddd-0001-0001-0001-000000000001', 'Flavor', 2, TRUE);

INSERT INTO variant_options (id, group_id, name, price_modifier, display_order) VALUES
('ffffffff-0001-0001-0001-000000000001', 'eeeeeeee-0001-0001-0001-000000000001', '6 inch (serves 8)',   0.00,  1),
('ffffffff-0001-0001-0001-000000000002', 'eeeeeeee-0001-0001-0001-000000000001', '8 inch (serves 14)',  15.00, 2),
('ffffffff-0001-0001-0001-000000000003', 'eeeeeeee-0001-0001-0001-000000000001', '10 inch (serves 22)', 35.00, 3),
('ffffffff-0001-0001-0001-000000000004', 'eeeeeeee-0001-0001-0001-000000000002', 'Vanilla',       0.00,  1),
('ffffffff-0001-0001-0001-000000000005', 'eeeeeeee-0001-0001-0001-000000000002', 'Chocolate',     0.00,  2),
('ffffffff-0001-0001-0001-000000000006', 'eeeeeeee-0001-0001-0001-000000000002', 'Red Velvet',    5.00,  3),
('ffffffff-0001-0001-0001-000000000007', 'eeeeeeee-0001-0001-0001-000000000002', 'Lemon',         5.00,  4);

-- =============================================================================
-- CUSTOMIZATIONS
-- =============================================================================

INSERT INTO customization_options (id, name, description, price) VALUES
('11111111-0001-0001-0001-000000000001', 'Custom Message on Cake', 'Add a personalized message on the cake topper', 0.00),
('11111111-0001-0001-0001-000000000002', 'Gift Box Packaging',     'Upgrade to premium gift box',                  3.50),
('11111111-0001-0001-0001-000000000003', 'Candles & Sparklers',    'Add birthday candles and sparklers',            2.50),
('11111111-0001-0001-0001-000000000004', 'Custom Cake Topper',     'Add a custom printed cake topper',              8.00);

INSERT INTO product_customizations (product_id, customization_id, is_required) VALUES
('dddddddd-0001-0001-0001-000000000001', '11111111-0001-0001-0001-000000000001', FALSE),
('dddddddd-0001-0001-0001-000000000001', '11111111-0001-0001-0001-000000000002', FALSE),
('dddddddd-0001-0001-0001-000000000001', '11111111-0001-0001-0001-000000000003', FALSE),
('dddddddd-0001-0001-0001-000000000001', '11111111-0001-0001-0001-000000000004', FALSE);

-- =============================================================================
-- INGREDIENTS
-- =============================================================================

INSERT INTO ingredients (id, name, unit, allergens) VALUES
('22222222-0001-0001-0001-000000000001', 'All-Purpose Flour',   'kilogram', ARRAY['gluten']::allergen_type[]),
('22222222-0001-0001-0001-000000000002', 'Unsalted Butter',     'kilogram', ARRAY['dairy']::allergen_type[]),
('22222222-0001-0001-0001-000000000003', 'Granulated Sugar',    'kilogram', ARRAY[]::allergen_type[]),
('22222222-0001-0001-0001-000000000004', 'Eggs (large)',        'piece',    ARRAY['eggs']::allergen_type[]),
('22222222-0001-0001-0001-000000000005', 'Whole Milk',          'liter',    ARRAY['dairy']::allergen_type[]),
('22222222-0001-0001-0001-000000000006', 'Heavy Cream',         'liter',    ARRAY['dairy']::allergen_type[]),
('22222222-0001-0001-0001-000000000007', 'Vanilla Extract',     'milliliter', ARRAY[]::allergen_type[]),
('22222222-0001-0001-0001-000000000008', 'Baking Powder',       'gram',     ARRAY[]::allergen_type[]),
('22222222-0001-0001-0001-000000000009', 'Cocoa Powder',        'kilogram', ARRAY[]::allergen_type[]),
('22222222-0001-0001-0001-000000000010', 'Cream Cheese',        'kilogram', ARRAY['dairy']::allergen_type[]),
('22222222-0001-0001-0001-000000000011', 'Almond Flour',        'kilogram', ARRAY['nuts']::allergen_type[]),
('22222222-0001-0001-0001-000000000012', 'Powdered Sugar',      'kilogram', ARRAY[]::allergen_type[]),
('22222222-0001-0001-0001-000000000013', 'Dark Chocolate',      'kilogram', ARRAY['dairy']::allergen_type[]),
('22222222-0001-0001-0001-000000000014', 'Sea Salt',            'gram',     ARRAY[]::allergen_type[]),
('22222222-0001-0001-0001-000000000015', 'Graham Crackers',     'kilogram', ARRAY['gluten']::allergen_type[]);

-- =============================================================================
-- SUPPLIERS
-- =============================================================================

INSERT INTO suppliers (id, name, contact_name, email, phone, city, state, payment_terms) VALUES
('33333333-0001-0001-0001-000000000001', 'Metro Baking Supplies', 'Tom Reilly',     'tom@metrobaking.com',    '+1-718-555-2001', 'Brooklyn',     'NY', 'Net 30'),
('33333333-0001-0001-0001-000000000002', 'Dairy Fresh Co.',        'Linda Park',     'linda@dairyfresh.com',   '+1-201-555-2002', 'Jersey City',  'NJ', 'Net 15'),
('33333333-0001-0001-0001-000000000003', 'Sweet Valley Farms',     'Carlos Rivera',  'carlos@sweetvalley.com', '+1-914-555-2003', 'White Plains', 'NY', 'COD');

INSERT INTO supplier_ingredients (supplier_id, ingredient_id, unit_price, price_unit, min_order_quantity, lead_time_days, is_preferred) VALUES
('33333333-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000001', 0.85,  'kilogram', 10,   2, TRUE),
('33333333-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000003', 0.70,  'kilogram', 10,   2, TRUE),
('33333333-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000008', 5.50,  'kilogram', 1,    2, TRUE),
('33333333-0001-0001-0001-000000000002', '22222222-0001-0001-0001-000000000002', 6.20,  'kilogram', 5,    1, TRUE),
('33333333-0001-0001-0001-000000000002', '22222222-0001-0001-0001-000000000005', 1.10,  'liter',    20,   1, TRUE),
('33333333-0001-0001-0001-000000000002', '22222222-0001-0001-0001-000000000006', 3.80,  'liter',    10,   1, TRUE),
('33333333-0001-0001-0001-000000000002', '22222222-0001-0001-0001-000000000010', 7.50,  'kilogram', 5,    1, TRUE),
('33333333-0001-0001-0001-000000000003', '22222222-0001-0001-0001-000000000004', 0.30,  'piece',    120,  1, TRUE),
('33333333-0001-0001-0001-000000000003', '22222222-0001-0001-0001-000000000013', 14.00, 'kilogram', 2,    3, TRUE);

-- =============================================================================
-- INVENTORY (Downtown location stock)
-- =============================================================================

INSERT INTO inventory (location_id, ingredient_id, quantity_on_hand, unit, reorder_point, reorder_quantity, unit_cost) VALUES
('aaaaaaaa-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000001', 25.0,  'kilogram', 10.0, 20.0, 0.85),
('aaaaaaaa-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000002', 8.0,   'kilogram', 3.0,  10.0, 6.20),
('aaaaaaaa-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000003', 18.0,  'kilogram', 5.0,  15.0, 0.70),
('aaaaaaaa-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000004', 60.0,  'piece',    24.0, 120.0, 0.30),
('aaaaaaaa-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000005', 12.0,  'liter',    5.0,  20.0, 1.10),
('aaaaaaaa-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000006', 6.0,   'liter',    2.0,  10.0, 3.80),
('aaaaaaaa-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000010', 4.5,   'kilogram', 2.0,  5.0,  7.50),
('aaaaaaaa-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000013', 3.0,   'kilogram', 1.0,  4.0,  14.00);

-- =============================================================================
-- CUSTOMERS
-- =============================================================================

INSERT INTO customers (id, first_name, last_name, email, phone, date_of_birth, marketing_opt_in) VALUES
('44444444-0001-0001-0001-000000000001', 'Alice',   'Thompson', 'alice@example.com',  '+1-646-555-3001', '1990-03-15', TRUE),
('44444444-0001-0001-0001-000000000002', 'Bob',     'Martinez', 'bob@example.com',    '+1-646-555-3002', '1985-07-22', TRUE),
('44444444-0001-0001-0001-000000000003', 'Claire',  'Johnson',  'claire@example.com', '+1-646-555-3003', '1995-11-08', FALSE);

INSERT INTO customer_addresses (customer_id, label, recipient_name, address_line1, city, state, postal_code, country, is_default) VALUES
('44444444-0001-0001-0001-000000000001', 'Home', 'Alice Thompson', '10 West 70th St Apt 4B', 'New York', 'NY', '10023', 'US', TRUE),
('44444444-0001-0001-0001-000000000002', 'Home', 'Bob Martinez',   '88 East 42nd St',         'New York', 'NY', '10017', 'US', TRUE);

-- Loyalty accounts
INSERT INTO loyalty_accounts (customer_id, points_balance, tier, lifetime_points) VALUES
('44444444-0001-0001-0001-000000000001', 320,  'bronze', 320),
('44444444-0001-0001-0001-000000000002', 1250, 'silver', 1250),
('44444444-0001-0001-0001-000000000003', 75,   'bronze', 75);

-- =============================================================================
-- PROMOTIONS
-- =============================================================================

INSERT INTO promotions (id, name, description, type, code, discount_value, minimum_order_amount, max_uses_per_customer, is_active, starts_at, expires_at, created_by) VALUES
(
    '55555555-0001-0001-0001-000000000001',
    'Welcome 10% Off',
    'First order discount for new customers',
    'percentage_discount',
    'WELCOME10',
    10.00,
    15.00,
    1,
    TRUE,
    '2026-01-01 00:00:00+00',
    '2026-12-31 23:59:59+00',
    'bbbbbbbb-0001-0001-0001-000000000001'
),
(
    '55555555-0001-0001-0001-000000000002',
    'Summer Sweets Sale',
    '15% off all frozen desserts this summer',
    'percentage_discount',
    'SUMMER15',
    15.00,
    NULL,
    NULL,
    TRUE,
    '2026-06-01 00:00:00+00',
    '2026-08-31 23:59:59+00',
    'bbbbbbbb-0001-0001-0001-000000000001'
),
(
    '55555555-0001-0001-0001-000000000003',
    'Free Delivery Over $50',
    'Free delivery on orders over $50',
    'free_delivery',
    NULL,
    0.00,
    50.00,
    NULL,
    TRUE,
    '2026-01-01 00:00:00+00',
    NULL,
    'bbbbbbbb-0001-0001-0001-000000000001'
);

-- =============================================================================
-- GIFT CARDS
-- =============================================================================

INSERT INTO gift_cards (id, code, initial_balance, current_balance, purchased_by, activated_at) VALUES
('66666666-0001-0001-0001-000000000001', 'GIFT-AHBJ-0001-XYZW', 50.00,  50.00,  '44444444-0001-0001-0001-000000000001', NOW()),
('66666666-0001-0001-0001-000000000002', 'GIFT-AHBJ-0002-ABCD', 100.00, 100.00, '44444444-0001-0001-0001-000000000002', NOW());
