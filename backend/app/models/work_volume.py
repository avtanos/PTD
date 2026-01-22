from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Numeric, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class WorkVolume(Base):
    """Модель ведомости объемов работ (ВОР)"""
    __tablename__ = "work_volumes"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    construct_id = Column(Integer, ForeignKey("object_constructs.id"), comment="Конструктив")
    work_code = Column(String(100), comment="Код работы")
    work_name = Column(String(1000), nullable=False, comment="Наименование работы")
    unit = Column(String(50), comment="Единица измерения")
    planned_volume = Column(Numeric(15, 3), nullable=False, comment="Плановый объем")
    actual_volume = Column(Numeric(15, 3), default=0, comment="Фактический объем")
    completed_percentage = Column(Numeric(5, 2), default=0, comment="Процент выполнения")
    estimated_price = Column(Numeric(15, 2), comment="Расценка за единицу")
    planned_amount = Column(Numeric(15, 2), comment="Плановая сумма")
    actual_amount = Column(Numeric(15, 2), default=0, comment="Фактическая сумма")
    contractor_id = Column(Integer, ForeignKey("contractors.id"), comment="Подрядчик")
    status = Column(String(50), default="planned", comment="Статус (planned, in_progress, completed, suspended)")
    start_date = Column(Date, comment="Дата начала")
    end_date = Column(Date, comment="Дата окончания")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="work_volumes")
    construct = relationship("ObjectConstruct")
    contractor = relationship("Contractor")
    entries = relationship("WorkVolumeEntry", back_populates="work_volume", cascade="all, delete-orphan")


class WorkVolumeEntry(Base):
    """Модель записи фактического объема работ"""
    __tablename__ = "work_volume_entries"

    id = Column(Integer, primary_key=True, index=True)
    work_volume_id = Column(Integer, ForeignKey("work_volumes.id"), nullable=False, index=True)
    entry_date = Column(Date, nullable=False, comment="Дата ввода")
    actual_volume = Column(Numeric(15, 3), nullable=False, comment="Фактический объем")
    location = Column(String(500), comment="Локация/участок")
    entered_by = Column(String(200), comment="Ввел")
    contractor_id = Column(Integer, ForeignKey("contractors.id"), comment="Подрядчик (если применимо)")
    photos = Column(Text, comment="Пути к фотографиям (JSON массив)")
    survey_id = Column(Integer, ForeignKey("executive_surveys.id"), comment="Исполнительная съемка")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    work_volume = relationship("WorkVolume", back_populates="entries")
    contractor = relationship("Contractor")
    survey = relationship("ExecutiveSurvey")