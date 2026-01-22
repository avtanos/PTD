from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from app.db.database import get_db
from app.models.ks2 import KS2 as KS2Model, KS2Item as KS2ItemModel
from pydantic import BaseModel
from datetime import date, datetime

router = APIRouter()


class KS2ItemBase(BaseModel):
    line_number: Optional[int] = None
    work_name: str
    unit: Optional[str] = None
    volume_estimated: Optional[Decimal] = None
    volume_completed: Decimal
    volume_total: Optional[Decimal] = None
    price: Optional[Decimal] = None
    amount: Optional[Decimal] = None
    notes: Optional[str] = None


class KS2ItemCreate(KS2ItemBase):
    pass


class KS2ItemUpdate(BaseModel):
    line_number: Optional[int] = None
    work_name: Optional[str] = None
    unit: Optional[str] = None
    volume_estimated: Optional[Decimal] = None
    volume_completed: Optional[Decimal] = None
    volume_total: Optional[Decimal] = None
    price: Optional[Decimal] = None
    amount: Optional[Decimal] = None
    notes: Optional[str] = None


class KS2Item(KS2ItemBase):
    id: int
    ks2_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class KS2Base(BaseModel):
    project_id: int
    number: str
    date: date
    period_from: Optional[date] = None
    period_to: Optional[date] = None
    customer: Optional[str] = None
    contractor: Optional[str] = None
    object_name: Optional[str] = None
    status: str = "draft"
    notes: Optional[str] = None


class KS2Create(KS2Base):
    items: List[KS2ItemCreate] = []


class KS2Update(BaseModel):
    project_id: Optional[int] = None
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
    contractor_signature: Optional[str] = None
    customer_signature: Optional[str] = None


class KS2(KS2Base):
    id: int
    total_amount: Optional[Decimal] = None
    contractor_signature: Optional[str] = None
    customer_signature: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[KS2Item] = []

    class Config:
        from_attributes = True


