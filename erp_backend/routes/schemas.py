from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Optional
from auth import validate_password


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8)

    @field_validator("password")
    @classmethod
    def validate_pwd(cls, v):
        """Valida que la contraseña cumpla requisitos de seguridad."""
        is_valid, error_msg = validate_password(v)
        if not is_valid:
            raise ValueError(error_msg)
        return v


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float = Field(..., ge=0)
    stock: int = Field(..., ge=0)

class ProductUpdate(BaseModel):
    name: Optional[str]
    description: Optional[str]
    price: Optional[float]
    stock: Optional[int]



class ProductResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float
    stock: int



class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    price: float = Field(..., ge=0)
    subtotal: float = Field(..., ge=0)


class SaleCreate(BaseModel):
    customer_id: int
    total: float = Field(..., ge=0)
    items: List[SaleItemCreate]


class SaleResponse(BaseModel):
    id: int
    customer_id: int
    total: float

class CustomerCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PurchaseItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    cost: float = Field(..., ge=0)
    subtotal: Optional[float] = Field(None, ge=0)

    @field_validator('cost', mode='before')
    @classmethod
    def normalize_cost(cls, value, info):
        if value is None:
            data = info.data or {}
            if isinstance(data, dict) and 'price' in data:
                return data['price']
        return value


class PurchaseCreate(BaseModel):
    supplier_id: int
    total: float = Field(..., ge=0)
    items: List[PurchaseItemCreate]


class PurchaseResponse(BaseModel):
    id: int
    supplier_id: int
    created_by: int
    total: float
    created_at: Optional[str] = None


class SupplierCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class SupplierResponse(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: bool
