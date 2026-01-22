from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class KS3(Base):
    """Модель формы КС-3 (Справка о стоимости выполненных работ и затрат)"""
    __tablename__ = "ks3"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    ks2_id = Column(Integer, ForeignKey("ks2.id"), comment="Связанный акт КС-2")
    number = Column(String(100), nullable=False, comment="Номер справки")
    date = Column(Date, nullable=False, comment="Дата справки")
    period_from = Column(Date, comment="Период с")
    period_to = Column(Date, comment="Период по")
    customer = Column(String(500), comment="Заказчик")
    contractor = Column(String(500), comment="Подрядчик")
    object_name = Column(String(1000), comment="Наименование объекта")
    total_amount = Column(Numeric(15, 2), default=0, comment="Общая сумма")
    total_vat = Column(Numeric(15, 2), default=0, comment="НДС")
    total_with_vat = Column(Numeric(15, 2), default=0, comment="Всего с НДС")
    contractor_signature = Column(String(200), comment="Подпись подрядчика")
    customer_signature = Column(String(200), comment="Подпись заказчика")
    status = Column(String(50), default="draft", comment="Статус (draft, submitted, verified, signed, approved, rejected)")
    estimate_id = Column(Integer, ForeignKey("estimates.id"), comment="Связанная смета")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="ks3_forms")
    estimate = relationship("Estimate", foreign_keys=[estimate_id])
    items = relationship("KS3Item", back_populates="ks3", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="ks3")


class KS3Item(Base):
    """Модель позиции формы КС-3"""
    __tablename__ = "ks3_items"

    id = Column(Integer, primary_key=True, index=True)
    ks3_id = Column(Integer, ForeignKey("ks3.id"), nullable=False, index=True)
    line_number = Column(Integer, comment="Номер строки")
    work_name = Column(String(1000), nullable=False, comment="Наименование работ")
    unit = Column(String(50), comment="Единица измерения")
    volume = Column(Numeric(15, 3), nullable=False, comment="Объем")
    price = Column(Numeric(15, 2), comment="Цена за единицу")
    amount = Column(Numeric(15, 2), comment="Сумма")
    vat_rate = Column(Numeric(5, 2), default=20, comment="Ставка НДС (%)")
    vat_amount = Column(Numeric(15, 2), comment="Сумма НДС")
    amount_with_vat = Column(Numeric(15, 2), comment="Сумма с НДС")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    ks3 = relationship("KS3", back_populates="items")