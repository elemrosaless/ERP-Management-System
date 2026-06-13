from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base

class SaleItem(Base):
    __tablename__ = 'sale_items'
    __table_args__ = {'schema': 'core'}

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey('core.sales.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('core.products.id'), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    sale = relationship('Sale', back_populates='items')
    product = relationship('Product', back_populates='sale_items')
