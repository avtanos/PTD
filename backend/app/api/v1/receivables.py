from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from datetime import date, datetime, timedelta
from app.db.database import get_db
from app.models.receivables import (
    Receivable as ReceivableModel,
    ReceivablePayment as ReceivablePaymentModel,
    ReceivableNotification as ReceivableNotificationModel,
    CollectionAction as CollectionActionModel,
    ReceivableStatus, NotificationType
)
from app.models.invoice import Invoice as InvoiceModel
from pydantic import BaseModel

router = APIRouter()


class ReceivablePaymentBase(BaseModel):
    payment_date: date
    payment_number: Optional[str] = None
    amount: Decimal
    payment_method: Optional[str] = None
    bank_account: Optional[str] = None
    received_by: Optional[str] = None
    notes: Optional[str] = None


class ReceivablePaymentCreate(ReceivablePaymentBase):
    pass


class ReceivablePayment(ReceivablePaymentBase):
    id: int
    receivable_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ReceivableNotificationBase(BaseModel):
    notification_type: str
    notification_date: datetime
    sent_to: Optional[str] = None
    sent_by: Optional[str] = None
    subject: Optional[str] = None
    message: Optional[str] = None
    notes: Optional[str] = None


class ReceivableNotificationCreate(ReceivableNotificationBase):
    pass


class ReceivableNotification(ReceivableNotificationBase):
    id: int
    receivable_id: int
    is_sent: bool
    sent_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CollectionActionBase(BaseModel):
    action_date: date
    action_type: str
    description: str
    responsible: str
    result: Optional[str] = None
    next_action_date: Optional[date] = None
    status: str = "planned"
    documents: Optional[str] = None
    notes: Optional[str] = None


class CollectionActionCreate(CollectionActionBase):
    pass


class CollectionAction(CollectionActionBase):
    id: int
    receivable_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReceivableBase(BaseModel):
    project_id: int
    invoice_id: Optional[int] = None
    customer_name: str
    invoice_number: Optional[str] = None
    invoice_date: date
    due_date: date
    total_amount: Decimal
    responsible: Optional[str] = None
    notes: Optional[str] = None


class ReceivableCreate(ReceivableBase):
    pass


class Receivable(ReceivableBase):
    id: int
    paid_amount: Decimal
    remaining_amount: Optional[Decimal] = None
    days_overdue: int
    status: str
    last_payment_date: Optional[date] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    payments: List[ReceivablePayment] = []
    notifications: List[ReceivableNotification] = []
    collection_actions: List[CollectionAction] = []

    class Config:
        from_attributes = True


