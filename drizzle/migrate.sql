-- ============================================================
-- FENIX PUB — Migration SQL complète
-- À coller dans Neon SQL Editor (console.neon.tech)
-- Toutes les instructions sont idempotentes (IF NOT EXISTS)
-- ============================================================

-- ─── 1. categories ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  slug        VARCHAR(120) NOT NULL UNIQUE,
  icon        VARCHAR(10)  DEFAULT '🗂️',
  description TEXT,
  from_price  VARCHAR(50),
  sort_order  INTEGER      DEFAULT 0,
  active      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP    DEFAULT NOW()
);

-- ─── 2. products ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                SERIAL PRIMARY KEY,
  ref               VARCHAR(100) NOT NULL UNIQUE,
  name              VARCHAR(255) NOT NULL,
  description       TEXT,
  long_description  TEXT,
  category          VARCHAR(100),
  price             NUMERIC(10,2),
  moq               INTEGER      DEFAULT 1,
  material          VARCHAR(255),
  dimensions        VARCHAR(255),
  weight            NUMERIC(10,3),
  country_of_origin VARCHAR(10),
  hs_code           VARCHAR(20),
  image             TEXT,
  images            JSON         DEFAULT '[]',
  variants          JSON         DEFAULT '[]',
  sizes             JSON         DEFAULT '[]',
  colors            TEXT,
  print_techniques  TEXT,
  printable         BOOLEAN      DEFAULT FALSE,
  packaging         JSON,
  meta              JSON,
  source            VARCHAR(50)  DEFAULT 'manual',
  active            BOOLEAN      DEFAULT TRUE,
  created_at        TIMESTAMP    DEFAULT NOW(),
  updated_at        TIMESTAMP    DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS products_category_idx ON products (category);
CREATE INDEX IF NOT EXISTS products_active_idx   ON products (active);

-- ─── 3. users ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  company    VARCHAR(150),
  phone      VARCHAR(30),
  role       VARCHAR(20)  DEFAULT 'client',
  active     BOOLEAN      DEFAULT TRUE,
  created_at TIMESTAMP    DEFAULT NOW(),
  updated_at TIMESTAMP    DEFAULT NOW()
);

-- ─── 4. favorites ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

-- ─── 5. cart_items ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty        INTEGER  NOT NULL DEFAULT 1,
  size       VARCHAR(20),
  color      VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── 6. orders ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               SERIAL PRIMARY KEY,
  order_number     VARCHAR(30) UNIQUE,
  user_id          INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status           VARCHAR(50)  DEFAULT 'pending',
  total            NUMERIC(10,2),
  notes            TEXT,
  admin_notes      TEXT,
  shipping_name    VARCHAR(150),
  shipping_email   VARCHAR(255),
  shipping_phone   VARCHAR(30),
  shipping_company VARCHAR(150),
  shipping_address TEXT,
  created_at       TIMESTAMP    DEFAULT NOW(),
  updated_at       TIMESTAMP    DEFAULT NOW()
);

-- ─── 7. order_items ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id           SERIAL PRIMARY KEY,
  order_id     INTEGER NOT NULL REFERENCES orders(id)   ON DELETE CASCADE,
  product_id   INTEGER          REFERENCES products(id) ON DELETE SET NULL,
  product_ref  VARCHAR(100),
  product_name VARCHAR(255),
  qty          INTEGER NOT NULL,
  size         VARCHAR(20),
  color        VARCHAR(100),
  unit_price   NUMERIC(10,2)
);

-- ─── 8. contact_messages ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name        VARCHAR(150) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  company     VARCHAR(150),
  phone       VARCHAR(30),
  subject     VARCHAR(255),
  message     TEXT         NOT NULL,
  product_ref VARCHAR(100),
  status      VARCHAR(30)  DEFAULT 'nouveau',
  notes       TEXT,
  read_at     TIMESTAMP,
  created_at  TIMESTAMP    DEFAULT NOW()
);

