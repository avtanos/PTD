from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class ExecutionStatus(str, enum.Enum):
    """Статус выполнения работы"""
    NOT_STARTED = "not_started"  # Не начат
    IN_PROGRESS = "in_progress"  # В работе
    ON_APPROVAL = "on_approval"  # На согласовании
    COMPLETED = "completed"  # Выполнено


class DocumentStatus(str, enum.Enum):
    """Статус документа по сроку действия"""
    VALID = "valid"  # Действителен (>30 дней)
    EXPIRING = "expiring"  # Скоро истекает (7-30 дней)
    EXPIRED = "expired"  # Просрочен


class DocumentRoadmapSection(Base):
    """Модель узла дорожной карты документов (статическая структура)"""
    __tablename__ = "document_roadmap_sections"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(200), unique=True, index=True, nullable=False, comment="Код узла (например: sketch.itc.heat_supply)")
    name = Column(String(500), nullable=False, comment="Наименование узла")
    parent_id = Column(Integer, ForeignKey("document_roadmap_sections.id"), nullable=True, comment="ID родительского узла")
    order_number = Column(Integer, default=0, comment="Порядковый номер для сортировки")
    description = Column(Text, comment="Описание узла")
    is_active = Column(Boolean, default=True, comment="Активен")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    parent = relationship("DocumentRoadmapSection", remote_side=[id], backref="children")
    statuses = relationship("DocumentSectionStatus", back_populates="section", cascade="all, delete-orphan")


class DocumentSectionStatus(Base):
    """Модель статуса узла дорожной карты для конкретного проекта"""
    __tablename__ = "document_section_statuses"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    section_id = Column(Integer, ForeignKey("document_roadmap_sections.id"), nullable=False, index=True)
    section_code = Column(String(200), nullable=False, index=True, comment="Код секции (для быстрого поиска)")
    
    # Поля из ТЗ
    request_date = Column(Date, comment="Дата обращения")
    due_date = Column(Date, comment="Срок исполнения (до)")
    valid_until_date = Column(Date, comment="Срок действия документа (до)")
    executor_company = Column(String(500), comment="Исполнитель от компании")
    executor_authority = Column(String(500), comment="Исполнитель от гос органа")
    execution_status = Column(Enum(ExecutionStatus), default=ExecutionStatus.NOT_STARTED, comment="Статус выполнения")
    note = Column(Text, comment="Примечание")
    
    # Вычисляемые поля (будут рассчитываться на лету или кэшироваться)
    document_status = Column(Enum(DocumentStatus), comment="Статус документа (автоматически рассчитывается)")
    document_status_calculated_at = Column(DateTime(timezone=True), comment="Дата последнего расчета статуса")
    
    # Метаданные
    created_by = Column(String(200), comment="Создал")
    updated_by = Column(String(200), comment="Обновил")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="document_roadmap_statuses")
    section = relationship("DocumentRoadmapSection", back_populates="statuses")
    files = relationship("DocumentFile", back_populates="status", cascade="all, delete-orphan")
    notifications = relationship("DocumentNotification", back_populates="status", cascade="all, delete-orphan", lazy="dynamic")


class DocumentFile(Base):
    """Модель файла, прикрепленного к узлу дорожной карты"""
    __tablename__ = "document_files"

    id = Column(Integer, primary_key=True, index=True)
    status_id = Column(Integer, ForeignKey("document_section_statuses.id"), nullable=False, index=True)
    file_name = Column(String(500), nullable=False, comment="Оригинальное имя файла")
    stored_path = Column(String(1000), nullable=False, comment="Путь к файлу на сервере")
    file_size = Column(Integer, comment="Размер файла в байтах")
    mime_type = Column(String(100), default="application/pdf", comment="MIME тип файла")
    uploaded_by = Column(String(200), comment="Загрузил")
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    description = Column(Text, comment="Описание файла")
    is_active = Column(Boolean, default=True, comment="Активен")

    # Relationships
    status = relationship("DocumentSectionStatus", back_populates="files")
