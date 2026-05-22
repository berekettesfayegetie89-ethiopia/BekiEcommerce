-- ============================================================
--  BEKI Shop v4 — Ethiopian Payment Migration
--  Run ONCE on existing v3 databases.
--  (sequelize.sync({ alter: true }) in index.js also handles this automatically)
-- ============================================================

-- 1. Add Chapa payment methods to the ENUM
ALTER TYPE "enum_orders_paymentMethod" ADD VALUE IF NOT EXISTS 'chapa';
ALTER TYPE "enum_orders_paymentMethod" ADD VALUE IF NOT EXISTS 'telebirr';
ALTER TYPE "enum_orders_paymentMethod" ADD VALUE IF NOT EXISTS 'cbebirr';
ALTER TYPE "enum_orders_paymentMethod" ADD VALUE IF NOT EXISTS 'mpesa';
ALTER TYPE "enum_orders_paymentMethod" ADD VALUE IF NOT EXISTS 'amole';

-- 2. Add Chapa-specific columns
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS "chapaTxRef"       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "chapaCheckoutUrl" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "totalPriceETB"    DECIMAL(12,2);

-- 3. Index for webhook tx_ref lookups
CREATE INDEX IF NOT EXISTS idx_orders_chapa_tx_ref ON orders("chapaTxRef");

-- Done. Run: psql $DATABASE_URL -f migration_add_chapa.sql
