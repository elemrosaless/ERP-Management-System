from sqlalchemy import Column, Integer, String, Boolean, DateTime, text
from .base import Base

class Supplier(Base):
    __tablename__ = 'suppliers'
    __table_args__ = {'schema': 'core'}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    is_active = Column(Boolean, nullable=False, server_default=text('true'))
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=text('NOW()'))
