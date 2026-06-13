from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db
from auth import get_current_user, get_current_user_admin
from routes.schemas import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter(prefix="/products", tags=["products"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_user_admin)
):
    db.execute(
        text("""
            INSERT INTO core.products (name, description, price, stock)
            VALUES (:name, :description, :price, :stock)
        """),
        product.dict()
    )
    db.commit()
    return {"message": "Producto creado ✔"}


@router.get("")
def get_products(db: Session = Depends(get_db), cursor: str = None, limit: int = 10):
    """Obtiene lista de productos con keyset pagination basada en timestamp.
    
    Args:
        cursor: timestamp ISO del último registro de la página anterior (null para primera página)
        limit: cantidad de registros por página (default=10)
    """
    query = "SELECT id, name, description, price, stock, created_at FROM core.products WHERE is_active = true"
    params = {"limit": limit + 1}  # +1 para detectar si hay más páginas
    
    if cursor:
        query += " AND created_at > :cursor ORDER BY created_at, id LIMIT :limit"
        params["cursor"] = cursor
    else:
        query += " ORDER BY created_at, id LIMIT :limit"
    
    result = db.execute(text(query), params).fetchall()
    
    # Detectar si hay más páginas
    has_more = len(result) > limit
    if has_more:
        result = result[:limit]
    
    # El cursor es el timestamp del último registro
    next_cursor = None
    if result and has_more:
        last_row = dict(result[-1]._mapping)
        next_cursor = last_row["created_at"].isoformat() if last_row["created_at"] else None
    
    return {
        "products": [dict(row._mapping) for row in result],
        "cursor": next_cursor,
        "limit": limit,
        "has_more": has_more
    }


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    result = db.execute(
        text("SELECT id, name, description, price, stock FROM core.products WHERE id = :id AND is_active = true"),
        {"id": product_id}
    ).fetchone()

    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    return dict(result._mapping)


@router.put("/{product_id}")
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db), admin=Depends(get_current_user_admin)):
    updates = {}
    if product.name is not None:
        updates["name"] = product.name
    if product.description is not None:
        updates["description"] = product.description
    if product.price is not None:
        updates["price"] = product.price
    if product.stock is not None:
        updates["stock"] = product.stock

    if not updates:
        return {"message": "Nada para actualizar"}

    set_clause = ", ".join([f"{k} = :{k}" for k in updates.keys()])
    params = {**updates, "id": product_id}

    db.execute(text(f"UPDATE core.products SET {set_clause} WHERE id = :id AND is_active = true"), params)
    db.commit()
    return {"message": "Producto actualizado ✔"}


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), admin=Depends(get_current_user_admin)):
    # Soft delete: marcar como inactivo y registrar fecha de eliminación
    db.execute(
        text("UPDATE core.products SET is_active = false, deleted_at = NOW() WHERE id = :id AND is_active = true"),
        {"id": product_id}
    )
    db.commit()
    return {"message": "Producto eliminado (soft delete) ✔"}