@router.get("/", response_model=List[Receivable])
def get_receivables(
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    overdue_only: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Получить список дебиторской задолженности"""
    query = db.query(ReceivableModel)
    if project_id:
        query = query.filter(ReceivableModel.project_id == project_id)
    if status:
        query = query.filter(ReceivableModel.status == status)
    if overdue_only:
        query = query.filter(ReceivableModel.days_overdue > 0)
    receivables = query.offset(skip).limit(limit).all()
    return receivables


@router.post("/", response_model=Receivable)
def create_receivable(receivable: ReceivableCreate, db: Session = Depends(get_db)):
    """Создать запись дебиторской задолженности"""
    receivable_data = receivable.model_dump()
    receivable_data["remaining_amount"] = receivable.total_amount
    receivable_data["paid_amount"] = Decimal(0)
    
    # Если указан invoice_id, берем данные из счета
    if receivable.invoice_id:
        invoice = db.query(InvoiceModel).filter(InvoiceModel.id == receivable.invoice_id).first()
        if invoice:
            receivable_data["customer_name"] = invoice.contractor or invoice.project.customer or receivable.customer_name
            receivable_data["invoice_number"] = invoice.invoice_number
            receivable_data["invoice_date"] = invoice.invoice_date
            receivable_data["total_amount"] = invoice.total_with_vat or invoice.total_amount
    
    # Расчет просрочки
    if receivable.due_date < date.today():
        receivable_data["days_overdue"] = (date.today() - receivable.due_date).days
        receivable_data["status"] = ReceivableStatus.OVERDUE
    else:
        receivable_data["days_overdue"] = 0
        receivable_data["status"] = ReceivableStatus.PENDING
    
    db_receivable = ReceivableModel(**receivable_data)
    db.add(db_receivable)
    db.commit()
    db.refresh(db_receivable)
    return db_receivable


@router.post("/{receivable_id}/payment", response_model=ReceivablePayment)
def add_payment(receivable_id: int, payment: ReceivablePaymentCreate, db: Session = Depends(get_db)):
    """Добавить платеж по дебиторской задолженности"""
    receivable = db.query(ReceivableModel).filter(ReceivableModel.id == receivable_id).first()
    if not receivable:
        raise HTTPException(status_code=404, detail="Задолженность не найдена")
    
    db_payment = ReceivablePaymentModel(receivable_id=receivable_id, **payment.model_dump())
    db.add(db_payment)
    
    # Обновление задолженности
    receivable.paid_amount += payment.amount
    receivable.remaining_amount = receivable.total_amount - receivable.paid_amount
    receivable.last_payment_date = payment.payment_date
    
    if receivable.remaining_amount <= 0:
        receivable.status = ReceivableStatus.PAID
    elif receivable.paid_amount > 0:
        receivable.status = ReceivableStatus.PARTIALLY_PAID
    
    # Обновление статуса счета
    if receivable.invoice_id:
        invoice = db.query(InvoiceModel).filter(InvoiceModel.id == receivable.invoice_id).first()
        if invoice:
            invoice.status = "paid"
            invoice.paid_date = payment.payment_date
            invoice.payment_number = payment.payment_number
    
    db.commit()
    db.refresh(db_payment)
    return db_payment


@router.post("/{receivable_id}/notification", response_model=ReceivableNotification)
def create_notification(receivable_id: int, notification: ReceivableNotificationCreate, db: Session = Depends(get_db)):
    """Создать уведомление по задолженности"""
    receivable = db.query(ReceivableModel).filter(ReceivableModel.id == receivable_id).first()
    if not receivable:
        raise HTTPException(status_code=404, detail="Задолженность не найдена")
    
    db_notification = ReceivableNotificationModel(receivable_id=receivable_id, **notification.model_dump())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification


@router.post("/{receivable_id}/collection-action", response_model=CollectionAction)
def create_collection_action(receivable_id: int, action: CollectionActionCreate, db: Session = Depends(get_db)):
    """Создать меру по взысканию"""
    receivable = db.query(ReceivableModel).filter(ReceivableModel.id == receivable_id).first()
    if not receivable:
        raise HTTPException(status_code=404, detail="Задолженность не найдена")
    
    db_action = CollectionActionModel(receivable_id=receivable_id, **action.model_dump())
    db.add(db_action)
    
    # Изменение статуса задолженности
    if action.action_type in ["legal_action", "lawsuit"]:
        receivable.status = ReceivableStatus.IN_COLLECTION
    
    db.commit()
    db.refresh(db_action)
    return db_action


@router.get("/{receivable_id}/analytics")
def get_receivable_analytics(receivable_id: int, db: Session = Depends(get_db)):
    """Получить аналитику по задолженности"""
    receivable = db.query(ReceivableModel).filter(ReceivableModel.id == receivable_id).first()
    if not receivable:
        raise HTTPException(status_code=404, detail="Задолженность не найдена")
    
    total_payments = db.query(ReceivablePaymentModel).filter(
        ReceivablePaymentModel.receivable_id == receivable_id
    ).count()
    
    total_notifications = db.query(ReceivableNotificationModel).filter(
        ReceivableNotificationModel.receivable_id == receivable_id
    ).count()
    
    total_collection_actions = db.query(CollectionActionModel).filter(
        CollectionActionModel.receivable_id == receivable_id
    ).count()
    
    return {
        "receivable_id": receivable.id,
        "total_amount": str(receivable.total_amount),
        "paid_amount": str(receivable.paid_amount),
        "remaining_amount": str(receivable.remaining_amount or 0),
        "payment_percentage": str((receivable.paid_amount / receivable.total_amount * 100) if receivable.total_amount > 0 else 0),
        "days_overdue": receivable.days_overdue,
        "status": receivable.status,
        "total_payments": total_payments,
        "total_notifications": total_notifications,
        "total_collection_actions": total_collection_actions
    }


@router.get("/analytics/overview")
def get_receivables_overview(db: Session = Depends(get_db)):
    """Получить общую аналитику по дебиторской задолженности"""
    all_receivables = db.query(ReceivableModel).all()
    
    total_amount = sum(r.total_amount for r in all_receivables)
    total_paid = sum(r.paid_amount for r in all_receivables)
    total_remaining = total_amount - total_paid
    
    overdue_count = sum(1 for r in all_receivables if r.days_overdue > 0)
    overdue_amount = sum(r.remaining_amount or 0 for r in all_receivables if r.days_overdue > 0)
    
    return {
        "total_receivables": len(all_receivables),
        "total_amount": str(total_amount),
        "total_paid": str(total_paid),
        "total_remaining": str(total_remaining),
        "overdue_count": overdue_count,
        "overdue_amount": str(overdue_amount),
        "payment_percentage": str((total_paid / total_amount * 100) if total_amount > 0 else 0)
    }