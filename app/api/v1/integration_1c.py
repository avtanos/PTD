from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from decimal import Decimal
from app.db.database import get_db
from app.models.ks2 import KS2 as KS2Model, KS2Item
from app.models.ks3 import KS3 as KS3Model, KS3Item
from app.models.invoice import Invoice as InvoiceModel
from app.models.material import MaterialMovement, MaterialWriteOff as MaterialWriteOffModel
from app.models.work_volume import WorkVolume as WorkVolumeModel
from pydantic import BaseModel

router = APIRouter()


class KS2Export(BaseModel):
    """Модель для экспорта КС-2 в 1С"""
    id: int
    number: str
    date: date
    project_name: str
    customer: Optional[str]
    contractor: Optional[str]
    total_amount: Decimal
    items: List[Dict[str, Any]]


class KS3Export(BaseModel):
    """Модель для экспорта КС-3 в 1С"""
    id: int
    number: str
    date: date
    project_name: str
    customer: Optional[str]
    contractor: Optional[str]
    total_amount: Decimal
    total_vat: Decimal
    total_with_vat: Decimal
    items: List[Dict[str, Any]]


class InvoiceExport(BaseModel):
    """Модель для экспорта счета в 1С"""
    id: int
    invoice_number: str
    invoice_date: date
    contractor: Optional[str]
    total_amount: Decimal
    vat_amount: Decimal
    total_with_vat: Decimal
    paid_date: Optional[date]


class MaterialWriteOffExport(BaseModel):
    """Модель для экспорта списания материалов в 1С"""
    id: int
    write_off_number: str
    write_off_date: date
    project_name: str
    total_amount: Decimal
    items: List[Dict[str, Any]]


class PaymentImport(BaseModel):
    """Модель для импорта платежей из 1С"""
    invoice_id: int
    payment_date: date
    payment_number: str
    amount: Decimal


@router.get("/export/ks2/{ks2_id}", response_model=KS2Export)
def export_ks2_to_1c(ks2_id: int, db: Session = Depends(get_db)):
    """Экспорт КС-2 в 1С"""
    ks2 = db.query(KS2).filter(KS2.id == ks2_id).first()
    if not ks2:
        raise HTTPException(status_code=404, detail="КС-2 не найден")
    
    items = []
    for item in ks2.items:
        items.append({
            "work_name": item.work_name,
            "unit": item.unit,
            "volume_completed": str(item.volume_completed),
            "price": str(item.price) if item.price else None,
            "amount": str(item.amount) if item.amount else None
        })
    
    return KS2Export(
        id=ks2.id,
        number=ks2.number,
        date=ks2.date,
        project_name=ks2.project.name if ks2.project else "",
        customer=ks2.customer,
        contractor=ks2.contractor,
        total_amount=ks2.total_amount,
        items=items
    )


@router.get("/export/ks3/{ks3_id}", response_model=KS3Export)
def export_ks3_to_1c(ks3_id: int, db: Session = Depends(get_db)):
    """Экспорт КС-3 в 1С"""
    ks3 = db.query(KS3Model).filter(KS3Model.id == ks3_id).first()
    if not ks3:
        raise HTTPException(status_code=404, detail="КС-3 не найден")
    
    items = []
    for item in ks3.items:
        items.append({
            "work_name": item.work_name,
            "unit": item.unit,
            "volume": str(item.volume),
            "price": str(item.price) if item.price else None,
            "amount": str(item.amount) if item.amount else None,
            "vat_rate": str(item.vat_rate) if item.vat_rate else None,
            "vat_amount": str(item.vat_amount) if item.vat_amount else None,
            "amount_with_vat": str(item.amount_with_vat) if item.amount_with_vat else None
        })
    
    return KS3Export(
        id=ks3.id,
        number=ks3.number,
        date=ks3.date,
        project_name=ks3.project.name if ks3.project else "",
        customer=ks3.customer,
        contractor=ks3.contractor,
        total_amount=ks3.total_amount,
        total_vat=ks3.total_vat,
        total_with_vat=ks3.total_with_vat,
        items=items
    )


@router.get("/export/write-offs/{write_off_id}", response_model=MaterialWriteOffExport)
def export_write_off_to_1c(write_off_id: int, db: Session = Depends(get_db)):
    """Экспорт списания материалов в 1С"""
    write_off = db.query(MaterialWriteOff).filter(MaterialWriteOff.id == write_off_id).first()
    if not write_off:
        raise HTTPException(status_code=404, detail="Списание не найдено")
    
    items = []
    for item in write_off.items:
        items.append({
            "material_code": item.material.code if item.material else "",
            "material_name": item.material.name if item.material else "",
            "quantity": str(item.quantity),
            "price": str(item.price) if item.price else None,
            "amount": str(item.amount) if item.amount else None
        })
    
    return MaterialWriteOffExport(
        id=write_off.id,
        write_off_number=write_off.write_off_number,
        write_off_date=write_off.write_off_date,
        project_name=write_off.project.name if write_off.project else "",
        total_amount=write_off.total_amount,
        items=items
    )


@router.post("/import/payment")
def import_payment_from_1c(payment: PaymentImport, db: Session = Depends(get_db)):
    """Импорт платежа из 1С"""
    invoice = db.query(InvoiceModel).filter(InvoiceModel.id == payment.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Счет не найден")
    
    invoice.status = "paid"
    invoice.paid_date = payment.payment_date
    invoice.payment_number = payment.payment_number
    
    db.commit()
    return {"message": "Платеж импортирован", "invoice_id": invoice.id}


@router.get("/export/volumes/{project_id}")
def export_work_volumes_to_1c(project_id: int, db: Session = Depends(get_db)):
    """Экспорт выполненных объемов работ в 1С"""
    volumes = db.query(WorkVolumeModel).filter(WorkVolumeModel.project_id == project_id).all()
    
    result = []
    for volume in volumes:
        result.append({
            "work_code": volume.work_code,
            "work_name": volume.work_name,
            "planned_volume": str(volume.planned_volume),
            "actual_volume": str(volume.actual_volume) if volume.actual_volume else "0",
            "completed_percentage": str(volume.completed_percentage) if volume.completed_percentage else "0",
            "planned_amount": str(volume.planned_amount) if volume.planned_amount else None,
            "actual_amount": str(volume.actual_amount) if volume.actual_amount else "0"
        })
    
    return {"project_id": project_id, "volumes": result}


@router.post("/sync")
def sync_with_1c(data: Dict[str, Any], db: Session = Depends(get_db)):
    """Общая синхронизация с 1С (прием данных от 1С)"""
    # Здесь можно добавить логику синхронизации:
    # - Обновление статусов оплат
    # - Импорт справочников (контрагенты, материалы)
    # - Обновление остатков на складах
    return {"message": "Синхронизация выполнена", "received_data": data}