from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class GPR(Base):
    """Модель ГПР (График производства работ)"""
    __tablename__ = "gpr"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    name = Column(String(500), nullable=False, comment="Наименование графика")
    version = Column(String(50), comment="Версия графика")
    start_date = Column(Date, nullable=False, comment="Дата начала")
    end_date = Column(Date, nullable=False, comment="Дата окончания")
    created_by = Column(String(200), comment="Создал")
    approved_by = Column(String(200), comment="Утвердил")
    status = Column(String(50), default="draft", comment="Статус (draft, approved, active)")
    description = Column(Text, comment="Описание")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="gprs")
    tasks = relationship("GPRTask", back_populates="gpr", cascade="all, delete-orphan", order_by="GPRTask.start_date")


class GPRTask(Base):
    """Модель задачи в ГПР"""
    __tablename__ = "gpr_tasks"

    id = Column(Integer, primary_key=True, index=True)
    gpr_id = Column(Integer, ForeignKey("gpr.id"), nullable=False, index=True)
    name = Column(String(500), nullable=False, comment="Наименование работы")
    work_type = Column(String(200), comment="Вид работ")
    responsible = Column(String(200), comment="Ответственный")
    start_date = Column(Date, nullable=False, comment="Дата начала")
    end_date = Column(Date, nullable=False, comment="Дата окончания")
    planned_duration = Column(Integer, comment="Планируемая длительность (дни)")
    actual_start_date = Column(Date, comment="Фактическая дата начала")
    actual_end_date = Column(Date, comment="Фактическая дата окончания")
    progress = Column(Integer, default=0, comment="Процент выполнения (0-100)")
    status = Column(String(50), default="planned", comment="Статус (planned, in_progress, completed, delayed)")
    dependencies = Column(String(500), comment="Зависимости (ID задач через запятую)")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    gpr = relationship("GPR", back_populates="tasks")