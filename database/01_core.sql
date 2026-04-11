-- =============================================================================
-- AHBOOJ DESSERT BUSINESS DATABASE
-- File: 01_core.sql
-- Description: Extensions, enums, locations, and staff management
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy text search on product names

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE order_status AS ENUM (
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'out_for_delivery',
    'delivered',
    'picked_up',
    'cancelled',
    'refunded'
);

CREATE TYPE order_type AS ENUM (
    'in_store',
    'pickup',
    'delivery'
);

CREATE TYPE payment_status AS ENUM (
    'pending',
    'authorized',
    'captured',
    'failed',
    'refunded',
    'partially_refunded'
);

CREATE TYPE payment_method AS ENUM (
    'cash',
    'credit_card',
    'debit_card',
    'digital_wallet',
    'gift_card',
    'loyalty_points',
    'bank_transfer'
);

CREATE TYPE staff_role AS ENUM (
    'owner',
    'manager',
    'supervisor',
    'baker',
    'decorator',
    'cashier',
    'delivery_driver',
    'inventory_staff'
);

CREATE TYPE promotion_type AS ENUM (
    'percentage_discount',
    'fixed_discount',
    'buy_x_get_y',
    'free_item',
    'free_delivery'
);

CREATE TYPE loyalty_transaction_type AS ENUM (
    'earned',
    'redeemed',
    'expired',
    'adjusted',
    'bonus'
);

CREATE TYPE inventory_transaction_type AS ENUM (
    'purchase',
    'usage',
    'waste',
    'adjustment',
    'transfer_in',
    'transfer_out',
    'return_to_supplier'
);

CREATE TYPE unit_of_measure AS ENUM (
    'gram',
    'kilogram',
    'milliliter',
    'liter',
    'piece',
    'dozen',
    'cup',
    'tablespoon',
    'teaspoon',
    'ounce',
    'pound',
    'box',
    'bag',
    'bottle'
);

CREATE TYPE allergen_type AS ENUM (
    'gluten',
    'dairy',
    'eggs',
    'nuts',
    'peanuts',
    'soy',
    'sesame',
    'shellfish',
    'fish',
    'sulfites'
);

-- =============================================================================
-- LOCATIONS (Store Branches)
-- =============================================================================

CREATE TABLE locations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    address_line1   VARCHAR(255) NOT NULL,
    address_line2   VARCHAR(255),
    city            VARCHAR(100) NOT NULL,
    state           VARCHAR(100) NOT NULL,
    postal_code     VARCHAR(20) NOT NULL,
    country         VARCHAR(100) NOT NULL DEFAULT 'US',
    phone           VARCHAR(30),
    email           VARCHAR(255),
    latitude        NUMERIC(10, 8),
    longitude       NUMERIC(11, 8),
    timezone        VARCHAR(60) NOT NULL DEFAULT 'UTC',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    accepts_delivery    BOOLEAN NOT NULL DEFAULT TRUE,
    accepts_pickup      BOOLEAN NOT NULL DEFAULT TRUE,
    delivery_radius_km  NUMERIC(6, 2),
    opening_hours   JSONB,  -- { "mon": {"open": "08:00", "close": "20:00"}, ... }
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_locations_city ON locations(city);
CREATE INDEX idx_locations_is_active ON locations(is_active);

-- =============================================================================
-- STAFF
-- =============================================================================

CREATE TABLE staff (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id     UUID REFERENCES locations(id) ON DELETE SET NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone           VARCHAR(30),
    role            staff_role NOT NULL,
    pin_hash        TEXT,               -- hashed 4-digit PIN for POS login
    password_hash   TEXT,               -- hashed password for back-office login
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    hired_at        DATE,
    terminated_at   DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_location ON staff(location_id);
CREATE INDEX idx_staff_role ON staff(role);
CREATE INDEX idx_staff_email ON staff(email);

-- Staff shift scheduling
CREATE TABLE staff_shifts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id        UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    location_id     UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end   TIMESTAMPTZ NOT NULL,
    actual_start    TIMESTAMPTZ,
    actual_end      TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shifts_staff ON staff_shifts(staff_id);
CREATE INDEX idx_shifts_location ON staff_shifts(location_id);
CREATE INDEX idx_shifts_scheduled_start ON staff_shifts(scheduled_start);
