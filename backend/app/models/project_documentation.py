from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class DocumentationType(str, enum.Enum):
    """Типы проектной документации"""
    AR = "ar"  # АР - Архитектурные решения
    KR = "kr"  # КР - Конструктивные решения
    VK = "vk"  # ВК - Водоснабжение и канализация
    NVK = "nvk"  # НВК - Отопление и вентиляция
    ES = "es"  # ЭС - Электроснабжение
    EM = "em"  # ЭМ - Электроосвещение
    OTHER = "other"  # Прочее


class ProjectDocumentation(Base):
    """Модель проектной документации"""
    __tablename__ = "project_documentation"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    doc_type = Column(Enum(DocumentationType, native_enum=False), nullable=False, comment="Тип документации")
    name = Column(String(500), nullable=False, comment="Наименование")
    number = Column(String(100), comment="Номер документа")
    version = Column(String(50), comment="Версия")
    development_date = Column(Date, comment="Дата разработки")
    developer = Column(String(200), comment="Разработчик")
    approved_by = Column(String(200), comment="Утвердил")
    approval_date = Column(Date, comment="Дата утверждения")
    file_path = Column(String(1000), comment="Путь к файлу")
    description = Column(Text, comment="Описание")
    is_active = Column(Boolean, default=True, comment="Активна")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="project_documentation")
    material_specifications = relationship("MaterialSpecification", back_populates="project_documentation", cascade="all, delete-orphan")