@router.get("/", response_model=List[KS2])
def get_ks2_forms(project_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список форм КС-2"""
    try:
        from sqlalchemy import text
        
        if project_id:
            sql = text("""
                SELECT id, project_id, number, date, period_from, period_to, customer, contractor,
                       object_name, total_amount, contractor_signature, customer_signature, status, notes,
                       created_at, updated_at
                FROM ks2
                WHERE project_id = :project_id
                LIMIT :limit OFFSET :skip
            """)
            rows = db.execute(sql, {"project_id": project_id, "limit": limit, "skip": skip}).fetchall()
        else:
            sql = text("""
                SELECT id, project_id, number, date, period_from, period_to, customer, contractor,
                       object_name, total_amount, contractor_signature, customer_signature, status, notes,
                       created_at, updated_at
                FROM ks2
                LIMIT :limit OFFSET :skip
            """)
            rows = db.execute(sql, {"limit": limit, "skip": skip}).fetchall()
        
        if not rows:
            return []
        
        result = []
        for row in rows:
            try:
                # Получаем items для этой формы
                items_sql = "SELECT id, ks2_id, line_number, work_name, unit, volume_estimated, volume_completed, volume_total, price, amount, notes, created_at FROM ks2_items WHERE ks2_id = :ks2_id"
                items_rows = db.execute(text(items_sql), {"ks2_id": row[0]}).fetchall()
                
                items = []
                for item_row in items_rows:
                    items.append({
                        "id": item_row[0],
                        "ks2_id": item_row[1],
                        "line_number": item_row[2],
                        "work_name": item_row[3],
                        "unit": item_row[4],
                        "volume_estimated": float(item_row[5]) if item_row[5] else None,
                        "volume_completed": float(item_row[6]) if item_row[6] else None,
                        "volume_total": float(item_row[7]) if item_row[7] else None,
                        "price": float(item_row[8]) if item_row[8] else None,
                        "amount": float(item_row[9]) if item_row[9] else None,
                        "notes": item_row[10],
                        "created_at": item_row[11]
                    })
                
                form_dict = {
                    "id": row[0],
                    "project_id": row[1],
                    "number": row[2],
                    "date": row[3],
                    "period_from": row[4],
                    "period_to": row[5],
                    "customer": row[6],
                    "contractor": row[7],
                    "object_name": row[8],
                    "total_amount": float(row[9]) if row[9] else None,
                    "contractor_signature": row[10],
                    "customer_signature": row[11],
                    "status": row[12] or "draft",
                    "notes": row[13],
                    "created_at": row[14],
                    "updated_at": row[15],
                    "items": items
                }
                result.append(KS2(**form_dict))
            except Exception as e:
                import traceback
                print(f"Error serializing KS2 {row[0] if row else 'unknown'}: {e}")
                traceback.print_exc()
                continue
        
        return result
    except Exception as e:
        import traceback
        print(f"Error in get_ks2_forms: {e}")
        traceback.print_exc()
        return []


@router.get("/{ks2_id}", response_model=KS2)
def get_ks2(ks2_id: int, db: Session = Depends(get_db)):
    """Получить форму КС-2 по ID"""
    ks2 = db.query(KS2Model).filter(KS2Model.id == ks2_id).first()
    if not ks2:
        raise HTTPException(status_code=404, detail="Форма КС-2 не найдена")
    
    form_dict = {
        "id": ks2.id,
        "project_id": ks2.project_id,
        "number": ks2.number,
        "date": ks2.date,
        "period_from": ks2.period_from,
        "period_to": ks2.period_to,
        "customer": ks2.customer,
        "contractor": ks2.contractor,
        "object_name": ks2.object_name,
        "status": ks2.status or "draft",
        "notes": ks2.notes,
        "total_amount": ks2.total_amount,
        "contractor_signature": ks2.contractor_signature,
        "customer_signature": ks2.customer_signature,
        "created_at": ks2.created_at,
        "updated_at": ks2.updated_at,
        "items": [
            {
                "id": item.id,
                "ks2_id": item.ks2_id,
                "line_number": item.line_number,
                "work_name": item.work_name,
                "unit": item.unit,
                "volume_estimated": item.volume_estimated,
                "volume_completed": item.volume_completed,
                "volume_total": item.volume_total,
                "price": item.price,
                "amount": item.amount,
                "notes": item.notes,
                "created_at": item.created_at
            } for item in (ks2.items or [])
        ]
    }
    return KS2(**form_dict)


@router.post("/", response_model=KS2)
def create_ks2(ks2: KS2Create, db: Session = Depends(get_db)):
    """Создать новую форму КС-2"""
    items_data = ks2.items
    ks2_data = ks2.model_dump(exclude={"items"})
    
    db_ks2 = KS2Model(**ks2_data)
    db.add(db_ks2)
    db.flush()
    
    total_amount = Decimal(0)
    for item_data in items_data:
        item = KS2ItemModel(ks2_id=db_ks2.id, **item_data.model_dump())
        db.add(item)
        if item.amount:
            total_amount += item.amount
    
    db_ks2.total_amount = total_amount
    db.commit()
    db.refresh(db_ks2)
    
    form_dict = {
        "id": db_ks2.id,
        "project_id": db_ks2.project_id,
        "number": db_ks2.number,
        "date": db_ks2.date,
        "period_from": db_ks2.period_from,
        "period_to": db_ks2.period_to,
        "customer": db_ks2.customer,
        "contractor": db_ks2.contractor,
        "object_name": db_ks2.object_name,
        "status": db_ks2.status or "draft",
        "notes": db_ks2.notes,
        "total_amount": db_ks2.total_amount,
        "contractor_signature": db_ks2.contractor_signature,
        "customer_signature": db_ks2.customer_signature,
        "created_at": db_ks2.created_at,
        "updated_at": db_ks2.updated_at,
        "items": [
            {
                "id": item.id,
                "ks2_id": item.ks2_id,
                "line_number": item.line_number,
                "work_name": item.work_name,
                "unit": item.unit,
                "volume_estimated": item.volume_estimated,
                "volume_completed": item.volume_completed,
                "volume_total": item.volume_total,
                "price": item.price,
                "amount": item.amount,
                "notes": item.notes,
                "created_at": item.created_at
            } for item in (db_ks2.items or [])
        ]
    }
    return KS2(**form_dict)


@router.put("/{ks2_id}", response_model=KS2)
def update_ks2(ks2_id: int, ks2: KS2Update, db: Session = Depends(get_db)):
    """Обновить форму КС-2"""
    db_ks2 = db.query(KS2Model).filter(KS2Model.id == ks2_id).first()
    if not db_ks2:
        raise HTTPException(status_code=404, detail="Форма КС-2 не найдена")
    
    update_data = ks2.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_ks2, field, value)
    
    db.commit()
    db.refresh(db_ks2)
    
    form_dict = {
        "id": db_ks2.id,
        "project_id": db_ks2.project_id,
        "number": db_ks2.number,
        "date": db_ks2.date,
        "period_from": db_ks2.period_from,
        "period_to": db_ks2.period_to,
        "customer": db_ks2.customer,
        "contractor": db_ks2.contractor,
        "object_name": db_ks2.object_name,
        "status": db_ks2.status or "draft",
        "notes": db_ks2.notes,
        "total_amount": db_ks2.total_amount,
        "contractor_signature": db_ks2.contractor_signature,
        "customer_signature": db_ks2.customer_signature,
        "created_at": db_ks2.created_at,
        "updated_at": db_ks2.updated_at,
        "items": [
            {
                "id": item.id,
                "ks2_id": item.ks2_id,
                "line_number": item.line_number,
                "work_name": item.work_name,
                "unit": item.unit,
                "volume_estimated": item.volume_estimated,
                "volume_completed": item.volume_completed,
                "volume_total": item.volume_total,
                "price": item.price,
                "amount": item.amount,
                "notes": item.notes,
                "created_at": item.created_at
            } for item in (db_ks2.items or [])
        ]
    }
    return KS2(**form_dict)


@router.delete("/{ks2_id}")
def delete_ks2(ks2_id: int, db: Session = Depends(get_db)):
    """Удалить форму КС-2"""
    ks2 = db.query(KS2Model).filter(KS2Model.id == ks2_id).first()
    if not ks2:
        raise HTTPException(status_code=404, detail="Форма КС-2 не найдена")
    db.delete(ks2)
    db.commit()
    return {"message": "Форма КС-2 удалена"}