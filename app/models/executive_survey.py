from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class SurveyType(str, enum.Enum):
    """Типы съемок"""
    EXECUTIVE = "executive"  # Исполнительная съемка
    CONTROL = "control"  # Контрольная съемка
    MARKING = "marking"  # Разбивочная съемка
    OTHER = "other"  # Прочее


class ExecutiveSurvey(Base):
    """Модель исполнительной съемки"""
    __tablename__ = "executive_surveys"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    survey_type = Column(Enum(SurveyType, native_enum=False), nullable=False, comment="Тип съемки")
    number = Column(String(100), comment="Номер съемки")
    survey_date = Column(Date, nullable=False, comment="Дата съемки")
    surveyor = Column(String(200), comment="Геодезист")
    department = Column(String(200), comment="Подразделение (геодезия)")
    description = Column(Text, comment="Описание работ")
    coordinates = Column(Text, comment="Координаты/отметки")
    file_path = Column(String(1000), comment="Путь к файлу")
    drawing_path = Column(String(1000), comment="Путь к чертежу")
    status = Column(String(50), default="completed", comment="Статус")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="executive_surveys")