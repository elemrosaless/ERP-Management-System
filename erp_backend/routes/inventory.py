from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("/movements")
def get_movements(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    result = db.execute(text("""
        SELECT *
        FROM core.stock_movements
        ORDER BY created_at DESC
    """)).fetchall()

    return {"movements": [dict(row._mapping) for row in result]}


@router.post("/movements")
def create_movement(
    product_id: int,
    movement_type: str,
    quantity: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    if quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cantidad debe ser mayor a 0"
        )

    movement_type = movement_type.upper()

    if movement_type not in ["IN", "OUT"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="movement_type debe ser IN o OUT"
        )

    try:
        with db.begin():

            # Verificar que el producto exista
            product = db.execute(
                text("""
                    SELECT id, stock
                    FROM core.products
                    WHERE id = :product_id
                    AND is_active = true
                """),
                {"product_id": product_id}
            ).fetchone()

            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Producto no encontrado"
                )

            # ENTRADA DE INVENTARIO
            if movement_type == "IN":

                db.execute(
                    text("""
                        UPDATE core.products
                        SET stock = stock + :quantity
                        WHERE id = :product_id
                    """),
                    {
                        "quantity": quantity,
                        "product_id": product_id
                    }
                )

            # SALIDA DE INVENTARIO
            else:

                result = db.execute(
                    text("""
                        UPDATE core.products
                        SET stock = stock - :quantity
                        WHERE id = :product_id
                        AND stock >= :quantity
                    """),
                    {
                        "quantity": quantity,
                        "product_id": product_id
                    }
                )

                if result.rowcount == 0:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Stock insuficiente"
                    )

            # Registrar movimiento
            db.execute(
                text("""
                    INSERT INTO core.stock_movements
                    (product_id, movement_type, quantity)
                    VALUES (:product_id, :movement_type, :quantity)
                """),
                {
                    "product_id": product_id,
                    "movement_type": movement_type,
                    "quantity": quantity
                }
            )

        return {
            "message": "Movimiento registrado ✔",
            "product_id": product_id,
            "movement_type": movement_type,
            "quantity": quantity
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )