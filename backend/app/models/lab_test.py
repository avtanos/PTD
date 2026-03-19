from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class LabTestType(Base):
    __tablename__ = "lab_test_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, unique=True)
    code = Column(String(80), nullable=True, unique=True, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Laboratory(Base):
    __tablename__ = "laboratories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False, unique=True)
    code = Column(String(80), nullable=True, unique=True, index=True)
    address = Column(String(500), nullable=True)
    phone = Column(String(80), nullable=True)
    email = Column(String(200), nullable=True)
    contact_person = Column(String(200), nullable=True)
    contacts = Column(Text, comment="Контакты", nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LabTest(Base):
    """Лабораторные испытания (протоколы) по проекту."""

    __tablename__ = "lab_tests"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)

    test_type_id = Column(Integer, ForeignKey("lab_test_types.id"), nullable=True, comment="Вид испытания (справочник)")
    test_type = Column(String(200), nullable=False, comment="Вид испытания (legacy, текст)")
    sample_description = Column(String(500), comment="Описание образца/участка")
    laboratory_id = Column(Integer, ForeignKey("laboratories.id"), nullable=True, comment="Лаборатория (справочник)")
    lab_name = Column(String(300), comment="Лаборатория / исполнитель (legacy, текст)")

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
    test_type_ref = relationship("LabTestType", foreign_keys=[test_type_id])
    laboratory_ref = relationship("Laboratory", foreign_keys=[laboratory_id])

