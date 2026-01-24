from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Numeric, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class ChangeType(str, enum.Enum):
    """Типы изменений"""
    PLANNING = "planning"  # Перепланировка
    CONSTRUCTION = "construction"  # Изменение конструктивного решения
    MATERIAL = "material"  # Замена материала
    VOLUME = "volume"  # Изменение объемов
    ADDITIONAL = "additional"  # Дополнительные работы
    CORRECTION = "correction"  # Исправление ошибок
    OTHER = "other"  # Прочее


class ChangeStatus(str, enum.Enum):
    """Статусы изменения"""
    DRAFT = "draft"  # Черновик
    SUBMITTED = "submitted"  # Подано на согласование
    IN_APPROVAL = "in_approval"  # На согласовании
    APPROVED = "approved"  # Утверждено
    REJECTED = "rejected"  # Отклонено
    IMPLEMENTED = "implemented"  # Реализовано
    CANCELLED = "cancelled"  # Отменено


class ApprovalStatus(str, enum.Enum):
    """Статусы согласования"""
    PENDING = "pending"  # Ожидает
    APPROVED = "approved"  # Согласовано
    REJECTED = "rejected"  # Отклонено
    NEEDS_REVISION = "needs_revision"  # Требует доработки


class ProjectChange(Base):
    """Модель изменения проекта"""
    __tablename__ = "project_changes"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    change_type = Column(String(50), nullable=False, comment="Тип изменения")
    change_number = Column(String(100), nullable=False, unique=True, index=True, comment="Номер изменения")
    title = Column(String(500), nullable=False, comment="Наименование изменения")
    description = Column(Text, nullable=False, comment="Описание изменения")
    justification = Column(Text, comment="Обоснование")
    impact_volume = Column(Numeric(15, 3), comment="Влияние на объем")
    impact_cost = Column(Numeric(15, 2), comment="Влияние на стоимость")
    impact_schedule = Column(Integer, comment="Влияние на сроки (дней)")
    related_document_id = Column(Integer, ForeignKey("project_documentation.id"), comment="Связанный документ")
    related_construct_id = Column(Integer, ForeignKey("object_constructs.id"), comment="Связанный конструктив")
    initiator = Column(String(200), nullable=False, comment="Инициатор")
    initiator_date = Column(Date, nullable=False, comment="Дата инициации")
    status = Column(String(50), default="draft", comment="Статус")
    approved_date = Column(Date, comment="Дата утверждения")
    implemented_date = Column(Date, comment="Дата реализации")
    file_path = Column(String(1000), comment="Путь к файлам (эскизы, расчеты)")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="project_changes")
    related_document = relationship("ProjectDocumentation")
    related_construct = relationship("ObjectConstruct")
    approvals = relationship("ChangeApproval", back_populates="project_change", cascade="all, delete-orphan", order_by="ChangeApproval.order_number")
    defects = relationship("Defect", back_populates="project_change", cascade="all, delete-orphan")


class ChangeApproval(Base):
    """Модель согласования изменения"""
    __tablename__ = "change_approvals"

    id = Column(Integer, primary_key=True, index=True)
    project_change_id = Column(Integer, ForeignKey("project_changes.id"), nullable=False, index=True)
    order_number = Column(Integer, nullable=False, comment="Порядковый номер в маршруте")
    approver_role = Column(String(100), nullable=False, comment="Роль согласующего")
    approver_name = Column(String(200), comment="Имя согласующего")
    status = Column(String(50), default="pending", comment="Статус согласования")
    comment = Column(Text, comment="Комментарий")
    approved_date = Column(DateTime(timezone=True), comment="Дата согласования")
    is_parallel = Column(Boolean, default=False, comment="Параллельное согласование")
    is_required = Column(Boolean, default=True, comment="Обязательное согласование")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project_change = relationship("ProjectChange", back_populates="approvals")


class Defect(Base):
    """Модель замечания/дефекта технического надзора"""
    __tablename__ = "defects"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    project_change_id = Column(Integer, ForeignKey("project_changes.id"), comment="Связанное изменение")
    defect_number = Column(String(100), comment="Номер замечания")
    title = Column(String(500), nullable=False, comment="Наименование замечания")
    description = Column(Text, nullable=False, comment="Описание проблемы")
    severity = Column(String(50), default="medium", comment="Критичность (low, medium, high, critical)")
    location = Column(String(500), comment="Место обнаружения")
    detected_by = Column(String(200), comment="Обнаружил")
    detected_date = Column(Date, nullable=False, comment="Дата обнаружения")
    responsible = Column(String(200), comment="Ответственный за устранение")
    due_date = Column(Date, comment="Срок устранения")
    status = Column(String(50), default="open", comment="Статус (open, in_progress, fixed, verified, closed)")
    fixed_date = Column(Date, comment="Дата устранения")
    fixed_by = Column(String(200), comment="Устранил")
    verified_date = Column(Date, comment="Дата проверки")
    verified_by = Column(String(200), comment="Проверил")
    photos = Column(Text, comment="Пути к фотографиям (JSON массив)")
    fix_confirmation = Column(Text, comment="Подтверждение устранения")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="defects")
    project_change = relationship("ProjectChange", back_populates="defects")