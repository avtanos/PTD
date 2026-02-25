"""Модель сотрудника (кадровый учёт)"""
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class EmployeeStatus(str, enum.Enum):
    """Статус сотрудника"""
    EMPLOYED = "employed"      # Работает
    DISMISSED = "dismissed"    # Уволен
    VACATION = "vacation"      # В отпуске
    MATERNITY = "maternity"    # Декретный отпуск
    SICK_LEAVE = "sick_leave"  # На больничном


class Employee(Base):
    """Модель сотрудника (кадровый учёт)"""
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    personnel_number = Column(String(50), unique=True, index=True, comment="Табельный номер")
    full_name = Column(String(300), nullable=False, index=True, comment="ФИО")
    last_name = Column(String(100), comment="Фамилия")
    first_name = Column(String(100), comment="Имя")
    middle_name = Column(String(100), comment="Отчество")
    position = Column(String(200), nullable=False, index=True, comment="Должность")
    department_id = Column(Integer, ForeignKey("departments.id"), index=True, comment="Подразделение")
    birth_date = Column(Date, comment="Дата рождения")
    hire_date = Column(Date, nullable=False, comment="Дата приёма")
    dismissal_date = Column(Date, comment="Дата увольнения")
    phone = Column(String(50), comment="Телефон")
    email = Column(String(200), comment="Email")
    inn = Column(String(12), comment="ИНН")
    snils = Column(String(14), comment="СНИЛС")
    status = Column(Enum(EmployeeStatus), default=EmployeeStatus.EMPLOYED, comment="Статус")
    address = Column(String(500), comment="Адрес проживания")
    education = Column(String(500), comment="Образование")
    notes = Column(Text, comment="Примечания")
    user_id = Column(Integer, ForeignKey("users.id"), comment="Связь с учётной записью")
    is_active = Column(Boolean, default=True, comment="Активен")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    department = relationship("Department", back_populates="employees")
    user = relationship("User", back_populates="employee", foreign_keys=[user_id])
