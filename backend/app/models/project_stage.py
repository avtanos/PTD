from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Boolean, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class ProjectStage(Base):
    """Модель этапа проекта (иерархия: Объект → Этап → Конструктив)"""
    __tablename__ = "project_stages"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True, comment="Проект (объект)")
    code = Column(String(50), comment="Код этапа")
    name = Column(String(500), nullable=False, comment="Наименование этапа")
    description = Column(Text, comment="Описание этапа")
    stage_type = Column(String(100), comment="Тип этапа (подготовительный, основной, отделочный, завершающий)")
    order_number = Column(Integer, default=0, comment="Порядковый номер этапа")
    planned_start_date = Column(Date, comment="Планируемая дата начала этапа")
    planned_end_date = Column(Date, comment="Планируемая дата окончания этапа")
    actual_start_date = Column(Date, comment="Фактическая дата начала этапа")
    actual_end_date = Column(Date, comment="Фактическая дата окончания этапа")
    status = Column(String(50), default="planned", comment="Статус этапа (planned, in_progress, completed, suspended)")
    progress_percentage = Column(Numeric(5, 2), default=0, comment="Процент выполнения этапа")
    responsible = Column(String(200), comment="Ответственный за этап")
    is_active = Column(Boolean, default=True, comment="Активен")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="stages")
    constructs = relationship("ProjectConstruct", back_populates="stage", cascade="all, delete-orphan")
    work_volumes = relationship("WorkVolume", back_populates="stage")
    estimates = relationship("Estimate", back_populates="stage")
