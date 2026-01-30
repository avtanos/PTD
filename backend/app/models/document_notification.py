from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base

# Импортируем для type hints, но используем строковые имена в relationship
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.user import User


class NotificationType(str, enum.Enum):
    """Тип уведомления"""
    STATUS_COMPLETED = "status_completed"  # Статус изменен на "Выполнено"
    DOCUMENT_30_DAYS = "document_30_days"  # До истечения 30 дней
    DOCUMENT_7_DAYS = "document_7_days"  # До истечения 7 дней
    DOCUMENT_EXPIRED = "document_expired"  # Документ просрочен


class NotificationChannel(str, enum.Enum):
    """Канал уведомления"""
    IN_APP = "in_app"  # Внутрисистемное
    EMAIL = "email"  # Email
    PUSH = "push"  # Push-уведомление


class DocumentNotification(Base):
    """Модель уведомления по дорожной карте документов"""
    __tablename__ = "document_notifications"

    id = Column(Integer, primary_key=True, index=True)
    status_id = Column(Integer, ForeignKey("document_section_statuses.id"), nullable=False, index=True)
    notification_type = Column(Enum(NotificationType), nullable=False, comment="Тип уведомления")
    channel = Column(Enum(NotificationChannel), nullable=False, comment="Канал уведомления")
    title = Column(String(500), nullable=False, comment="Заголовок уведомления")
    message = Column(Text, nullable=False, comment="Текст уведомления")
    is_read = Column(Boolean, default=False, comment="Прочитано")
    is_sent = Column(Boolean, default=False, comment="Отправлено")
    sent_at = Column(DateTime(timezone=True), comment="Дата отправки")
    read_at = Column(DateTime(timezone=True), comment="Дата прочтения")
    recipient_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, comment="Получатель")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    status = relationship("DocumentSectionStatus", back_populates="notifications")
    recipient = relationship("User", foreign_keys=[recipient_user_id])
