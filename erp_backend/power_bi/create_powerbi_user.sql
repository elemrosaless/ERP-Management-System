-- Crea un rol/usuario limitado para Power BI (ajusta contraseña antes de ejecutar)
-- Reemplaza 'ChangeMeStrongPass!' por una contraseña segura

CREATE ROLE powerbi_read WITH LOGIN PASSWORD 'Lrsls22160121';

GRANT CONNECT ON DATABASE erp_db TO powerbi_read;
GRANT USAGE ON SCHEMA core TO powerbi_read;

-- Dar SELECT solo sobre las vistas creadas para reporting
GRANT SELECT ON core.v_sales_summary TO powerbi_read;
GRANT SELECT ON core.v_sales_detail TO powerbi_read;
GRANT SELECT ON core.v_top_products TO powerbi_read;
GRANT SELECT ON core.v_stock_status TO powerbi_read;
GRANT SELECT ON core.v_purchases_by_supplier TO powerbi_read;

-- Opcional: permitir SELECT en futuras tablas/vistas creadas por el owner
ALTER DEFAULT PRIVILEGES IN SCHEMA core GRANT SELECT ON TABLES TO powerbi_read;

-- Nota: ejecuta este script como superusuario (postgres) o un rol con permisos
-- psql -h localhost -p 5433 -U postgres -d erp_db -f erp_backend/power_bi/create_powerbi_user.sql
