from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/summary")
def sales_summary(db: Session = Depends(get_db)):
    result = db.execute(text("""
        SELECT 
            COUNT(*) AS total_ventas,
            COALESCE(SUM(total), 0) AS ingresos_totales
        FROM core.sales
        WHERE is_active = true;
    """)).fetchone()

    return dict(result._mapping)


@router.get("/sales-by-day")
def sales_by_day(db: Session = Depends(get_db), cursor: str = None, limit: int = 10):
    """Obtiene ventas por día con keyset pagination basada en timestamp.
    
    Args:
        cursor: fecha (YYYY-MM-DD) del último día de la página anterior
        limit: cantidad de días por página (default=10)
    """
    query = """
        SELECT 
            DATE(created_at) AS fecha,
            COUNT(*) AS ventas,
            SUM(total) AS total_dia
        FROM core.sales
        WHERE is_active = true
    """
    params = {"limit": limit + 1}
    
    if cursor:
        query += " AND DATE(created_at) < :cursor"
        params["cursor"] = cursor
    
    query += " GROUP BY DATE(created_at) ORDER BY fecha DESC LIMIT :limit"
    result = db.execute(text(query), params).fetchall()
    
    # Detectar si hay más páginas
    has_more = len(result) > limit
    if has_more:
        result = result[:limit]
    
    # El cursor es la fecha del último registro
    next_cursor = None
    if result and has_more:
        last_row = dict(result[-1]._mapping)
        next_cursor = str(last_row["fecha"])
    
    return {
        "data": [dict(row._mapping) for row in result],
        "cursor": next_cursor,
        "limit": limit,
        "has_more": has_more
    }


@router.get("/top-products")
def top_products(db: Session = Depends(get_db), cursor: str = None, limit: int = 10):
    """Obtiene productos más vendidos con keyset pagination.
    
    Args:
        cursor: nombre del último producto de la página anterior
        limit: cantidad de productos por página (default=10)
    """
    query = """
        SELECT 
            p.name,
            SUM(si.quantity) AS cantidad_vendida
        FROM core.sale_items si
        JOIN core.products p ON p.id = si.product_id
        WHERE si.is_active = true AND p.is_active = true
        GROUP BY p.name
    """
    params = {"limit": limit + 1}
    
    if cursor:
        query += " HAVING p.name < :cursor"
        params["cursor"] = cursor
    
    query += " ORDER BY cantidad_vendida DESC LIMIT :limit"
    result = db.execute(text(query), params).fetchall()
    
    # Detectar si hay más páginas
    has_more = len(result) > limit
    if has_more:
        result = result[:limit]
    
    # El cursor es el nombre del último producto
    next_cursor = None
    if result and has_more:
        last_row = dict(result[-1]._mapping)
        next_cursor = last_row["name"]
    
    return {
        "data": [dict(row._mapping) for row in result],
        "cursor": next_cursor,
        "limit": limit,
        "has_more": has_more
    }


@router.get("/top-customers")
def top_customers(db: Session = Depends(get_db), cursor: str = None, limit: int = 10):
    """Obtiene clientes principales con keyset pagination.
    
    Args:
        cursor: nombre del último cliente de la página anterior
        limit: cantidad de clientes por página (default=10)
    """
    query = """
        SELECT 
            c.name,
            SUM(s.total) AS total_comprado
        FROM core.sales s
        JOIN core.customers c ON c.id = s.customer_id
        WHERE s.is_active = true
        GROUP BY c.name
    """
    params = {"limit": limit + 1}
    
    if cursor:
        query += " HAVING c.name < :cursor"
        params["cursor"] = cursor
    
    query += " ORDER BY total_comprado DESC LIMIT :limit"
    result = db.execute(text(query), params).fetchall()
    
    # Detectar si hay más páginas
    has_more = len(result) > limit
    if has_more:
        result = result[:limit]
    
    # El cursor es el nombre del último cliente
    next_cursor = None
    if result and has_more:
        last_row = dict(result[-1]._mapping)
        next_cursor = last_row["name"]
    
    return {
        "data": [dict(row._mapping) for row in result],
        "cursor": next_cursor,
        "limit": limit,
        "has_more": has_more
    }

@router.get("/users-by-day")
def users_by_day(db: Session = Depends(get_db), cursor: int = None, limit: int = 10):
    """Obtiene usuarios por día con paginación por cursor."""
    query = """
        SELECT 
            ROW_NUMBER() OVER (ORDER BY DATE(created_at) DESC) as row_num,
            DATE(created_at) AS fecha,
            COUNT(*) AS usuarios,
            SUM(total) AS total_dia
        FROM core.users
        GROUP BY DATE(created_at)
    """
    params = {"limit": limit}
    
    if cursor:
        query += " HAVING ROW_NUMBER() > :cursor"
        params["cursor"] = cursor
    
    query += " ORDER BY fecha DESC LIMIT :limit"
    result = db.execute(text(query), params).fetchall()
    
    next_cursor = None
    if len(result) == limit and result:
        next_cursor = result[-1]._mapping["row_num"]
    
    return {
        "data": [dict(row._mapping) for row in result],
        "cursor": next_cursor,
        "limit": limit
    }
