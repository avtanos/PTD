from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Numeric, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class MaterialType(str, enum.Enum):
    """Типы материалов"""
    CONSTRUCTION = "construction"  # Строительные материалы
    EQUIPMENT = "equipment"  # Оборудование
    TOOLS = "tools"  # Инструменты
    CONSUMABLES = "consumables"  # Расходные материалы
    OTHER = "other"  # Прочее


class MovementType(str, enum.Enum):
    """Типы движения материалов"""
    RECEIPT = "receipt"  # Поступление
    TRANSFER = "transfer"  # Перемещение
    WRITE_OFF = "write_off"  # Списание
    RETURN = "return"  # Возврат
    ADJUSTMENT = "adjustment"  # Корректировка


class WriteOffReason(str, enum.Enum):
    """Причины списания"""
    PRODUCTION = "production"  # На производство
    DEFECT = "defect"  # Брак
    LOSS = "loss"  # Потери
    TESTING = "testing"  # На испытания
    DAMAGE = "damage"  # Повреждение
    OTHER = "other"  # Прочее


class Material(Base):
    """Модель материала/ТМЦ"""
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, index=True, comment="Код материала")
    name = Column(String(500), nullable=False, comment="Наименование")
    material_type = Column(Enum(MaterialType), nullable=False, comment="Тип материала")
    unit = Column(String(50), nullable=False, comment="Единица измерения")
    specification = Column(String(1000), comment="Характеристики/спецификация")
    standard_price = Column(Numeric(15, 2), comment="Нормативная цена")
    is_active = Column(Boolean, default=True, comment="Активен")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    movements = relationship("MaterialMovement", back_populates="material")
    # write_offs relationship removed - connection is through MaterialWriteOffItem
    warehouse_stocks = relationship("WarehouseStock", back_populates="material")


class Warehouse(Base):
    """Модель склада"""
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, comment="Код склада")
    name = Column(String(200), nullable=False, comment="Наименование")
    location = Column(String(500), comment="Адрес/местоположение")
    responsible = Column(String(200), comment="Ответственный")
    is_active = Column(Boolean, default=True, comment="Активен")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    stocks = relationship("WarehouseStock", back_populates="warehouse", cascade="all, delete-orphan")
    movements_to = relationship("MaterialMovement", foreign_keys="MaterialMovement.to_warehouse_id", back_populates="to_warehouse")
    movements_from = relationship("MaterialMovement", foreign_keys="MaterialMovement.from_warehouse_id", back_populates="from_warehouse")


class WarehouseStock(Base):
    """Модель остатков на складе"""
    __tablename__ = "warehouse_stocks"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    quantity = Column(Numeric(15, 3), default=0, comment="Количество")
    reserved_quantity = Column(Numeric(15, 3), default=0, comment="Зарезервировано")
    last_movement_date = Column(DateTime(timezone=True), comment="Дата последнего движения")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    warehouse = relationship("Warehouse", back_populates="stocks")
    material = relationship("Material", back_populates="warehouse_stocks")


class MaterialMovement(Base):
    """Модель движения материалов"""
    __tablename__ = "material_movements"

    id = Column(Integer, primary_key=True, index=True)
    movement_type = Column(Enum(MovementType), nullable=False, comment="Тип движения")
    movement_number = Column(String(100), nullable=False, index=True, comment="Номер документа движения")
    movement_date = Column(Date, nullable=False, comment="Дата движения")
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    quantity = Column(Numeric(15, 3), nullable=False, comment="Количество")
    price = Column(Numeric(15, 2), comment="Цена за единицу")
    amount = Column(Numeric(15, 2), comment="Сумма")
    from_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), comment="Склад-отправитель")
    to_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), comment="Склад-получатель")
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True, comment="Проект (объект) - обязательная привязка")
    application_id = Column(Integer, ForeignKey("applications.id"), comment="Связанная заявка")
    supplier = Column(String(500), comment="Поставщик")
    batch_number = Column(String(100), comment="Номер партии")
    receipt_date = Column(Date, comment="Дата поступления")
    responsible = Column(String(200), comment="Ответственный")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    material = relationship("Material", back_populates="movements")
    from_warehouse = relationship("Warehouse", foreign_keys=[from_warehouse_id], back_populates="movements_from")
    to_warehouse = relationship("Warehouse", foreign_keys=[to_warehouse_id], back_populates="movements_to")
    project = relationship("Project", back_populates="material_movements")
    application = relationship("Application")


class MaterialWriteOff(Base):
    """Модель списания материалов"""
    __tablename__ = "material_write_offs"

    id = Column(Integer, primary_key=True, index=True)
    write_off_number = Column(String(100), nullable=False, unique=True, index=True, comment="Номер акта списания")
    write_off_date = Column(Date, nullable=False, comment="Дата списания")
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    work_volume_id = Column(Integer, ForeignKey("work_volumes.id"), comment="Связанная работа")
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), comment="Склад")
    reason = Column(Enum(WriteOffReason), nullable=False, comment="Причина списания")
    description = Column(Text, comment="Описание")
    responsible = Column(String(200), nullable=False, comment="Ответственный за списание")
    approved_by = Column(String(200), comment="Утвердил")
    approved_date = Column(Date, comment="Дата утверждения")
    status = Column(String(50), default="draft", comment="Статус (draft, approved, executed)")
    total_amount = Column(Numeric(15, 2), default=0, comment="Общая сумма списания")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="material_write_offs")
    work_volume = relationship("WorkVolume")
    warehouse = relationship("Warehouse")
    items = relationship("MaterialWriteOffItem", back_populates="write_off", cascade="all, delete-orphan")


class MaterialWriteOffItem(Base):
    """Модель позиции списания материалов"""
    __tablename__ = "material_write_off_items"

    id = Column(Integer, primary_key=True, index=True)
    write_off_id = Column(Integer, ForeignKey("material_write_offs.id"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    movement_id = Column(Integer, ForeignKey("material_movements.id"), comment="Ссылка на поступление (FIFO)")
    line_number = Column(Integer, comment="Номер строки")
    quantity = Column(Numeric(15, 3), nullable=False, comment="Количество")
    price = Column(Numeric(15, 2), comment="Цена")
    amount = Column(Numeric(15, 2), comment="Сумма")
    batch_number = Column(String(100), comment="Номер партии")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    write_off = relationship("MaterialWriteOff", back_populates="items")
    material = relationship("Material")
    movement = relationship("MaterialMovement")