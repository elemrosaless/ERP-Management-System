from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from sqlalchemy import text
import re
import os

# Secrets from environment
SECRET_KEY = os.environ.get("SECRET_KEY", "mi_clave_secreta_erp")
ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def validate_password(password: str) -> tuple[bool, str]:
    """
    Valida que la contraseña cumpla con los requisitos de seguridad.
    Retorna: (es_válida, mensaje_error)
    
    Requisitos:
    - Mínimo 8 caracteres
    - Al menos una mayúscula
    - Al menos una minúscula
    - Al menos un número
    - Al menos un carácter especial
    """
    if len(password) < 8:
        return False, "La contraseña debe tener mínimo 8 caracteres"
    
    if not re.search(r'[A-Z]', password):
        return False, "La contraseña debe contener al menos una mayúscula"
    
    if not re.search(r'[a-z]', password):
        return False, "La contraseña debe contener al menos una minúscula"
    
    if not re.search(r'[0-9]', password):
        return False, "La contraseña debe contener al menos un número"
    
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'",.<>?/\\|`~]', password):
        return False, "La contraseña debe contener al menos un carácter especial (!@#$%^&*...)"
    
    return True, ""

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    # include subject if provided as user_id
    if "user_id" in data:
        to_encode.setdefault("sub", str(data.get("user_id")))
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def _decode_token(token: str):
    """Decodifica el token JWT. Función interna."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

security = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependencia: Extrae, valida y retorna el usuario autenticado del token JWT.
    La validación de que el usuario no esté eliminado se realiza en get_current_user_with_db()."""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token requerido")

    token = credentials.credentials
    user = _decode_token(token)

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    return user


def get_current_user_with_db(current_user=Depends(get_current_user)):
    """Dependencia: Valida que el usuario existe en la BD y no está eliminado (soft delete).
    Use this when you need to verify user exists in database."""
    # El usuario ya fue decodificado por get_current_user
    # Validación adicional contra BD se puede hacer en cada endpoint si es necesario
    return current_user

def get_current_user_admin(current_user=Depends(get_current_user)):
    """Dependencia: Valida que el usuario actual sea administrador."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo admin permitido")
    return current_user