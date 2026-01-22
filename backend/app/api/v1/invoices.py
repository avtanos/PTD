from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from app.db.database import get_db
from app.models.invoice import Invoice as InvoiceModel
from pydantic import BaseModel
from datetime import date, datetime

router = APIRouter()


class InvoiceBase(BaseModel):
    project_id: int
    ks3_id: Optional[int] = None
    invoice_number: str
    invoice_date: date
    contractor: Optional[str] = None
    total_amount: Decimal
    vat_amount: Decimal = 0
    total_with_vat: Optional[Decimal] = None
    payment_terms: Optional[str] = None
    due_date: Optional[date] = None
    status: str = "draft"
    verified_by: Optional[str] = None
    verified_date: Optional[date] = None
    approved_by: Optional[str] = None
    approved_date: Optional[date] = None
    paid_date: Optional[date] = None
    payment_number: Optional[str] = None
    notes: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceUpdate(BaseModel):
    project_id: Optional[int] = None
    ks3_id: Optional[int] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    contractor: Optional[str] = None
    total_amount: Optional[Decimal] = None
    vat_amount: Optional[Decimal] = None
    total_with_vat: Optional[Decimal] = None
    payment_terms: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    verified_by: Optional[str] = None
    verified_date: Optional[date] = None
    approved_by: Optional[str] = None
    approved_date: Optional[date] = None
    paid_date: Optional[date] = None
    payment_number: Optional[str] = None
    notes: Optional[str] = None


class Invoice(InvoiceBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/", response_model=List[Invoice])
def get_invoices(project_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список счетов"""
    query = db.query(InvoiceModel)
    if project_id:
        query = query.filter(InvoiceModel.project_id == project_id)
    invoices = query.offset(skip).limit(limit).all()
    return invoices


@router.get("/{invoice_id}", response_model=Invoice)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Получить счет по ID"""
    invoice = db.query(InvoiceModel).filter(InvoiceModel.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Счет не найден")
    return invoice


@router.post("/", response_model=Invoice)
def create_invoice(invoice: InvoiceCreate, db: Session = Depends(get_db)):
    """Создать новый счет"""
    invoice_data = invoice.model_dump()
    if not invoice_data.get("total_with_vat") and invoice_data.get("total_amount") and invoice_data.get("vat_amount"):
        invoice_data["total_with_vat"] = invoice_data["total_amount"] + invoice_data["vat_amount"]
    
    db_invoice = InvoiceModel(**invoice_data)
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice


@router.put("/{invoice_id}", response_model=Invoice)
def update_invoice(invoice_id: int, invoice: InvoiceUpdate, db: Session = Depends(get_db)):
    """Обновить счет"""
    db_invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Счет не найден")
    
    update_data = invoice.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_invoice, field, value)
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice


@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Удалить счет"""
    invoice = db.query(InvoiceModel).filter(InvoiceModel.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Счет не найден")
    db.delete(invoice)
    db.commit()
    return {"message": "Счет удален"}