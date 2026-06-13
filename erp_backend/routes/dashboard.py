from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db
from auth import get_current_user_admin

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/")
def summary(db: Session = Depends(get_db), admin=Depends(get_current_user_admin)):
    """Resumen de KPIs para el dashboard (admin only)."""
    result = db.execute(text("""
        SELECT 
            (SELECT COUNT(*) FROM core.users WHERE is_active = true) AS total_users,
            (SELECT COUNT(*) FROM core.products WHERE is_active = true) AS total_products,
            (SELECT COUNT(*) FROM core.sales WHERE is_active = true AND DATE(created_at) = CURRENT_DATE) AS sales_today,
            COALESCE((SELECT SUM(total) FROM core.sales WHERE is_active = true AND DATE(created_at) = CURRENT_DATE), 0) AS revenue_today
    """)).fetchone()

    return dict(result._mapping)


@router.get("/low-stock")
def low_stock(threshold: int = 10, limit: int = 20, db: Session = Depends(get_db), admin=Depends(get_current_user_admin)):
    """Productos con stock bajo (admin only)."""
    rows = db.execute(text("""
        SELECT id, name, stock
        FROM core.products
        WHERE is_active = true AND stock <= :threshold
        ORDER BY stock ASC, id
        LIMIT :limit
    """), {"threshold": threshold, "limit": limit}).fetchall()

    return {"low_stock": [dict(r._mapping) for r in rows]}


@router.get("/recent-sales")
def recent_sales(limit: int = 10, db: Session = Depends(get_db), admin=Depends(get_current_user_admin)):
    """Ventas recientes (admin only)."""
    rows = db.execute(text("""
        SELECT
            s.id AS sale_id,
            s.customer_id,
            si.product_id,
            p.name AS product_name,
            si.quantity,
            si.price AS unit_price,
            si.subtotal AS line_total,
            s.total AS sale_total,
            s.created_at
        FROM core.sale_items si
        JOIN core.sales s ON s.id = si.sale_id
        JOIN core.products p ON p.id = si.product_id
        WHERE s.is_active = true
        ORDER BY s.created_at DESC, s.id, si.id
        LIMIT :limit
    """), {"limit": limit}).fetchall()

    return {"recent_sales": [dict(r._mapping) for r in rows]}


@router.get("/monthly-revenue")
def monthly_revenue(months: int = 6, db: Session = Depends(get_db), admin=Depends(get_current_user_admin)):
    """Ingresos mensuales para los últimos `months` meses (admin only)."""
    rows = db.execute(text("""
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
               SUM(total) AS revenue
        FROM core.sales
        WHERE is_active = true AND created_at >= (date_trunc('month', CURRENT_DATE) - (:months - 1) * INTERVAL '1 month')
        GROUP BY 1
        ORDER BY 1 DESC
    """), {"months": months}).fetchall()

    return {"monthly_revenue": [dict(r._mapping) for r in rows]}
