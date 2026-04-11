-- =============================================================================
-- AHBOOJ DESSERT BUSINESS DATABASE
-- File: 04_customers_orders.sql
-- Description: Customers, addresses, orders, and payments
-- =============================================================================

-- =============================================================================
-- CUSTOMERS
-- =============================================================================

CREATE TABLE customers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    email               VARCHAR(255) UNIQUE,
    phone               VARCHAR(30) UNIQUE,
    password_hash       TEXT,               -- null = guest checkout
    date_of_birth       DATE,               -- for birthday promotions
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    is_guest            BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified      BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified      BOOLEAN NOT NULL DEFAULT FALSE,
    marketing_opt_in    BOOLEAN NOT NULL DEFAULT FALSE,
    notes               TEXT,               -- internal notes about customer
    preferred_location  UUID REFERENCES locations(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(last_name, first_name);
CREATE INDEX idx_customers_dob ON customers(date_of_birth);

-- =============================================================================
-- CUSTOMER ADDRESSES
-- =============================================================================

CREATE TABLE customer_addresses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    label           VARCHAR(50),            -- 'Home', 'Work', 'Other'
    recipient_name  VARCHAR(200),
    address_line1   VARCHAR(255) NOT NULL,
    address_line2   VARCHAR(255),
    city            VARCHAR(100) NOT NULL,
    state           VARCHAR(100) NOT NULL,
    postal_code     VARCHAR(20) NOT NULL,
    country         VARCHAR(100) NOT NULL DEFAULT 'US',
    phone           VARCHAR(30),
    latitude        NUMERIC(10, 8),
    longitude       NUMERIC(11, 8),
    delivery_notes  TEXT,                   -- gate code, ring doorbell, etc.
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_customer ON customer_addresses(customer_id);

-- =============================================================================
-- LOYALTY PROGRAM
-- =============================================================================

CREATE TABLE loyalty_accounts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id     UUID UNIQUE NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    points_balance  INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
    tier            VARCHAR(50) NOT NULL DEFAULT 'bronze',  -- bronze, silver, gold, platinum
    lifetime_points INTEGER NOT NULL DEFAULT 0,
    enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE loyalty_transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id      UUID NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
    type            loyalty_transaction_type NOT NULL,
    points          INTEGER NOT NULL,           -- positive=earned, negative=redeemed
    balance_after   INTEGER NOT NULL,
    reference_id    UUID,                       -- order_id, etc.
    reference_type  VARCHAR(50),
    description     VARCHAR(500),
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loyalty_tx_account ON loyalty_transactions(account_id);
CREATE INDEX idx_loyalty_tx_date ON loyalty_transactions(created_at);

-- =============================================================================
-- ORDERS
-- =============================================================================

CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number        VARCHAR(50) UNIQUE NOT NULL,    -- human-readable e.g. "AHB-20260411-0042"
    customer_id         UUID REFERENCES customers(id) ON DELETE SET NULL,
    location_id         UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    staff_id            UUID REFERENCES staff(id) ON DELETE SET NULL,  -- staff who took/processed
    order_type          order_type NOT NULL,
    status              order_status NOT NULL DEFAULT 'pending',

    -- Delivery details (for delivery orders)
    delivery_address_id UUID REFERENCES customer_addresses(id) ON DELETE SET NULL,
    delivery_fee        NUMERIC(10, 2) DEFAULT 0,
    delivery_notes      TEXT,
    driver_id           UUID REFERENCES staff(id) ON DELETE SET NULL,
    assigned_at         TIMESTAMPTZ,
    picked_up_at        TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,

    -- Pickup details
    pickup_time         TIMESTAMPTZ,            -- requested pickup time
    picked_up_by        VARCHAR(200),           -- name of person who picked up

    -- Pricing
    subtotal            NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount_amount     NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_rate            NUMERIC(5, 4) NOT NULL DEFAULT 0,
    tax_amount          NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tip_amount          NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_amount        NUMERIC(12, 2) NOT NULL DEFAULT 0,

    -- Promotion
    promotion_id        UUID,                   -- FK added later in 05_promotions.sql
    promo_code          VARCHAR(50),
    loyalty_points_used INTEGER DEFAULT 0,
    loyalty_points_earned INTEGER DEFAULT 0,

    -- Special requests
    special_instructions TEXT,
    occasion            VARCHAR(100),           -- 'Birthday', 'Wedding', 'Anniversary'
    scheduled_for       TIMESTAMPTZ,            -- pre-order for a future date/time

    -- Metadata
    source              VARCHAR(50) DEFAULT 'pos',  -- 'pos', 'website', 'app', 'phone'
    cancelled_at        TIMESTAMPTZ,
    cancellation_reason TEXT,
    refunded_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_location ON orders(location_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_type ON orders(order_type);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_scheduled ON orders(scheduled_for);

-- Auto-generate order numbers
CREATE SEQUENCE order_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'AHB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('order_number_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_number
BEFORE INSERT ON orders
FOR EACH ROW
WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
EXECUTE FUNCTION generate_order_number();

-- =============================================================================
-- ORDER ITEMS
-- =============================================================================

CREATE TABLE order_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id          UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id          UUID REFERENCES product_variants(id) ON DELETE RESTRICT,
    quantity            INTEGER NOT NULL CHECK (quantity > 0),
    unit_price          NUMERIC(10, 2) NOT NULL,
    discount_amount     NUMERIC(10, 2) NOT NULL DEFAULT 0,
    line_total          NUMERIC(12, 2) GENERATED ALWAYS AS ((unit_price - discount_amount) * quantity) STORED,
    customizations      JSONB,          -- selected customization options and their values
    special_notes       TEXT,           -- e.g., "Write 'Happy Birthday John' on top"
    status              VARCHAR(50) DEFAULT 'pending',  -- 'pending','preparing','ready','cancelled'
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- =============================================================================
-- PAYMENTS
-- =============================================================================

CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    method              payment_method NOT NULL,
    status              payment_status NOT NULL DEFAULT 'pending',
    amount              NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency            CHAR(3) NOT NULL DEFAULT 'USD',
    transaction_id      VARCHAR(255),       -- external payment gateway transaction ID
    gateway             VARCHAR(100),       -- 'stripe', 'square', 'paypal', etc.
    gateway_response    JSONB,              -- raw response from payment gateway
    card_last4          CHAR(4),
    card_brand          VARCHAR(50),
    gift_card_id        UUID,               -- FK added in 05_promotions.sql
    processed_at        TIMESTAMPTZ,
    refunded_amount     NUMERIC(12, 2) DEFAULT 0,
    refunded_at         TIMESTAMPTZ,
    refund_reason       TEXT,
    processed_by        UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);
CREATE INDEX idx_payments_created ON payments(created_at);

-- =============================================================================
-- ORDER STATUS HISTORY
-- =============================================================================

CREATE TABLE order_status_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status order_status,
    to_status   order_status NOT NULL,
    changed_by  UUID REFERENCES staff(id) ON DELETE SET NULL,
    notes       TEXT,
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);

-- Trigger to auto-log status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (order_id, from_status, to_status)
        VALUES (NEW.id, OLD.status, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_status_log
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status_change();
