from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Numeric, Enum, Boolean
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
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True, comment="Объект строительства/проект")
    application_type = Column(String(50), nullable=False, comment="Тип заявки")
    number = Column(String(100), nullable=False, comment="Номер заявки")
    date = Column(Date, nullable=False, comment="Дата заявки")
    requested_by = Column(String(200), comment="Инициатор (поставщик/подрядчик) - текст, если используется")
    requested_by_personnel_id = Column(Integer, ForeignKey("personnel.id"), comment="Сотрудник, подавший заявку")
    department = Column(String(200), comment="Подразделение (текст, если используется)")
    department_id = Column(Integer, ForeignKey("departments.id"), comment="Подразделение (справочник)")
    organization_id = Column(Integer, ForeignKey("organizations.id"), comment="Организация")
    status = Column(String(50), default="draft", comment="Статус заявки")
    basis = Column(Text, comment="Основание")
    old_number = Column(String(120), comment="Старый номер")
    material_kind_id = Column(Integer, ForeignKey("material_kinds.id"), comment="Вид материала (справочник)")
    description = Column(Text, comment="Описание/обоснование")
    total_amount = Column(Numeric(15, 2), default=0, comment="Общая сумма")
    approved_by = Column(String(200), comment="Утвердил")
    approval_date = Column(Date, comment="Дата утверждения")
    warehouse = Column(String(200), comment="Склад (текст)")
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), comment="Склад (справочник)")
    payment_type_id = Column(Integer, ForeignKey("payment_types.id"), comment="Вид оплаты (по умолчанию)")
    counterparty_id = Column(Integer, ForeignKey("counterparties.id"), comment="Контрагент (по умолчанию)")
    initiator_counterparty_id = Column(Integer, ForeignKey("counterparties.id"), comment="Инициатор (поставщик/подрядчик)")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    author_user_id = Column(Integer, ForeignKey("users.id"), comment="Автор (пользователь)")
    responsible_personnel_id = Column(Integer, ForeignKey("personnel.id"), comment="Ответственный (сотрудник)")
    comment = Column(Text, comment="Комментарий")
    is_posted = Column(Boolean, default=False, comment="Проведен")

    # Relationships
    project = relationship("Project", back_populates="applications")
    requested_by_personnel = relationship("Personnel", foreign_keys=[requested_by_personnel_id])
    responsible_personnel = relationship("Personnel", foreign_keys=[responsible_personnel_id])
    department_ref = relationship("Department", foreign_keys=[department_id])
    organization = relationship("Organization", foreign_keys=[organization_id])
    warehouse_ref = relationship("Warehouse", foreign_keys=[warehouse_id])
    payment_type = relationship("PaymentType", foreign_keys=[payment_type_id])
    counterparty = relationship("Counterparty", foreign_keys=[counterparty_id])
    initiator_counterparty = relationship("Counterparty", foreign_keys=[initiator_counterparty_id])
    material_kind = relationship("MaterialKind", foreign_keys=[material_kind_id])
    author_user = relationship("User", foreign_keys=[author_user_id])
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
    payment_type_id = Column(Integer, ForeignKey("payment_types.id"), comment="Вид оплаты")
    counterparty_id = Column(Integer, ForeignKey("counterparties.id"), comment="Контрагент")
    contractor_id = Column(Integer, ForeignKey("counterparties.id"), comment="Подрядчик")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    application = relationship("Application", back_populates="items")
    payment_type = relationship("PaymentType", foreign_keys=[payment_type_id])
    counterparty = relationship("Counterparty", foreign_keys=[counterparty_id])
    contractor = relationship("Counterparty", foreign_keys=[contractor_id])