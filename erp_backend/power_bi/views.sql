-- Vistas útiles para Power BI / reporting
-- Ejecutar estas vistas en la base de datos (schema `core`).

CREATE OR REPLACE VIEW core.v_sales_summary AS
SELECT
  date_trunc('day', s.created_at) AS day,
  COUNT(*) AS sales_count,
  SUM(s.total) AS total_revenue
FROM core.sales s
WHERE s.is_active = true
GROUP BY 1
ORDER BY 1;

CREATE OR REPLACE VIEW core.v_top_products AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  SUM(si.quantity) AS total_sold,
  SUM(si.subtotal) AS revenue
FROM core.sale_items si
JOIN core.products p ON p.id = si.product_id
JOIN core.sales s ON s.id = si.sale_id
WHERE p.is_active = true AND s.is_active = true
GROUP BY p.id, p.name
ORDER BY revenue DESC;

CREATE OR REPLACE VIEW core.v_stock_status AS
SELECT
  id AS product_id,
  name AS product_name,
  stock,
  CASE
    WHEN stock <= 0 THEN 'OUT_OF_STOCK'
    WHEN stock <= 5 THEN 'CRITICAL'
    WHEN stock <= 10 THEN 'LOW'
    ELSE 'OK'
  END AS status
FROM core.products
WHERE is_active = true;

CREATE OR REPLACE VIEW core.v_purchases_by_supplier AS
SELECT
  p.id AS purchase_id,
  date_trunc('day', p.created_at) AS day,
  p.supplier_id,
  s.name AS supplier_name,
  SUM(pi.subtotal) AS total_amount
FROM core.purchases p
JOIN core.purchase_items pi ON pi.purchase_id = p.id
LEFT JOIN core.suppliers s ON s.id = p.supplier_id
WHERE p.is_active = true
GROUP BY p.id, day, p.supplier_id, s.name
ORDER BY day DESC;
