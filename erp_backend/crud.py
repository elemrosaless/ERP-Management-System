from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session

from auth import hash_password
from models import Product, Purchase, PurchaseItem, Sale, SaleItem, StockMovement, Supplier


def row_to_dict(row) -> Optional[Dict[str, Any]]:
    if not row:
        return None
    return dict(row._mapping)


# --- Users ---
def get_user_by_email(db: Session, email: str) -> Optional[Dict[str, Any]]:
    row = db.execute(
        text("SELECT * FROM core.users WHERE LOWER(email) = LOWER(:email) AND is_active = true"),
        {"email": email}
    ).fetchone()
    return row_to_dict(row)


def create_user(db: Session, name: str, email: str, password: str) -> None:
    db.execute(
        text("""
            INSERT INTO core.users (name, email, password_hash)
            VALUES (:name, :email, :password_hash)
        """),
        {"name": name, "email": email, "password_hash": hash_password(password)}
    )
    db.commit()


def update_user(db: Session, user_id: int, data: Dict[str, Any]) -> None:
    fields = []
    params: Dict[str, Any] = {"id": user_id}
    for k, v in data.items():
        if k == "password":
            fields.append("password_hash = :password_hash")
            params["password_hash"] = hash_password(v)
        else:
            fields.append(f"{k} = :{k}")
            params[k] = v

    if not fields:
        return

    sql = f"UPDATE core.users SET {', '.join(fields)} WHERE id = :id AND is_active = true"
    db.execute(text(sql), params)
    db.commit()


def soft_delete_user(db: Session, user_id: int) -> None:
    db.execute(
        text("UPDATE core.users SET is_active = false, deleted_at = NOW() WHERE id = :id AND is_active = true"),
        {"id": user_id}
    )
    db.commit()


# --- Products / Inventory ---
def get_product(db: Session, product_id: int) -> Optional[Dict[str, Any]]:
    row = db.execute(
        text("SELECT * FROM core.products WHERE id = :id AND is_active = true"), {"id": product_id}
    ).fetchone()
    return row_to_dict(row)


def list_products(db: Session, cursor: Optional[str] = None, limit: int = 10) -> Dict[str, Any]:
    query = "SELECT id, name, description, price, stock, created_at FROM core.products WHERE is_active = true"
    params = {"limit": limit + 1}
    if cursor:
        query += " AND created_at > :cursor ORDER BY created_at, id LIMIT :limit"
        params["cursor"] = cursor
    else:
        query += " ORDER BY created_at, id LIMIT :limit"

    result = db.execute(text(query), params).fetchall()
    has_more = len(result) > limit
    if has_more:
        result = result[:limit]

    next_cursor = None
    if result and has_more:
        last_row = dict(result[-1]._mapping)
        next_cursor = last_row["created_at"].isoformat() if last_row.get("created_at") else None

    return {
        "products": [dict(r._mapping) for r in result],
        "cursor": next_cursor,
        "limit": limit,
        "has_more": has_more,
    }


def create_product(db: Session, name: str, description: Optional[str], price: float, stock: int) -> None:
    db.execute(
        text("""
            INSERT INTO core.products (name, description, price, stock)
            VALUES (:name, :description, :price, :stock)
        """),
        {"name": name, "description": description, "price": price, "stock": stock}
    )
    db.commit()


def update_product(db: Session, product_id: int, data: Dict[str, Any]) -> None:
    fields = []
    params: Dict[str, Any] = {"id": product_id}
    for k, v in data.items():
        fields.append(f"{k} = :{k}")
        params[k] = v

    if not fields:
        return

    sql = f"UPDATE core.products SET {', '.join(fields)} WHERE id = :id AND is_active = true"
    db.execute(text(sql), params)
    db.commit()


def adjust_stock(db: Session, product_id: int, delta: int, reference_type: Optional[str] = None, reference_id: Optional[int] = None) -> int:
    res = db.execute(
        text("UPDATE core.products SET stock = stock + :delta WHERE id = :id AND is_active = true"),
        {"id": product_id, "delta": delta}
    )
    db.execute(
        text("""
            INSERT INTO core.stock_movements (product_id, movement_type, quantity, reference_type, reference_id)
            VALUES (:product_id, :movement_type, :quantity, :reference_type, :reference_id)
        """),
        {
            "product_id": product_id,
            "movement_type": "IN" if delta > 0 else "OUT",
            "quantity": abs(delta),
            "reference_type": reference_type,
            "reference_id": reference_id,
        },
    )
    db.commit()
    return res.rowcount


# --- Sales / Purchases (transactional helpers) ---
def create_sale(db: Session, customer_id: int, items: List[Dict[str, Any]], total: float) -> int:
    try:
        with db.begin():
            sale = Sale(customer_id=customer_id, total=total)
            db.add(sale)
            db.flush()

            for item in items:
                product = db.get(Product, item["product_id"])
                if not product or not product.is_active:
                    raise ValueError(f"Producto {item['product_id']} no existe o no está activo")

                quantity = int(item["quantity"])
                if quantity <= 0 or product.stock < quantity:
                    raise ValueError(f"Stock insuficiente para producto {item['product_id']}")

                product.stock -= quantity

                sale_item = SaleItem(
                    sale=sale,
                    product=product,
                    quantity=quantity,
                    price=float(item["price"]),
                    subtotal=float(item["subtotal"]),
                )
                db.add(sale_item)

                stock_movement = StockMovement(
                    product=product,
                    movement_type='OUT',
                    quantity=quantity,
                    reference_type='SALE',
                    reference_id=sale.id,
                )
                db.add(stock_movement)

            db.flush()
            return sale.id
    except Exception:
        raise


def create_purchase(db: Session, supplier_id: int, created_by: int, total: float, items: List[Dict[str, Any]]) -> int:
    try:
        with db.begin():
            supplier = db.get(Supplier, supplier_id)
            if not supplier or not supplier.is_active:
                raise ValueError(f"Proveedor {supplier_id} no existe o no está activo")

            purchase = Purchase(supplier_id=supplier_id, created_by=created_by, total=total)
            db.add(purchase)
            db.flush()

            for item in items:
                product = db.get(Product, item["product_id"])
                if not product or not product.is_active:
                    raise ValueError(f"Producto {item['product_id']} no existe o no está activo")

                quantity = int(item["quantity"])
                if quantity <= 0:
                    raise ValueError(f"Cantidad inválida para producto {item['product_id']}")

                cost = float(item["cost"])
                subtotal = quantity * cost

                purchase_item = PurchaseItem(
                    purchase=purchase,
                    product=product,
                    quantity=quantity,
                    cost=cost,
                    subtotal=subtotal,
                )
                db.add(purchase_item)

                product.stock += quantity

                stock_movement = StockMovement(
                    product=product,
                    movement_type='IN',
                    quantity=quantity,
                    reference_type='PURCHASE',
                    reference_id=purchase.id,
                )
                db.add(stock_movement)

            db.flush()
            return purchase.id

    except Exception as e:
        raise Exception(str(e))