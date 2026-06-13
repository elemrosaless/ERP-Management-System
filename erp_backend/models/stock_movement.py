from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, text
from sqlalchemy.orm import relationship

from .base import Base

class StockMovement(Base):
    __tablename__ = 'stock_movements'
    __table_args__ = {'schema': 'core'}

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey('core.products.id'), nullable=False)
    movement_type = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    reference_type = Column(String, nullable=True)
    reference_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=text('NOW()'))

    product = relationship('Product', back_populates='stock_movements')
