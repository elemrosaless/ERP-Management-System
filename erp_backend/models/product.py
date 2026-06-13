from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, text
from sqlalchemy.orm import relationship

from .base import Base

class Product(Base):
    __tablename__ = 'products'
    __table_args__ = {'schema': 'core'}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    stock = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, server_default=text('true'))
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=text('NOW()'))

    purchase_items = relationship('PurchaseItem', back_populates='product')
    sale_items = relationship('SaleItem', back_populates='product')
    stock_movements = relationship('StockMovement', back_populates='product')
