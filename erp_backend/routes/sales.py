from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db
from auth import get_current_user
from routes.schemas import SaleCreate, SaleResponse
from crud import create_sale as create_sale_record

router = APIRouter(prefix="/sales", tags=["sales"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_sale_route(
    sale: SaleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    try:
        sale_id = create_sale_record(db, sale.customer_id, [item.dict() for item in sale.items], sale.total)
        return {
            "message": "Venta creada ✔ (stock actualizado)",
            "sale_id": sale_id,
            "user": current_user
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
