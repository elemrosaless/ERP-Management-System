from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db
from auth import hash_password, get_current_user, get_current_user_admin
from routes.schemas import UserCreate, UserUpdate, UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/")
def get_users(db: Session = Depends(get_db), admin=Depends(get_current_user_admin), cursor: str = None, limit: int = 10):
    """Obtiene lista de usuarios con keyset pagination basada en timestamp.
    
    Args:
        cursor: timestamp ISO del último registro de la página anterior (null para primera página)
        limit: cantidad de registros por página (default=10)
    """
    query = "SELECT id, name, email, role, is_active, created_at FROM core.users WHERE is_active = true"
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
        "users": [dict(row._mapping) for row in result],
        "cursor": next_cursor,
        "limit": limit,
        "has_more": has_more
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_user_admin)
):
    # validar email existente
    existing_user = db.execute(
        text("SELECT id FROM core.users WHERE LOWER(email) = LOWER(:email) AND is_active = true"),
        {"email": user.email}
    ).fetchone()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="El email ya está registrado"
        )

    db.execute(
        text("""
            INSERT INTO core.users (name, email, password_hash)
            VALUES (:name, :email, :password_hash)
        """),
        {
            "name": user.name,
            "email": user.email,
            "password_hash": hash_password(user.password)
        }
    )

    db.commit()

    return {
        "message": "Usuario creado ✔"
    }


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    result = db.execute(
        text("SELECT id, name, email, role, is_active FROM core.users WHERE id = :id AND is_active = true"),
        {"id": user_id}
    ).fetchone()

    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    return dict(result._mapping)


@router.put("/{user_id}")
def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db), admin=Depends(get_current_user_admin)):
    # Construir campos a actualizar dinámicamente
    updates = {}
    if user.name is not None:
        updates["name"] = user.name
    if user.email is not None:
        updates["email"] = user.email
    if user.password is not None:
        updates["password_hash"] = hash_password(user.password)

    if not updates:
        return {"message": "Nada para actualizar"}

    # Si se actualiza email, validar unicidad
    if "email" in updates:
        existing_user = db.execute(
            text("SELECT id FROM core.users WHERE LOWER(email) = LOWER(:email) AND id != :user_id AND is_active = true"),
            {"email": updates["email"], "user_id": user_id}
        ).fetchone()

        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El email ya está registrado")

    # Construir sentencia SQL
    set_clause = ", ".join([f"{k} = :{k}" for k in updates.keys()])
    params = {**updates, "id": user_id}

    db.execute(text(f"UPDATE core.users SET {set_clause} WHERE id = :id AND is_active = true"), params)
    db.commit()
    return {"message": "Usuario actualizado ✔"}


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin=Depends(get_current_user_admin)):
    # Soft delete: marcar como inactivo y registrar fecha de eliminación
    db.execute(
        text("UPDATE core.users SET is_active = false, deleted_at = NOW() WHERE id = :id AND is_active = true"),
        {"id": user_id}
    )
    db.commit()
    return {"message": "Usuario eliminado (soft delete) ✔"}
