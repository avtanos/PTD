from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Numeric, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class StandardRate(Base):
    """Модель нормативной расценки"""
    __tablename__ = "standard_rates"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, index=True, nullable=False, comment="Код расценки")
    name = Column(String(1000), nullable=False, comment="Наименование")
    unit = Column(String(50), comment="Единица измерения")
    materials_cost = Column(Numeric(15, 2), default=0, comment="Стоимость материалов")
    labor_cost = Column(Numeric(15, 2), default=0, comment="Заработная плата")
    equipment_cost = Column(Numeric(15, 2), default=0, comment="Стоимость механизмов")
    total_cost = Column(Numeric(15, 2), comment="Всего")
    collection = Column(String(200), comment="Сборник")
    section = Column(String(100), comment="Раздел")
    notes = Column(Text, comment="Примечания")
    is_active = Column(Boolean, default=True, comment="Активна")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())