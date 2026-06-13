import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import Base  # Import models package so SQLAlchemy metadata is populated

# Use DATABASE_URL from environment when available
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:L22160121@localhost:5433/erp_db")

# Create engine (pool_pre_ping helps with stale connections)
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependencia para obtener sesión de BD en endpoints."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()