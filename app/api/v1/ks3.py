from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from app.db.database import get_db
from app.models.ks3 import KS3 as KS3Model, KS3Item as KS3ItemModel
from pydantic import BaseModel
from datetime import date, datetime

router = APIRouter()


class KS3ItemBase(BaseModel):
    line_number: Optional[int] = None
    work_name: str
    unit: Optional[str] = None
    volume: Decimal
    price: Optional[Decimal] = None
    amount: Optional[Decimal] = None
    vat_rate: Decimal = Decimal("20.00")
    vat_amount: Optional[Decimal] = None
    amount_with_vat: Optional[Decimal] = None
    notes: Optional[str] = None


class KS3ItemCreate(KS3ItemBase):
    pass


class KS3ItemUpdate(BaseModel):
    line_number: Optional[int] = None
    work_name: Optional[str] = None
    unit: Optional[str] = None
    volume: Optional[Decimal] = None
    price: Optional[Decimal] = None
    amount: Optional[Decimal] = None
    vat_rate: Optional[Decimal] = None
    vat_amount: Optional[Decimal] = None
    amount_with_vat: Optional[Decimal] = None
    notes: Optional[str] = None


class KS3Item(KS3ItemBase):
    id: int
    ks3_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class KS3Base(BaseModel):
    project_id: int
    ks2_id: Optional[int] = None
    number: str
    date: date
    period_from: Optional[date] = None
    period_to: Optional[date] = None
    customer: Optional[str] = None
    contractor: Optional[str] = None
    object_name: Optional[str] = None
    status: str = "draft"
    notes: Optional[str] = None


class KS3Create(KS3Base):
    items: List[KS3ItemCreate] = []


class KS3Update(BaseModel):
    project_id: Optional[int] = None
    ks2_id: Optional[int] = None
    number: Optional[str] = None
    date: Optional[date] = None
    period_from: Optional[date] = None
    period_to: Optional[date] = None
    customer: Optional[str] = None
    contractor: Optional[str] = None
    object_name: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    total_amount: Optional[Decimal] = None
    total_vat: Optional[Decimal] = None
    total_with_vat: Optional[Decimal] = None
    contractor_signature: Optional[str] = None
    customer_signature: Optional[str] = None


class KS3(KS3Base):
    id: int
    total_amount: Optional[Decimal] = None
    total_vat: Optional[Decimal] = None
    total_with_vat: Optional[Decimal] = None
    contractor_signature: Optional[str] = None
    customer_signature: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[KS3Item] = []

    class Config:
        from_attributes = True


