-- Migración: Agregar soporte de Soft Delete (eliminación lógica)
-- En un ERP real, nunca se eliminan registros físicamente para mantener integridad histórica
-- Se usan DOS campos:
--   - is_active: BOOLEAN para filtros rápidos en queries (índice eficiente)
--   - deleted_at: TIMESTAMP para auditoría (cuándo fue eliminado)

-- 1. Agregar columnas a core.users
ALTER TABLE core.users ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE core.users ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
CREATE INDEX idx_users_is_active ON core.users(is_active);
CREATE INDEX idx_users_deleted_at ON core.users(deleted_at);

-- 2. Agregar columnas a core.products
ALTER TABLE core.products ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE core.products ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
CREATE INDEX idx_products_is_active ON core.products(is_active);
CREATE INDEX idx_products_deleted_at ON core.products(deleted_at);

-- 3. Agregar columnas a core.sales
ALTER TABLE core.sales ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE core.sales ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
CREATE INDEX idx_sales_is_active ON core.sales(is_active);
CREATE INDEX idx_sales_deleted_at ON core.sales(deleted_at);

-- 4. Agregar columnas a core.sale_items
ALTER TABLE core.sale_items ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE core.sale_items ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
CREATE INDEX idx_sale_items_is_active ON core.sale_items(is_active);
CREATE INDEX idx_sale_items_deleted_at ON core.sale_items(deleted_at);

-- Índices compuestos para queries de auditoría (solo registros activos)
CREATE INDEX idx_users_is_active_deleted_at ON core.users(is_active, deleted_at);
CREATE INDEX idx_products_is_active_deleted_at ON core.products(is_active, deleted_at);
CREATE INDEX idx_sales_is_active_deleted_at ON core.sales(is_active, deleted_at);
CREATE INDEX idx_sale_items_is_active_deleted_at ON core.sale_items(is_active, deleted_at);

-- Índices parciales para operaciones comunes (solo registros activos)
CREATE INDEX idx_users_email_active ON core.users(LOWER(email)) WHERE is_active = true;
CREATE INDEX idx_products_active ON core.products(created_at) WHERE is_active = true;
CREATE INDEX idx_sales_active ON core.sales(created_at) WHERE is_active = true;