-- ─── 9. testimonials ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS testimonials (
  id         SERIAL PRIMARY KEY,
  text       TEXT         NOT NULL,
  name       VARCHAR(100) NOT NULL,
  company    VARCHAR(150),
  initials   VARCHAR(5),
  rating     INTEGER      DEFAULT 5,
  sort_order INTEGER      DEFAULT 0,
  active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP    DEFAULT NOW(),
  updated_at TIMESTAMP    DEFAULT NOW()
);

-- ─── 10. documents ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  filename    VARCHAR(255),
  url         TEXT,
  description TEXT,
  active      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP    DEFAULT NOW(),
  updated_at  TIMESTAMP    DEFAULT NOW()
);

-- ─── 11. cms_pages ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cms_pages (
  id               SERIAL PRIMARY KEY,
  slug             VARCHAR(120) NOT NULL UNIQUE,
  title            VARCHAR(255) NOT NULL,
  content          TEXT,
  meta_description VARCHAR(300),
  published        BOOLEAN      DEFAULT FALSE,
  sort_order       INTEGER      DEFAULT 0,
  created_at       TIMESTAMP    DEFAULT NOW(),
  updated_at       TIMESTAMP    DEFAULT NOW()
);

-- ─── 12. settings ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id    SERIAL PRIMARY KEY,
  key   VARCHAR(100) NOT NULL UNIQUE,
  value TEXT
);

-- ─── Données de démo ─────────────────────────────────────────
INSERT INTO testimonials (text, name, company, initials, rating, sort_order)
VALUES
  ('Excellent travail ! Les stylos personnalisés ont été livrés en temps et en heure, qualité impeccable.', 'Sophie M.', 'Agence Créative Lyon', 'SM', 5, 1),
  ('Très professionnel, devis rapide et produits conformes à nos attentes. Je recommande vivement.', 'Thomas B.', 'BTP Rhône-Alpes', 'TB', 5, 2),
  ('Notre commande de tote bags a été parfaite. Le logo est bien rendu et la qualité est au rendez-vous.', 'Claire D.', 'Association Sportive', 'CD', 5, 3)
ON CONFLICT DO NOTHING;

-- ─── 13. Nouvelles colonnes orders ───────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bat_status VARCHAR(20);

-- ─── 14. Nouvelles colonnes cart_items ───────────────────────
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS marking_technique_id INTEGER;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS marking_position VARCHAR(150);

-- ─── 15. Nouvelles colonnes order_items ──────────────────────
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS marking_technique_id   INTEGER;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS marking_technique_name VARCHAR(100);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS marking_position       VARCHAR(150);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS marking_unit_price     NUMERIC(10,2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS marking_setup_fee      NUMERIC(10,2);

-- ─── 16. Nouvelles colonnes products ─────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS marking_positions     JSON DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS marking_technique_ids JSON DEFAULT '[]';

-- ─── 17. marking_techniques ──────────────────────────────────
CREATE TABLE IF NOT EXISTS marking_techniques (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  unit_price  NUMERIC(10,2) DEFAULT 0,
  setup_fee   NUMERIC(10,2) DEFAULT 0,
  active      BOOLEAN       DEFAULT TRUE,
  sort_order  INTEGER       DEFAULT 0,
  created_at  TIMESTAMP     DEFAULT NOW()
);

-- ─── 19. design_notes + design_file ─────────────────────────
ALTER TABLE cart_items  ADD COLUMN IF NOT EXISTS design_notes TEXT;
ALTER TABLE cart_items  ADD COLUMN IF NOT EXISTS design_file  TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS design_notes TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS design_file  TEXT;

-- ─── 18. order_exchanges ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_exchanges (
  id               SERIAL PRIMARY KEY,
  order_id         INTEGER      NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_type      VARCHAR(10)  NOT NULL,
  user_id          INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  message          TEXT         NOT NULL,
  is_bat           BOOLEAN      NOT NULL DEFAULT FALSE,
  bat_filename     VARCHAR(255),
  bat_url          VARCHAR(500),
  bat_status       VARCHAR(20),
  client_action_at TIMESTAMP,
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);
