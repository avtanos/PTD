from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class PPR(Base):
    """Модель ППР (Проект производства работ)"""
    __tablename__ = "ppr"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    name = Column(String(500), nullable=False, comment="Наименование ППР")
    number = Column(String(100), comment="Номер ППР")
    version = Column(String(50), comment="Версия")
    development_date = Column(Date, comment="Дата разработки")
    developer = Column(String(200), comment="Разработчик")
    approved_by = Column(String(200), comment="Утвердил")
    status = Column(String(50), default="draft", comment="Статус (draft, approved, active)")
    description = Column(Text, comment="Общее описание")
    file_path = Column(String(1000), comment="Путь к файлу")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="pprs")
    sections = relationship("PPRSection", back_populates="ppr", cascade="all, delete-orphan", order_by="PPRSection.order_number")


class PPRSection(Base):
    """Модель раздела ППР"""
    __tablename__ = "ppr_sections"

    id = Column(Integer, primary_key=True, index=True)
    ppr_id = Column(Integer, ForeignKey("ppr.id"), nullable=False, index=True)
    section_type = Column(String(100), nullable=False, comment="Тип раздела")
    title = Column(String(500), nullable=False, comment="Заголовок раздела")
    content = Column(Text, comment="Содержание раздела")
    order_number = Column(Integer, default=0, comment="Порядковый номер")
    file_path = Column(String(1000), comment="Путь к файлу раздела")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    ppr = relationship("PPR", back_populates="sections")