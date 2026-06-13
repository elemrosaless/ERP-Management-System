from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db
from auth import get_current_user, get_current_user_admin
from routes.schemas import SupplierCreate, SupplierResponse

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_user_admin)
):
    db.execute(
        text("""
            INSERT INTO core.suppliers (name, email, phone, address)
            VALUES (:name, :email, :phone, :address)
        """),
        supplier.dict()
    )
    db.commit()
    return {"message": "Proveedor creado ✔"}


@router.get("")
def get_suppliers(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    result = db.execute(text("SELECT * FROM core.suppliers WHERE is_active = true ORDER BY created_at DESC"))
    return {"suppliers": [dict(r._mapping) for r in result.fetchall()]}


@router.put("/{supplier_id}")
def update_supplier(
    supplier_id: int,
    supplier: SupplierCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_user_admin)
):
    db.execute(
        text("""
            UPDATE core.suppliers
            SET name = :name,
                email = :email,
                phone = :phone,
                address = :address
            WHERE id = :id AND is_active = true
        """),
        {**supplier.dict(), "id": supplier_id}
    )
    db.commit()
    return {"message": "Proveedor actualizado ✔"}


@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_user_admin)
):
    db.execute(
        text("UPDATE core.suppliers SET is_active = false, deleted_at = NOW() WHERE id = :id AND is_active = true"),
        {"id": supplier_id}
    )
    db.commit()
    return {"message": "Proveedor eliminado (soft delete) ✔"}
