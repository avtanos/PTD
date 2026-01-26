from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class ObjectConstruct(Base):
    """Модель конструктива объекта"""
    __tablename__ = "object_constructs"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, comment="Код конструктива")
    name = Column(String(200), nullable=False, comment="Наименование")
    category = Column(String(100), comment="Категория")
    description = Column(Text, comment="Описание")
    is_active = Column(Boolean, default=True, comment="Активен")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project_constructs = relationship("ProjectConstruct", back_populates="construct")


class ProjectConstruct(Base):
    """Связь проекта с конструктивами через этап (иерархия: Объект → Этап → Конструктив)"""
    __tablename__ = "project_constructs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True, comment="Проект (объект)")
    stage_id = Column(Integer, ForeignKey("project_stages.id"), comment="Этап проекта (опционально, для иерархии)")
    construct_id = Column(Integer, ForeignKey("object_constructs.id"), nullable=False, index=True, comment="Конструктив")
    planned_volume = Column(String(500), comment="Планируемый объем")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project = relationship("Project", back_populates="constructs")
    stage = relationship("ProjectStage", back_populates="constructs")
    construct = relationship("ObjectConstruct", back_populates="project_constructs")