from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db
from auth import get_current_user_admin, get_current_user
from routes.schemas import CustomerCreate

router = APIRouter(prefix="/customers", tags=["customers"])


# CREATE
@router.post("", status_code=status.HTTP_201_CREATED)
def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    db.execute(
        text("""
            INSERT INTO core.customers (name, email, phone, address)
            VALUES (:name, :email, :phone, :address)
        """),
        customer.dict()
    )
    db.commit()

    return {"message": "Cliente creado ✔"}


# READ ALL
@router.get("")
def get_customers(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    result = db.execute(text("SELECT * FROM core.customers WHERE is_active = true ORDER BY created_at DESC"))
    return {"customers": [dict(r._mapping) for r in result.fetchall()]}


# READ ONE
@router.get("/{customer_id}")
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    result = db.execute(
        text("SELECT * FROM core.customers WHERE id = :id AND is_active = true"),
        {"id": customer_id}
    ).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    return dict(result._mapping)


# UPDATE
@router.put("/{customer_id}")
def update_customer(
    customer_id: int,
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_user_admin)
):
    db.execute(
        text("""
            UPDATE core.customers
            SET name = :name,
                email = :email,
                phone = :phone,
                address = :address
            WHERE id = :id AND is_active = true
        """),
        {**customer.dict(), "id": customer_id}
    )
    db.commit()

    return {"message": "Cliente actualizado ✔"}


# DELETE
@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_user_admin)
):
    # Soft delete
    db.execute(
        text("UPDATE core.customers SET is_active = false, deleted_at = NOW() WHERE id = :id AND is_active = true"),
        {"id": customer_id}
    )
    db.commit()

    return {"message": "Cliente eliminado (soft delete) ✔"}