from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Department(Base):
    """Модель подразделения/отдела"""
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, comment="Код подразделения")
    name = Column(String(200), nullable=False, comment="Наименование")
    short_name = Column(String(50), comment="Краткое наименование")
    description = Column(Text, comment="Описание")
    head = Column(String(200), comment="Руководитель")
    is_active = Column(Boolean, default=True, comment="Активно")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    projects = relationship("Project", back_populates="department")
    users = relationship("User", back_populates="department")