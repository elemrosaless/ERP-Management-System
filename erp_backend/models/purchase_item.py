from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base

class PurchaseItem(Base):
    __tablename__ = 'purchase_items'
    __table_args__ = {'schema': 'core'}

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey('core.purchases.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('core.products.id'), nullable=False)
    quantity = Column(Integer, nullable=False)
    cost = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    purchase = relationship('Purchase', back_populates='items')
    product = relationship('Product', back_populates='purchase_items')
