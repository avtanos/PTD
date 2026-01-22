from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class KS2(Base):
    """Модель формы КС-2 (Акт о приемке выполненных работ)"""
    __tablename__ = "ks2"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), comment="Связанный договор")
    number = Column(String(100), nullable=False, comment="Номер акта")
    date = Column(Date, nullable=False, comment="Дата акта")
    period_from = Column(Date, comment="Период с")
    period_to = Column(Date, comment="Период по")
    customer = Column(String(500), comment="Заказчик")
    contractor = Column(String(500), comment="Подрядчик")
    object_name = Column(String(1000), comment="Наименование объекта")
    total_amount = Column(Numeric(15, 2), default=0, comment="Общая сумма")
    contractor_signature = Column(String(200), comment="Подпись подрядчика")
    customer_signature = Column(String(200), comment="Подпись заказчика")
    status = Column(String(50), default="draft", comment="Статус (draft, in_review, signed, approved, rejected)")
    verified_by = Column(String(200), comment="Проверил (ПТО)")
    verification_date = Column(Date, comment="Дата проверки")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="ks2_forms")
    contract = relationship("Contract", foreign_keys=[contract_id])
    items = relationship("KS2Item", back_populates="ks2", cascade="all, delete-orphan")


class KS2Item(Base):
    """Модель позиции формы КС-2"""
    __tablename__ = "ks2_items"

    id = Column(Integer, primary_key=True, index=True)
    ks2_id = Column(Integer, ForeignKey("ks2.id"), nullable=False, index=True)
    line_number = Column(Integer, comment="Номер строки")
    work_name = Column(String(1000), nullable=False, comment="Наименование работ")
    unit = Column(String(50), comment="Единица измерения")
    volume_estimated = Column(Numeric(15, 3), comment="Объем по проекту")
    volume_completed = Column(Numeric(15, 3), nullable=False, comment="Объем выполненных работ")
    volume_total = Column(Numeric(15, 3), comment="Объем всего")
    price = Column(Numeric(15, 2), comment="Цена за единицу")
    amount = Column(Numeric(15, 2), comment="Сумма")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    ks2 = relationship("KS2", back_populates="items")