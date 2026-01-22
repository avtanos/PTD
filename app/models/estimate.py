from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Numeric, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class EstimateType(str, enum.Enum):
    """Типы смет"""
    LOCAL = "local"  # Локальная смета
    OBJECT = "object"  # Объектная смета
    SUMMARY = "summary"  # Сводная смета
    CONSOLIDATED = "consolidated"  # Сводный сметный расчет


class EstimateItemType(str, enum.Enum):
    """Типы позиций сметы"""
    MATERIALS = "materials"  # Материалы
    LABOR = "labor"  # Работы
    EQUIPMENT = "equipment"  # Механизмы
    OVERHEAD = "overhead"  # Накладные расходы
    OTHER = "other"  # Прочее


class Estimate(Base):
    """Модель сметы"""
    __tablename__ = "estimates"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    estimate_type = Column(Enum(EstimateType), nullable=False, comment="Тип сметы")
    number = Column(String(100), nullable=False, comment="Номер сметы")
    name = Column(String(500), nullable=False, comment="Наименование сметы")
    date = Column(Date, nullable=False, comment="Дата сметы")
    version = Column(String(50), comment="Версия")
    base_estimate_id = Column(Integer, ForeignKey("estimates.id"), comment="Базовая смета (для сводной)")
    total_amount = Column(Numeric(15, 2), default=0, comment="Общая стоимость")
    materials_cost = Column(Numeric(15, 2), default=0, comment="Стоимость материалов")
    labor_cost = Column(Numeric(15, 2), default=0, comment="Стоимость работ")
    equipment_cost = Column(Numeric(15, 2), default=0, comment="Стоимость механизмов")
    overhead_cost = Column(Numeric(15, 2), default=0, comment="Накладные расходы")
    related_costs = Column(Numeric(15, 2), default=0, comment="Сопутствующие затраты")
    developed_by = Column(String(200), comment="Разработал")
    approved_by = Column(String(200), comment="Утвердил")
    file_path = Column(String(1000), comment="Путь к файлу")
    is_active = Column(Boolean, default=True, comment="Активна")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="estimates")
    base_estimate = relationship("Estimate", remote_side=[id])
    items = relationship("EstimateItem", back_populates="estimate", cascade="all, delete-orphan")
    related_cost_items = relationship("RelatedCost", back_populates="estimate", cascade="all, delete-orphan")
    validations = relationship("EstimateValidation", back_populates="estimate", cascade="all, delete-orphan")
    contract_links = relationship("EstimateContractLink", back_populates="estimate", cascade="all, delete-orphan")
    cost_controls = relationship("CostControl", back_populates="estimate", cascade="all, delete-orphan")


class EstimateItem(Base):
    """Модель позиции сметы"""
    __tablename__ = "estimate_items"

    id = Column(Integer, primary_key=True, index=True)
    estimate_id = Column(Integer, ForeignKey("estimates.id"), nullable=False, index=True)
    item_type = Column(Enum(EstimateItemType), nullable=False, comment="Тип позиции")
    line_number = Column(Integer, comment="Номер строки")
    code = Column(String(100), comment="Код расценки")
    work_name = Column(String(1000), nullable=False, comment="Наименование работ/материалов")
    unit = Column(String(50), comment="Единица измерения")
    quantity = Column(Numeric(15, 3), nullable=False, comment="Количество")
    unit_price = Column(Numeric(15, 2), comment="Расценка за единицу")
    total_price = Column(Numeric(15, 2), comment="Всего по расценке")
    materials_price = Column(Numeric(15, 2), comment="Материалы")
    labor_price = Column(Numeric(15, 2), comment="Заработная плата")
    equipment_price = Column(Numeric(15, 2), comment="Механизмы")
    standard_rate_id = Column(Integer, ForeignKey("standard_rates.id"), comment="Нормативная расценка")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    estimate = relationship("Estimate", back_populates="items")
    standard_rate = relationship("StandardRate", foreign_keys=[standard_rate_id])


class RelatedCost(Base):
    """Модель сопутствующих затрат"""
    __tablename__ = "related_costs"

    id = Column(Integer, primary_key=True, index=True)
    estimate_id = Column(Integer, ForeignKey("estimates.id"), nullable=False, index=True)
    cost_type = Column(String(100), nullable=False, comment="Тип затрат")
    description = Column(String(500), comment="Описание")
    amount = Column(Numeric(15, 2), nullable=False, comment="Сумма")
    percentage = Column(Numeric(5, 2), comment="Процент от стоимости")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    estimate = relationship("Estimate", back_populates="related_cost_items")