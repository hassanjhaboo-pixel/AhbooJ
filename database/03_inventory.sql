-- =============================================================================
-- AHBOOJ DESSERT BUSINESS DATABASE
-- File: 03_inventory.sql
-- Description: Suppliers, purchase orders, and inventory management
-- =============================================================================

-- =============================================================================
-- SUPPLIERS
-- =============================================================================

CREATE TABLE suppliers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200) NOT NULL,
    contact_name    VARCHAR(200),
    email           VARCHAR(255),
    phone           VARCHAR(30),
    website         VARCHAR(500),
    address_line1   VARCHAR(255),
    address_line2   VARCHAR(255),
    city            VARCHAR(100),
    state           VARCHAR(100),
    postal_code     VARCHAR(20),
    country         VARCHAR(100) DEFAULT 'US',
    payment_terms   VARCHAR(100),   -- e.g., "Net 30", "COD", "Prepaid"
    notes           TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_active ON suppliers(is_active);

-- Which suppliers provide which ingredients (with pricing)
CREATE TABLE supplier_ingredients (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id         UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    ingredient_id       UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    supplier_sku        VARCHAR(100),       -- supplier's own product code
    unit_price          NUMERIC(10, 4) NOT NULL CHECK (unit_price >= 0),
    price_unit          unit_of_measure NOT NULL,
    min_order_quantity  NUMERIC(10, 2),
    lead_time_days      INTEGER,            -- typical delivery time
    is_preferred        BOOLEAN NOT NULL DEFAULT FALSE,  -- preferred supplier for this ingredient
    last_price_update   DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (supplier_id, ingredient_id)
);

CREATE INDEX idx_supplier_ingredients_supplier ON supplier_ingredients(supplier_id);
CREATE INDEX idx_supplier_ingredients_ingredient ON supplier_ingredients(ingredient_id);

-- =============================================================================
-- PURCHASE ORDERS
-- =============================================================================

CREATE TYPE purchase_order_status AS ENUM (
    'draft',
    'submitted',
    'confirmed',
    'partially_received',
    'received',
    'cancelled'
);

CREATE TABLE purchase_orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id     UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    location_id     UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    created_by      UUID REFERENCES staff(id) ON DELETE SET NULL,
    approved_by     UUID REFERENCES staff(id) ON DELETE SET NULL,
    status          purchase_order_status NOT NULL DEFAULT 'draft',
    order_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date   DATE,
    received_date   DATE,
    subtotal        NUMERIC(12, 2),
    tax_amount      NUMERIC(12, 2) DEFAULT 0,
    shipping_cost   NUMERIC(12, 2) DEFAULT 0,
    total_amount    NUMERIC(12, 2),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_location ON purchase_orders(location_id);
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_po_order_date ON purchase_orders(order_date);

CREATE TABLE purchase_order_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id   UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    ingredient_id       UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    ordered_quantity    NUMERIC(10, 2) NOT NULL CHECK (ordered_quantity > 0),
    received_quantity   NUMERIC(10, 2) DEFAULT 0,
    unit                unit_of_measure NOT NULL,
    unit_price          NUMERIC(10, 4) NOT NULL,
    line_total          NUMERIC(12, 2) GENERATED ALWAYS AS (ordered_quantity * unit_price) STORED,
    expiry_date         DATE,
    batch_number        VARCHAR(100),
    notes               TEXT
);

CREATE INDEX idx_po_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_po_items_ingredient ON purchase_order_items(ingredient_id);

-- =============================================================================
-- INVENTORY
-- =============================================================================

-- Current stock levels per ingredient per location
CREATE TABLE inventory (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id         UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    ingredient_id       UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity_on_hand    NUMERIC(12, 4) NOT NULL DEFAULT 0,
    unit                unit_of_measure NOT NULL,
    reorder_point       NUMERIC(12, 4),     -- trigger reorder when below this
    reorder_quantity    NUMERIC(12, 4),     -- how much to order
    max_stock           NUMERIC(12, 4),     -- max storage capacity
    unit_cost           NUMERIC(10, 4),     -- last known cost per unit
    location_in_store   VARCHAR(100),       -- shelf/fridge/freezer location
    last_counted_at     TIMESTAMPTZ,        -- last physical count
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (location_id, ingredient_id)
);

CREATE INDEX idx_inventory_location ON inventory(location_id);
CREATE INDEX idx_inventory_ingredient ON inventory(ingredient_id);
CREATE INDEX idx_inventory_low_stock ON inventory(quantity_on_hand, reorder_point);

-- All movements of inventory in and out
CREATE TABLE inventory_transactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id         UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    ingredient_id       UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    transaction_type    inventory_transaction_type NOT NULL,
    quantity            NUMERIC(12, 4) NOT NULL,    -- positive = in, negative = out
    unit                unit_of_measure NOT NULL,
    unit_cost           NUMERIC(10, 4),
    reference_id        UUID,       -- links to purchase_order_items or order_items
    reference_type      VARCHAR(50),-- 'purchase_order_item', 'order', 'waste_log', etc.
    performed_by        UUID REFERENCES staff(id) ON DELETE SET NULL,
    notes               TEXT,
    batch_number        VARCHAR(100),
    expiry_date         DATE,
    transacted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inv_tx_location ON inventory_transactions(location_id);
CREATE INDEX idx_inv_tx_ingredient ON inventory_transactions(ingredient_id);
CREATE INDEX idx_inv_tx_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_inv_tx_date ON inventory_transactions(transacted_at);
CREATE INDEX idx_inv_tx_reference ON inventory_transactions(reference_id, reference_type);

-- Waste/spoilage log
CREATE TABLE waste_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id     UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    ingredient_id   UUID REFERENCES ingredients(id) ON DELETE SET NULL,
    product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity        NUMERIC(10, 4) NOT NULL CHECK (quantity > 0),
    unit            unit_of_measure NOT NULL,
    reason          VARCHAR(255) NOT NULL,  -- 'expired', 'dropped', 'overproduction', etc.
    estimated_cost  NUMERIC(10, 2),
    logged_by       UUID REFERENCES staff(id) ON DELETE SET NULL,
    logged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_waste_logs_location ON waste_logs(location_id);
CREATE INDEX idx_waste_logs_date ON waste_logs(logged_at);
