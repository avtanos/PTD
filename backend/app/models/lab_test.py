from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class LabTest(Base):
    """Лабораторные испытания (протоколы) по проекту."""

    __tablename__ = "lab_tests"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)

    test_type = Column(String(200), nullable=False, comment="Вид испытания (бетон, грунт, сварка...)")
    sample_description = Column(String(500), comment="Описание образца/участка")
    lab_name = Column(String(300), comment="Лаборатория / исполнитель")

    protocol_number = Column(String(120), comment="Номер протокола")
    protocol_date = Column(Date, comment="Дата протокола")
    sample_date = Column(Date, comment="Дата отбора")
    test_date = Column(Date, comment="Дата испытания")

    result = Column(String(50), default="pending", comment="Результат: pending|pass|fail")
    description = Column(Text, comment="Описание/показатели")
    notes = Column(Text, comment="Примечания")

    file_name = Column(String(500), comment="Имя файла протокола")
    stored_path = Column(String(1000), comment="Путь к файлу на сервере")

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    project = relationship("Project", backref="lab_tests")

