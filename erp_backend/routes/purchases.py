from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
from auth import get_current_user
from routes.schemas import PurchaseCreate
from crud import create_purchase as create_purchase_record
from models.purchase import Purchase
from models.purchase_item import PurchaseItem
from models.product import Product
from models.supplier import Supplier

router = APIRouter(prefix="/purchases", tags=["purchases"])


@router.get("")
def get_purchases(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Obtiene el historial de compras con detalles de proveedores y productos"""
    try:
        purchases = db.query(
            Purchase.id,
            Purchase.supplier_id,
            Supplier.name.label('supplier_name'),
            PurchaseItem.product_id,
            Product.name.label('product_name'),
            PurchaseItem.quantity,
            PurchaseItem.cost.label('unit_cost'),
            PurchaseItem.subtotal,
            Purchase.total.label('purchase_total'),
            Purchase.created_at
        ).join(
            Supplier, Purchase.supplier_id == Supplier.id
        ).join(
            PurchaseItem, Purchase.id == PurchaseItem.purchase_id
        ).join(
            Product, PurchaseItem.product_id == Product.id
        ).filter(
            Purchase.is_active == True
        ).order_by(
            desc(Purchase.created_at)
        ).limit(limit).all()

        return {
            "purchases": [
                {
                    "purchase_id": p.id,
                    "supplier_id": p.supplier_id,
                    "supplier_name": p.supplier_name,
                    "product_id": p.product_id,
                    "product_name": p.product_name,
                    "quantity": p.quantity,
                    "unit_cost": p.unit_cost,
                    "subtotal": p.subtotal,
                    "purchase_total": p.purchase_total,
                    "created_at": p.created_at.isoformat() if p.created_at else None
                }
                for p in purchases
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", status_code=status.HTTP_201_CREATED)
def create_purchase_route(
    purchase: PurchaseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    try:
        items = [
            {
                "product_id": item.product_id,
                "quantity": item.quantity,
                "cost": item.cost,
                "subtotal": item.quantity * item.cost
            }
            for item in purchase.items
        ]

        creator_id = current_user.get('user_id') or current_user.get('sub')
        if creator_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Usuario inválido')

        purchase_id = create_purchase_record(
            db,
            purchase.supplier_id,
            int(creator_id),
            purchase.total,
            items
        )

        return {
            "message": "Compra registrada ✔ (stock actualizado)",
            "purchase_id": purchase_id
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))