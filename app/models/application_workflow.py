from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class ApprovalStatus(str, enum.Enum):
    """Статусы согласования"""
    PENDING = "pending"  # Ожидает
    APPROVED = "approved"  # Согласовано
    REJECTED = "rejected"  # Отклонено
    CANCELLED = "cancelled"  # Отменено


class ApplicationWorkflow(Base):
    """Модель workflow согласования заявки"""
    __tablename__ = "application_workflows"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    order_number = Column(Integer, nullable=False, comment="Порядковый номер этапа")
    approver_role = Column(String(100), nullable=False, comment="Роль согласующего")
    approver_name = Column(String(200), comment="Имя согласующего")
    approver_department = Column(String(200), comment="Подразделение согласующего")
    status = Column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING, comment="Статус согласования")
    comment = Column(Text, comment="Комментарий")
    approved_date = Column(DateTime(timezone=True), comment="Дата согласования")
    is_parallel = Column(Boolean, default=False, comment="Параллельное согласование")
    is_required = Column(Boolean, default=True, comment="Обязательное согласование")
    notification_sent = Column(Boolean, default=False, comment="Уведомление отправлено")
    notification_date = Column(DateTime(timezone=True), comment="Дата отправки уведомления")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    application = relationship("Application", back_populates="workflow")