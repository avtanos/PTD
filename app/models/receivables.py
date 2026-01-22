from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Numeric, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class ReceivableStatus(str, enum.Enum):
    """Статусы дебиторской задолженности"""
    PENDING = "pending"  # Ожидает оплаты
    PARTIALLY_PAID = "partially_paid"  # Частично оплачено
    PAID = "paid"  # Оплачено
    OVERDUE = "overdue"  # Просрочено
    IN_COLLECTION = "in_collection"  # На взыскании
    WRITTEN_OFF = "written_off"  # Списано


class NotificationType(str, enum.Enum):
    """Типы уведомлений"""
    PAYMENT_REMINDER = "payment_reminder"  # Напоминание об оплате
    OVERDUE_NOTIFICATION = "overdue_notification"  # Уведомление о просрочке
    PAYMENT_RECEIVED = "payment_received"  # Получен платеж
    COLLECTION_ACTION = "collection_action"  # Мера по взысканию


class Receivable(Base):
    """Модель дебиторской задолженности"""
    __tablename__ = "receivables"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), comment="Связанный счет")
    customer_name = Column(String(500), nullable=False, comment="Дебитор (заказчик)")
    invoice_number = Column(String(100), comment="Номер счета")
    invoice_date = Column(Date, nullable=False, comment="Дата счета")
    due_date = Column(Date, nullable=False, comment="Срок оплаты")
    total_amount = Column(Numeric(15, 2), nullable=False, comment="Сумма задолженности")
    paid_amount = Column(Numeric(15, 2), default=0, comment="Оплачено")
    remaining_amount = Column(Numeric(15, 2), comment="Остаток задолженности")
    days_overdue = Column(Integer, default=0, comment="Дней просрочки")
    status = Column(Enum(ReceivableStatus), default=ReceivableStatus.PENDING, comment="Статус")
    last_payment_date = Column(Date, comment="Дата последнего платежа")
    responsible = Column(String(200), comment="Ответственный за взыскание")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="receivables")
    invoice = relationship("Invoice")
    payments = relationship("ReceivablePayment", back_populates="receivable", cascade="all, delete-orphan")
    notifications = relationship("ReceivableNotification", back_populates="receivable", cascade="all, delete-orphan")
    collection_actions = relationship("CollectionAction", back_populates="receivable", cascade="all, delete-orphan")


class ReceivablePayment(Base):
    """Модель платежа по дебиторской задолженности"""
    __tablename__ = "receivable_payments"

    id = Column(Integer, primary_key=True, index=True)
    receivable_id = Column(Integer, ForeignKey("receivables.id"), nullable=False, index=True)
    payment_date = Column(Date, nullable=False, comment="Дата платежа")
    payment_number = Column(String(100), comment="Номер платежного поручения")
    amount = Column(Numeric(15, 2), nullable=False, comment="Сумма платежа")
    payment_method = Column(String(100), comment="Способ оплаты")
    bank_account = Column(String(200), comment="Банковский счет")
    received_by = Column(String(200), comment="Получено кем")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    receivable = relationship("Receivable", back_populates="payments")


class ReceivableNotification(Base):
    """Модель уведомления по дебиторской задолженности"""
    __tablename__ = "receivable_notifications"

    id = Column(Integer, primary_key=True, index=True)
    receivable_id = Column(Integer, ForeignKey("receivables.id"), nullable=False, index=True)
    notification_type = Column(Enum(NotificationType), nullable=False, comment="Тип уведомления")
    notification_date = Column(DateTime(timezone=True), nullable=False, comment="Дата уведомления")
    sent_to = Column(String(500), comment="Отправлено кому")
    sent_by = Column(String(200), comment="Отправил")
    subject = Column(String(500), comment="Тема")
    message = Column(Text, comment="Сообщение")
    is_sent = Column(Boolean, default=False, comment="Отправлено")
    sent_at = Column(DateTime(timezone=True), comment="Дата отправки")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    receivable = relationship("Receivable", back_populates="notifications")


class CollectionAction(Base):
    """Модель меры по взысканию дебиторской задолженности"""
    __tablename__ = "collection_actions"

    id = Column(Integer, primary_key=True, index=True)
    receivable_id = Column(Integer, ForeignKey("receivables.id"), nullable=False, index=True)
    action_date = Column(Date, nullable=False, comment="Дата меры")
    action_type = Column(String(100), nullable=False, comment="Тип меры (letter, call, legal_action, etc.)")
    description = Column(Text, nullable=False, comment="Описание меры")
    responsible = Column(String(200), nullable=False, comment="Ответственный")
    result = Column(String(500), comment="Результат")
    next_action_date = Column(Date, comment="Дата следующей меры")
    status = Column(String(50), default="planned", comment="Статус (planned, in_progress, completed)")
    documents = Column(Text, comment="Пути к документам (JSON массив)")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    receivable = relationship("Receivable", back_populates="collection_actions")