@router.get("/", response_model=List[KS3])
def get_ks3_forms(project_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список форм КС-3"""
    try:
        from sqlalchemy import text
        
        if project_id:
            sql = text("""
                SELECT id, project_id, ks2_id, number, date, period_from, period_to, customer, contractor,
                       object_name, total_amount, total_vat, total_with_vat, contractor_signature, customer_signature, status, notes,
                       created_at, updated_at
                FROM ks3
                WHERE project_id = :project_id
                LIMIT :limit OFFSET :skip
            """)
            rows = db.execute(sql, {"project_id": project_id, "limit": limit, "skip": skip}).fetchall()
        else:
            sql = text("""
                SELECT id, project_id, ks2_id, number, date, period_from, period_to, customer, contractor,
                       object_name, total_amount, total_vat, total_with_vat, contractor_signature, customer_signature, status, notes,
                       created_at, updated_at
                FROM ks3
                LIMIT :limit OFFSET :skip
            """)
            rows = db.execute(sql, {"limit": limit, "skip": skip}).fetchall()
        
        if not rows:
            return []
        
        result = []
        for row in rows:
            try:
                # Получаем items для этой формы
                items_sql = text("SELECT id, ks3_id, line_number, work_name, unit, volume, price, amount, vat_rate, vat_amount, amount_with_vat, notes, created_at FROM ks3_items WHERE ks3_id = :ks3_id")
                items_rows = db.execute(items_sql, {"ks3_id": row[0]}).fetchall()
                
                items = []
                for item_row in items_rows:
                    items.append({
                        "id": item_row[0],
                        "ks3_id": item_row[1],
                        "line_number": item_row[2],
                        "work_name": item_row[3],
                        "unit": item_row[4],
                        "volume": float(item_row[5]) if item_row[5] else None,
                        "price": float(item_row[6]) if item_row[6] else None,
                        "amount": float(item_row[7]) if item_row[7] else None,
                        "vat_rate": float(item_row[8]) if item_row[8] else None,
                        "vat_amount": float(item_row[9]) if item_row[9] else None,
                        "amount_with_vat": float(item_row[10]) if item_row[10] else None,
                        "notes": item_row[11],
                        "created_at": item_row[12]
                    })
                
                form_dict = {
                    "id": row[0],
                    "project_id": row[1],
                    "ks2_id": row[2],
                    "number": row[3],
                    "date": row[4],
                    "period_from": row[5],
                    "period_to": row[6],
                    "customer": row[7],
                    "contractor": row[8],
                    "object_name": row[9],
                    "total_amount": float(row[10]) if row[10] else None,
                    "total_vat": float(row[11]) if row[11] else None,
                    "total_with_vat": float(row[12]) if row[12] else None,
                    "contractor_signature": row[13],
                    "customer_signature": row[14],
                    "status": row[15] or "draft",
                    "notes": row[16],
                    "created_at": row[17],
                    "updated_at": row[18],
                    "items": items
                }
                result.append(KS3(**form_dict))
            except Exception as e:
                import traceback
                print(f"Error serializing KS3 {row[0] if row else 'unknown'}: {e}")
                traceback.print_exc()
                continue
        
        return result
    except Exception as e:
        import traceback
        print(f"Error in get_ks3_forms: {e}")
        traceback.print_exc()
        return []


@router.get("/{ks3_id}", response_model=KS3)
def get_ks3(ks3_id: int, db: Session = Depends(get_db)):
    """Получить форму КС-3 по ID"""
    ks3 = db.query(KS3Model).filter(KS3Model.id == ks3_id).first()
    if not ks3:
        raise HTTPException(status_code=404, detail="Форма КС-3 не найдена")
    
    form_dict = {
        "id": ks3.id,
        "project_id": ks3.project_id,
        "ks2_id": ks3.ks2_id,
        "number": ks3.number,
        "date": ks3.date,
        "period_from": ks3.period_from,
        "period_to": ks3.period_to,
        "customer": ks3.customer,
        "contractor": ks3.contractor,
        "object_name": ks3.object_name,
        "status": ks3.status or "draft",
        "notes": ks3.notes,
        "total_amount": ks3.total_amount,
        "total_vat": ks3.total_vat,
        "total_with_vat": ks3.total_with_vat,
        "contractor_signature": ks3.contractor_signature,
        "customer_signature": ks3.customer_signature,
        "created_at": ks3.created_at,
        "updated_at": ks3.updated_at,
        "items": [
            {
                "id": item.id,
                "ks3_id": item.ks3_id,
                "line_number": item.line_number,
                "work_name": item.work_name,
                "unit": item.unit,
                "volume": item.volume,
                "price": item.price,
                "amount": item.amount,
                "vat_rate": item.vat_rate,
                "vat_amount": item.vat_amount,
                "amount_with_vat": item.amount_with_vat,
                "notes": item.notes,
                "created_at": item.created_at
            } for item in (ks3.items or [])
        ]
    }
    return KS3(**form_dict)


@router.post("/", response_model=KS3)
def create_ks3(ks3: KS3Create, db: Session = Depends(get_db)):
    """Создать новую форму КС-3"""
    items_data = ks3.items
    ks3_data = ks3.model_dump(exclude={"items"})
    
    db_ks3 = KS3Model(**ks3_data)
    db.add(db_ks3)
    db.flush()
    
    total_amount = Decimal(0)
    total_vat = Decimal(0)
    
    for item_data in items_data:
        item_dict = item_data.model_dump()
        if item_dict.get("amount") and not item_dict.get("vat_amount"):
            # Автоматический расчет НДС
            amount = item_dict["amount"]
            vat_rate = item_dict.get("vat_rate", Decimal("20.00"))
            vat_amount = amount * vat_rate / (100 + vat_rate)
            item_dict["vat_amount"] = vat_amount
            item_dict["amount_with_vat"] = amount
        
        item = KS3ItemModel(ks3_id=db_ks3.id, **item_dict)
        db.add(item)
        if item.amount:
            total_amount += item.amount
        if item.vat_amount:
            total_vat += item.vat_amount
    
    db_ks3.total_amount = total_amount
    db_ks3.total_vat = total_vat
    db_ks3.total_with_vat = total_amount + total_vat
    db.commit()
    db.refresh(db_ks3)
    
    form_dict = {
        "id": db_ks3.id,
        "project_id": db_ks3.project_id,
        "ks2_id": db_ks3.ks2_id,
        "number": db_ks3.number,
        "date": db_ks3.date,
        "period_from": db_ks3.period_from,
        "period_to": db_ks3.period_to,
        "customer": db_ks3.customer,
        "contractor": db_ks3.contractor,
        "object_name": db_ks3.object_name,
        "status": db_ks3.status or "draft",
        "notes": db_ks3.notes,
        "total_amount": db_ks3.total_amount,
        "total_vat": db_ks3.total_vat,
        "total_with_vat": db_ks3.total_with_vat,
        "contractor_signature": db_ks3.contractor_signature,
        "customer_signature": db_ks3.customer_signature,
        "created_at": db_ks3.created_at,
        "updated_at": db_ks3.updated_at,
        "items": [
            {
                "id": item.id,
                "ks3_id": item.ks3_id,
                "line_number": item.line_number,
                "work_name": item.work_name,
                "unit": item.unit,
                "volume": item.volume,
                "price": item.price,
                "amount": item.amount,
                "vat_rate": item.vat_rate,
                "vat_amount": item.vat_amount,
                "amount_with_vat": item.amount_with_vat,
                "notes": item.notes,
                "created_at": item.created_at
            } for item in (db_ks3.items or [])
        ]
    }
    return KS3(**form_dict)


@router.put("/{ks3_id}", response_model=KS3)
def update_ks3(ks3_id: int, ks3: KS3Update, db: Session = Depends(get_db)):
    """Обновить форму КС-3"""
    db_ks3 = db.query(KS3Model).filter(KS3Model.id == ks3_id).first()
    if not db_ks3:
        raise HTTPException(status_code=404, detail="Форма КС-3 не найдена")
    
    update_data = ks3.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_ks3, field, value)
    
    db.commit()
    db.refresh(db_ks3)
    
    form_dict = {
        "id": db_ks3.id,
        "project_id": db_ks3.project_id,
        "ks2_id": db_ks3.ks2_id,
        "number": db_ks3.number,
        "date": db_ks3.date,
        "period_from": db_ks3.period_from,
        "period_to": db_ks3.period_to,
        "customer": db_ks3.customer,
        "contractor": db_ks3.contractor,
        "object_name": db_ks3.object_name,
        "status": db_ks3.status or "draft",
        "notes": db_ks3.notes,
        "total_amount": db_ks3.total_amount,
        "total_vat": db_ks3.total_vat,
        "total_with_vat": db_ks3.total_with_vat,
        "contractor_signature": db_ks3.contractor_signature,
        "customer_signature": db_ks3.customer_signature,
        "created_at": db_ks3.created_at,
        "updated_at": db_ks3.updated_at,
        "items": [
            {
                "id": item.id,
                "ks3_id": item.ks3_id,
                "line_number": item.line_number,
                "work_name": item.work_name,
                "unit": item.unit,
                "volume": item.volume,
                "price": item.price,
                "amount": item.amount,
                "vat_rate": item.vat_rate,
                "vat_amount": item.vat_amount,
                "amount_with_vat": item.amount_with_vat,
                "notes": item.notes,
                "created_at": item.created_at
            } for item in (db_ks3.items or [])
        ]
    }
    return KS3(**form_dict)


@router.delete("/{ks3_id}")
def delete_ks3(ks3_id: int, db: Session = Depends(get_db)):
    """Удалить форму КС-3"""
    ks3 = db.query(KS3Model).filter(KS3Model.id == ks3_id).first()
    if not ks3:
        raise HTTPException(status_code=404, detail="Форма КС-3 не найдена")
    db.delete(ks3)
    db.commit()
    return {"message": "Форма КС-3 удалена"}