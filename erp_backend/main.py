from fastapi import FastAPI, Depends, Header, HTTPException, status, Security
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db
from auth import (
    verify_password,
    create_access_token,
    get_current_user
)
from routes.schemas import LoginRequest, TokenResponse
from routes.users import router as users_router
from routes.products import router as products_router
from routes.sales import router as sales_router
from routes.reports import router as reports_router
from routes.customers import router as customers_router
from routes.dashboard import router as dashboard_router
from routes.inventory import router as inventory_router
from routes.purchases import router as purchases_router
from routes.suppliers import router as suppliers_router
from routes.alerts import router as alerts_router



app = FastAPI(
    title="ERP Management System",
    description="API para gestión de ventas, productos y usuarios",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(users_router)
app.include_router(products_router)
app.include_router(sales_router)
app.include_router(reports_router)
app.include_router(customers_router)
app.include_router(dashboard_router)
app.include_router(inventory_router)
app.include_router(purchases_router)
app.include_router(suppliers_router)
app.include_router(alerts_router)


@app.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Endpoint para login de usuarios.
    Retorna un token de acceso JWT.
    Solo permite acceso a usuarios activos (is_active = true).
    """
    user_row = db.execute(
        text("SELECT * FROM core.users WHERE LOWER(email) = LOWER(:email) AND is_active = true"),
        {"email": login_data.email}
    ).fetchone()

    if not user_row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

    user = dict(user_row._mapping)

    if not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

    token = create_access_token({
        "user_id": user["id"],
        "role": user.get("role")
    })

    return {"access_token": token, "token_type": "bearer"}


@app.get("/")
def root():
    """Endpoint raíz que retorna información de la API."""
    return {
        "message": "ERP Management System API",
        "version": "1.0.0",
        "docs": "/docs"
    }


