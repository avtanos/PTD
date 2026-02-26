from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class UserRole(str, enum.Enum):
    """Роли пользователей"""
    ADMIN = "admin"  # Администратор
    PTO_HEAD = "pto_head"  # Руководитель ПТО
    PTO_ENGINEER = "pto_engineer"  # Инженер ПТО
    SITE_MANAGER = "site_manager"  # Начальник участка (прораб)
    FOREMAN = "foreman"  # Прораб
    MASTER = "master"  # Мастер
    STOREKEEPER = "storekeeper"  # Заведующий складом
    OPERATOR = "operator"  # Оператор СМУ
    GEODESIST = "geodesist"  # Геодезист
    OGE_HEAD = "oge_head"  # Руководитель ОГЭ (энергетики)
    OGM_HEAD = "ogm_head"  # Руководитель ОГМ (краны)
    ARCHITECT = "architect"  # Архитектор
    SALES_MANAGER = "sales_manager"  # Менеджер по продажам
    ACCOUNTANT = "accountant"  # Бухгалтер
    DEBT_COLLECTOR = "debt_collector"  # Отдел дебиторской задолженности


class User(Base):
    """Модель пользователя"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False, comment="Логин")
    email = Column(String(200), unique=True, index=True, comment="Email")
    full_name = Column(String(200), nullable=False, comment="ФИО")
    role = Column(Enum(UserRole), nullable=False, comment="Роль")
    department_id = Column(Integer, ForeignKey("departments.id"), comment="Подразделение")
    position = Column(String(200), comment="Должность")
    phone = Column(String(50), comment="Телефон")
    is_active = Column(Boolean, default=True, comment="Активен")
    password_hash = Column(String(255), comment="Хэш пароля (для будущей аутентификации)")
    last_login = Column(DateTime(timezone=True), comment="Последний вход")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    department = relationship("Department", back_populates="users")
    permissions = relationship("UserPermission", back_populates="user", cascade="all, delete-orphan")
    personnel = relationship("Personnel", back_populates="user", foreign_keys="Personnel.user_id", uselist=False)


class Permission(Base):
    """Модель разрешения"""
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, index=True, nullable=False, comment="Код разрешения")
    name = Column(String(200), nullable=False, comment="Наименование")
    description = Column(Text, comment="Описание")
    module = Column(String(100), comment="Модуль")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    users = relationship("UserPermission", back_populates="permission")
    role_links = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")


class UserPermission(Base):
    """Связь пользователя с разрешениями"""
    __tablename__ = "user_permissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    permission_id = Column(Integer, ForeignKey("permissions.id"), nullable=False, index=True)
    granted = Column(Boolean, default=True, comment="Разрешено")
    granted_by = Column(String(200), comment="Выдал")
    granted_date = Column(DateTime(timezone=True), server_default=func.now(), comment="Дата выдачи")
    expires_at = Column(DateTime(timezone=True), comment="Дата истечения")
    notes = Column(Text, comment="Примечания")

    # Relationships
    user = relationship("User", back_populates="permissions")
    permission = relationship("Permission", back_populates="users")


class Role(Base):
    """Справочник ролей (динамическое создание ролей)"""
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, index=True, nullable=False, comment="Код роли")
    name = Column(String(200), nullable=False, comment="Наименование")
    description = Column(Text, comment="Описание")
    is_active = Column(Boolean, default=True, comment="Активен")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    # role_permissions ссылается на role по коду (строка), не по id


class RolePermission(Base):
    """Связь роли с разрешениями (матрица ролей и прав доступа)"""
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(100), nullable=False, index=True, comment="Код роли")
    permission_id = Column(Integer, ForeignKey("permissions.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    permission = relationship("Permission", back_populates="role_links")