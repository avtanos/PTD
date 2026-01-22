from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Numeric, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class ApplicationType(str, enum.Enum):
    """Типы заявок"""
    MATERIALS = "materials"  # Материалы для строительства
    EQUIPMENT = "equipment"  # Спецтехника
    SERVICES = "services"  # Услуги
    OTHER = "other"  # Прочее


class ApplicationStatus(str, enum.Enum):
    """Статусы заявок"""
    DRAFT = "draft"  # Черновик
    SUBMITTED = "submitted"  # Подана
    IN_PROCESS = "in_process"  # В обработке
    APPROVED = "approved"  # Утверждена
    REJECTED = "rejected"  # Отклонена
    COMPLETED = "completed"  # Выполнена


class Application(Base):
    """Модель заявки"""
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    application_type = Column(Enum(ApplicationType), nullable=False, comment="Тип заявки")
    number = Column(String(100), nullable=False, comment="Номер заявки")
    date = Column(Date, nullable=False, comment="Дата заявки")
    requested_by = Column(String(200), comment="Подал заявку")
    department = Column(String(200), comment="Подразделение")
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.DRAFT, comment="Статус заявки")
    description = Column(Text, comment="Описание/обоснование")
    total_amount = Column(Numeric(15, 2), default=0, comment="Общая сумма")
    approved_by = Column(String(200), comment="Утвердил")
    approval_date = Column(Date, comment="Дата утверждения")
    warehouse = Column(String(200), comment="Склад")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="applications")
    items = relationship("ApplicationItem", back_populates="application", cascade="all, delete-orphan")
    workflow = relationship("ApplicationWorkflow", back_populates="application", cascade="all, delete-orphan", order_by="ApplicationWorkflow.order_number")


class ApplicationItem(Base):
    """Модель позиции заявки"""
    __tablename__ = "application_items"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    line_number = Column(Integer, comment="Номер строки")
    material_name = Column(String(500), nullable=False, comment="Наименование материала/услуги")
    specification = Column(String(1000), comment="Характеристики/спецификация")
    unit = Column(String(50), comment="Единица измерения")
    quantity = Column(Numeric(15, 3), nullable=False, comment="Количество")
    price = Column(Numeric(15, 2), comment="Цена за единицу")
    amount = Column(Numeric(15, 2), comment="Сумма")
    delivery_date = Column(Date, comment="Требуемая дата поставки")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    application = relationship("Application", back_populates="items")