-- ============================================================
-- FENIX PUB — Migration SQL (à coller dans Neon SQL Editor)
-- ============================================================

-- 1. Colonnes manquantes sur categories
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS icon         VARCHAR(10) DEFAULT '🗂️',
  ADD COLUMN IF NOT EXISTS description  TEXT,
  ADD COLUMN IF NOT EXISTS from_price   VARCHAR(50),
  ADD COLUMN IF NOT EXISTS active       BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Colonnes manquantes sur orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_number     VARCHAR(30) UNIQUE,
  ADD COLUMN IF NOT EXISTS admin_notes      TEXT,
  ADD COLUMN IF NOT EXISTS shipping_name    VARCHAR(150),
  ADD COLUMN IF NOT EXISTS shipping_email   VARCHAR(255),
  ADD COLUMN IF NOT EXISTS shipping_phone   VARCHAR(30),
  ADD COLUMN IF NOT EXISTS shipping_company VARCHAR(150),
  ADD COLUMN IF NOT EXISTS shipping_address TEXT;

-- 3. Colonnes manquantes sur contact_messages
ALTER TABLE contact_messages
  ADD COLUMN IF NOT EXISTS user_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS read_at  TIMESTAMP;

-- 4. Nouvelle table testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id         SERIAL PRIMARY KEY,
  text       TEXT NOT NULL,
  name       VARCHAR(100) NOT NULL,
  company    VARCHAR(150),
  initials   VARCHAR(5),
  rating     INTEGER DEFAULT 5,
  sort_order INTEGER DEFAULT 0,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Nouvelle table documents
CREATE TABLE IF NOT EXISTS documents (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  filename    VARCHAR(255),
  url         TEXT,
  description TEXT,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- 6. Colonne sort_order sur cms_pages (si manquante)
ALTER TABLE cms_pages
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 7. Données de démo testimonials
INSERT INTO testimonials (text, name, company, initials, rating, sort_order)
VALUES
  ('Excellent travail ! Les stylos personnalisés ont été livrés en temps et en heure, qualité impeccable.', 'Sophie M.', 'Agence Créative Lyon', 'SM', 5, 1),
  ('Très professionnel, devis rapide et produits conformes à nos attentes. Je recommande vivement.', 'Thomas B.', 'BTP Rhône-Alpes', 'TB', 5, 2),
  ('Notre commande de tote bags a été parfaite. Le logo est bien rendu et la qualité est au rendez-vous.', 'Claire D.', 'Association Sportive', 'CD', 5, 3)
ON CONFLICT DO NOTHING;
