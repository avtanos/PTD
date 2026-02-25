"""Модели учёта кадров"""
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class PersonnelDocumentType(str, enum.Enum):
    """Тип документа сотрудника"""
    RESUME = "resume"              # Резюме
    AUTOBIOGRAPHY = "autobiography"  # Автобиография
    DIPLOMA = "diploma"            # Диплом об образовании
    CERTIFICATE = "certificate"    # Сертификаты, удостоверения
    CONTRACT = "contract"          # Трудовой договор
    OTHER = "other"                # Прочее


class PersonnelHistoryAction(str, enum.Enum):
    """Действие в истории"""
    CREATED = "created"
    UPDATED = "updated"


class PersonnelStatus(str, enum.Enum):
    """Статус сотрудника"""
    EMPLOYED = "employed"      # В штате
    DISMISSED = "dismissed"    # Уволен
    VACATION = "vacation"      # Отпуск
    MATERNITY = "maternity"    # Декретный отпуск
    SICK_LEAVE = "sick_leave"  # Больничный


class Personnel(Base):
    """Модель сотрудника (кадровая запись)"""
    __tablename__ = "personnel"

    id = Column(Integer, primary_key=True, index=True)
    tab_number = Column(String(50), unique=True, index=True, comment="Табельный номер")
    full_name = Column(String(200), nullable=False, comment="ФИО")
    position = Column(String(200), nullable=False, comment="Должность")
    department_id = Column(Integer, ForeignKey("departments.id"), index=True, comment="Подразделение")
    hire_date = Column(Date, nullable=False, comment="Дата приёма")
    dismissal_date = Column(Date, comment="Дата увольнения")
    birth_date = Column(Date, comment="Дата рождения")
    phone = Column(String(50), comment="Телефон")
    email = Column(String(200), comment="Email")
    inn = Column(String(12), comment="ИНН")
    passport_series = Column(String(10), comment="Серия паспорта")
    passport_number = Column(String(20), comment="Номер паспорта")
    address = Column(Text, comment="Адрес проживания")
    status = Column(Enum(PersonnelStatus, native_enum=False), default=PersonnelStatus.EMPLOYED, comment="Статус")
    user_id = Column(Integer, ForeignKey("users.id"), comment="Связь с учётной записью")
    is_active = Column(Boolean, default=True, comment="Активен")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    department = relationship("Department", back_populates="personnel")
    user = relationship("User", back_populates="personnel", foreign_keys=[user_id])
    project_assignments = relationship(
        "ProjectPersonnel",
        back_populates="personnel",
        cascade="all, delete-orphan",
        foreign_keys="ProjectPersonnel.personnel_id"
    )
    documents = relationship("PersonnelDocument", back_populates="personnel", cascade="all, delete-orphan")
    history = relationship("PersonnelHistory", back_populates="personnel", cascade="all, delete-orphan", order_by="PersonnelHistory.changed_at")


class ProjectPersonnelRole(str, enum.Enum):
    """Роль сотрудника на проекте"""
    MANAGER = "manager"        # Руководитель проекта
    FOREMAN = "foreman"        # Прораб
    ENGINEER = "engineer"      # Инженер ПТО
    GEODESIST = "geodesist"    # Геодезист
    MASTER = "master"          # Мастер
    OTHER = "other"            # Прочее


class ProjectPersonnel(Base):
    """Назначение сотрудника на проект"""
    __tablename__ = "project_personnel"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    personnel_id = Column(Integer, ForeignKey("personnel.id"), nullable=False, index=True)
    role = Column(Enum(ProjectPersonnelRole, native_enum=False), default=ProjectPersonnelRole.OTHER, comment="Роль на проекте")
    date_from = Column(Date, nullable=False, comment="Дата назначения")
    date_to = Column(Date, comment="Дата снятия с проекта")
    is_main = Column(Boolean, default=False, comment="Основной ответственный")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="project_personnel", foreign_keys=[project_id])
    personnel = relationship("Personnel", back_populates="project_assignments", foreign_keys=[personnel_id])


class PersonnelDocument(Base):
    """Документ сотрудника (резюме, автобиография и т.д.)"""
    __tablename__ = "personnel_documents"

    id = Column(Integer, primary_key=True, index=True)
    personnel_id = Column(Integer, ForeignKey("personnel.id"), nullable=False, index=True)
    document_type = Column(Enum(PersonnelDocumentType, native_enum=False), nullable=False, comment="Тип документа")
    file_name = Column(String(255), nullable=False, comment="Оригинальное имя файла")
    file_path = Column(String(500), nullable=False, comment="Путь к файлу на сервере")
    file_size = Column(Integer, comment="Размер в байтах")
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    personnel = relationship("Personnel", back_populates="documents", foreign_keys=[personnel_id])


class PersonnelHistory(Base):
    """История изменений данных сотрудника"""
    __tablename__ = "personnel_history"

    id = Column(Integer, primary_key=True, index=True)
    personnel_id = Column(Integer, ForeignKey("personnel.id"), nullable=False, index=True)
    action = Column(Enum(PersonnelHistoryAction, native_enum=False), nullable=False, comment="Создание/обновление")
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    field_name = Column(String(100), comment="Изменённое поле (при обновлении)")
    old_value = Column(Text, comment="Старое значение")
    new_value = Column(Text, comment="Новое значение")
    description = Column(String(500), comment="Описание изменения")

    personnel = relationship("Personnel", back_populates="history", foreign_keys=[personnel_id])
