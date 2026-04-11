-- =============================================================================
-- AHBOOJ DESSERT BUSINESS DATABASE
-- File: 02_products.sql
-- Description: Product catalog, categories, variants, and recipes
-- =============================================================================

-- =============================================================================
-- CATEGORIES
-- =============================================================================

CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    description     TEXT,
    image_url       TEXT,
    display_order   INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Example hierarchy: Cakes > Birthday Cakes, Wedding Cakes
--                    Pastries > Croissants, Danishes
--                    Frozen > Ice Cream, Gelato, Sorbet

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active ON categories(is_active);

-- =============================================================================
-- PRODUCTS
-- =============================================================================

CREATE TABLE products (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id         UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name                VARCHAR(200) NOT NULL,
    slug                VARCHAR(200) UNIQUE NOT NULL,
    description         TEXT,
    short_description   VARCHAR(500),
    sku                 VARCHAR(100) UNIQUE,
    base_price          NUMERIC(10, 2) NOT NULL CHECK (base_price >= 0),
    cost_price          NUMERIC(10, 2) CHECK (cost_price >= 0),  -- for margin tracking
    image_url           TEXT,
    additional_images   JSONB,          -- array of image URLs
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
    is_seasonal         BOOLEAN NOT NULL DEFAULT FALSE,
    season_start        DATE,           -- null = available all year
    season_end          DATE,
    min_order_qty       INTEGER NOT NULL DEFAULT 1,
    max_order_qty       INTEGER,
    prep_time_minutes   INTEGER,        -- how long to prepare
    shelf_life_hours    INTEGER,        -- how long it stays fresh
    weight_grams        NUMERIC(8, 2),  -- for shipping/delivery calculations
    tags                TEXT[],         -- searchable tags: ['vegan','gluten-free','nut-free']
    meta_title          VARCHAR(255),
    meta_description    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_tags ON products USING gin(tags);
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

-- Products available at specific locations (null = all locations)
CREATE TABLE product_locations (
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    location_id     UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    is_available    BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (product_id, location_id)
);

-- =============================================================================
-- PRODUCT ALLERGENS
-- =============================================================================

CREATE TABLE product_allergens (
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    allergen        allergen_type NOT NULL,
    is_contains     BOOLEAN NOT NULL DEFAULT TRUE,   -- TRUE = contains, FALSE = may contain (cross-contamination)
    PRIMARY KEY (product_id, allergen)
);

-- =============================================================================
-- PRODUCT VARIANTS
-- (e.g., a cake available in 6-inch, 8-inch, 10-inch; or chocolate/vanilla)
-- =============================================================================

CREATE TABLE variant_option_groups (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,   -- e.g., "Size", "Flavor", "Frosting"
    display_order   INTEGER NOT NULL DEFAULT 0,
    is_required     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_variant_groups_product ON variant_option_groups(product_id);

CREATE TABLE variant_options (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id        UUID NOT NULL REFERENCES variant_option_groups(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,   -- e.g., "6 inch", "Chocolate", "Buttercream"
    price_modifier  NUMERIC(10, 2) NOT NULL DEFAULT 0,  -- added to base_price
    sku_suffix      VARCHAR(50),
    display_order   INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_variant_options_group ON variant_options(group_id);

-- A specific combination of options forms a product variant (SKU)
CREATE TABLE product_variants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku             VARCHAR(150) UNIQUE,
    price_override  NUMERIC(10, 2),     -- if set, overrides base + modifiers
    cost_price      NUMERIC(10, 2),
    stock_quantity  INTEGER,            -- null = made-to-order (no stock tracking)
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_variants_product ON product_variants(product_id);

-- Which options make up a variant
CREATE TABLE product_variant_options (
    variant_id      UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    option_id       UUID NOT NULL REFERENCES variant_options(id) ON DELETE CASCADE,
    PRIMARY KEY (variant_id, option_id)
);

-- =============================================================================
-- CUSTOMIZATIONS (Add-ons / special requests)
-- (e.g., "Add custom message", "Extra frosting", "Box packaging upgrade")
-- =============================================================================

CREATE TABLE customization_options (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    price           NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Which customizations apply to which products
CREATE TABLE product_customizations (
    product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customization_id    UUID NOT NULL REFERENCES customization_options(id) ON DELETE CASCADE,
    is_required         BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (product_id, customization_id)
);

-- =============================================================================
-- INGREDIENTS
-- =============================================================================

CREATE TABLE ingredients (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    unit            unit_of_measure NOT NULL,
    allergens       allergen_type[],
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ingredients_name ON ingredients(name);
CREATE INDEX idx_ingredients_allergens ON ingredients USING gin(allergens);

-- =============================================================================
-- RECIPES
-- =============================================================================

CREATE TABLE recipes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id      UUID REFERENCES product_variants(id) ON DELETE CASCADE,  -- null = applies to all variants
    name            VARCHAR(200) NOT NULL,
    instructions    TEXT,
    yield_quantity  NUMERIC(8, 2) NOT NULL DEFAULT 1,  -- how many units this recipe makes
    prep_time_min   INTEGER,
    bake_time_min   INTEGER,
    created_by      UUID REFERENCES staff(id) ON DELETE SET NULL,
    version         INTEGER NOT NULL DEFAULT 1,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recipes_product ON recipes(product_id);

CREATE TABLE recipe_ingredients (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id       UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id   UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity        NUMERIC(10, 4) NOT NULL CHECK (quantity > 0),
    unit            unit_of_measure NOT NULL,
    notes           TEXT        -- e.g., "sifted", "room temperature", "melted"
);

CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);
