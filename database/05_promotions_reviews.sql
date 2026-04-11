-- =============================================================================
-- AHBOOJ DESSERT BUSINESS DATABASE
-- File: 05_promotions_reviews.sql
-- Description: Promotions, gift cards, discount codes, and customer reviews
-- =============================================================================

-- =============================================================================
-- PROMOTIONS / DISCOUNT RULES
-- =============================================================================

CREATE TABLE promotions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(200) NOT NULL,
    description         TEXT,
    type                promotion_type NOT NULL,
    code                VARCHAR(50) UNIQUE,     -- null = automatic promotion (no code needed)
    discount_value      NUMERIC(10, 2),         -- percentage (0-100) or fixed amount
    buy_quantity        INTEGER,                -- for buy_x_get_y
    get_quantity        INTEGER,                -- for buy_x_get_y
    free_product_id     UUID REFERENCES products(id) ON DELETE SET NULL,

    -- Eligibility
    minimum_order_amount    NUMERIC(10, 2),
    minimum_items           INTEGER,
    applicable_products     UUID[],             -- null = all products
    applicable_categories   UUID[],             -- null = all categories
    applicable_order_types  order_type[],       -- null = all types

    -- Limits
    max_uses_total      INTEGER,                -- null = unlimited
    max_uses_per_customer INTEGER DEFAULT 1,
    current_uses        INTEGER NOT NULL DEFAULT 0,

    -- Loyalty tier requirement
    required_tier       VARCHAR(50),            -- null = all tiers

    -- Validity
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    starts_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMPTZ,

    created_by          UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_promotions_code ON promotions(code);
CREATE INDEX idx_promotions_active ON promotions(is_active);
CREATE INDEX idx_promotions_dates ON promotions(starts_at, expires_at);

-- Track which customers used which promotions
CREATE TABLE promotion_usage (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id    UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    discount_applied NUMERIC(10, 2) NOT NULL,
    used_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (promotion_id, order_id)
);

CREATE INDEX idx_promo_usage_promotion ON promotion_usage(promotion_id);
CREATE INDEX idx_promo_usage_customer ON promotion_usage(customer_id);
CREATE INDEX idx_promo_usage_order ON promotion_usage(order_id);

-- Add FK for orders.promotion_id now that promotions table exists
ALTER TABLE orders
    ADD CONSTRAINT fk_orders_promotion
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL;

-- =============================================================================
-- GIFT CARDS
-- =============================================================================

CREATE TABLE gift_cards (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code            VARCHAR(50) UNIQUE NOT NULL,
    initial_balance NUMERIC(10, 2) NOT NULL CHECK (initial_balance > 0),
    current_balance NUMERIC(10, 2) NOT NULL CHECK (current_balance >= 0),
    currency        CHAR(3) NOT NULL DEFAULT 'USD',
    purchased_by    UUID REFERENCES customers(id) ON DELETE SET NULL,
    purchased_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    activated_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    notes           TEXT
);

CREATE INDEX idx_gift_cards_code ON gift_cards(code);
CREATE INDEX idx_gift_cards_customer ON gift_cards(purchased_by);

CREATE TABLE gift_card_transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gift_card_id    UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
    order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
    amount          NUMERIC(10, 2) NOT NULL,    -- negative = debit, positive = credit/top-up
    balance_after   NUMERIC(10, 2) NOT NULL,
    description     VARCHAR(255),
    transacted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gc_tx_card ON gift_card_transactions(gift_card_id);

-- Add FK for payments.gift_card_id now that gift_cards table exists
ALTER TABLE payments
    ADD CONSTRAINT fk_payments_gift_card
    FOREIGN KEY (gift_card_id) REFERENCES gift_cards(id) ON DELETE SET NULL;

-- =============================================================================
-- REVIEWS & RATINGS
-- =============================================================================

CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
    product_id      UUID REFERENCES products(id) ON DELETE SET NULL,  -- null = store review
    location_id     UUID REFERENCES locations(id) ON DELETE SET NULL, -- null = product review
    rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title           VARCHAR(200),
    body            TEXT,
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,  -- verified purchase
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,
    is_flagged      BOOLEAN NOT NULL DEFAULT FALSE,
    staff_response  TEXT,
    responded_by    UUID REFERENCES staff(id) ON DELETE SET NULL,
    responded_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Each customer can review each product once per order
    UNIQUE (customer_id, product_id, order_id)
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_location ON reviews(location_id);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_published ON reviews(is_published);

-- =============================================================================
-- LOYALTY TIERS CONFIGURATION
-- =============================================================================

CREATE TABLE loyalty_tiers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(50) UNIQUE NOT NULL,    -- 'bronze', 'silver', 'gold', 'platinum'
    min_lifetime_points INTEGER NOT NULL DEFAULT 0,
    points_per_dollar   NUMERIC(6, 2) NOT NULL DEFAULT 1.0,  -- how many points per $1 spent
    points_value        NUMERIC(6, 4) NOT NULL DEFAULT 0.01, -- dollar value of each point
    birthday_bonus_points INTEGER DEFAULT 0,
    display_color       VARCHAR(7),                     -- hex color code
    benefits            JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO loyalty_tiers (name, min_lifetime_points, points_per_dollar, points_value, birthday_bonus_points, display_color) VALUES
    ('bronze',   0,     1.0, 0.01, 50,  '#CD7F32'),
    ('silver',   500,   1.5, 0.01, 100, '#C0C0C0'),
    ('gold',     2000,  2.0, 0.01, 200, '#FFD700'),
    ('platinum', 10000, 3.0, 0.01, 500, '#E5E4E2');

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================

CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'bounced');

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id     UUID REFERENCES customers(id) ON DELETE CASCADE,
    channel         notification_channel NOT NULL,
    status          notification_status NOT NULL DEFAULT 'pending',
    template        VARCHAR(100) NOT NULL,   -- 'order_confirmed', 'order_ready', 'birthday', etc.
    subject         VARCHAR(500),
    body            TEXT,
    reference_id    UUID,                    -- order_id, etc.
    reference_type  VARCHAR(50),
    sent_at         TIMESTAMPTZ,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_customer ON notifications(customer_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created ON notifications(created_at);
