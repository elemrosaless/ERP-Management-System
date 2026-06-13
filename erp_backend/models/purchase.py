from sqlalchemy import Column, Integer, Float, Boolean, DateTime, text
from sqlalchemy.orm import relationship

from .base import Base

class Purchase(Base):
    __tablename__ = 'purchases'
    __table_args__ = {'schema': 'core'}

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, nullable=False)
    created_by = Column(Integer, nullable=False)
    total = Column(Float, nullable=False)
    is_active = Column(Boolean, nullable=False, server_default=text('true'))
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=text('NOW()'))

    items = relationship('PurchaseItem', back_populates='purchase', cascade='all, delete-orphan')
