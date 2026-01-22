from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from app.db.database import get_db
from app.models.standard_rate import StandardRate as StandardRateModel
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class StandardRateBase(BaseModel):
    code: str
    name: str
    unit: Optional[str] = None
    materials_cost: Decimal = 0
    labor_cost: Decimal = 0
    equipment_cost: Decimal = 0
    total_cost: Optional[Decimal] = None
    collection: Optional[str] = None
    section: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True


class StandardRateCreate(StandardRateBase):
    pass


class StandardRateUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    unit: Optional[str] = None
    materials_cost: Optional[Decimal] = None
    labor_cost: Optional[Decimal] = None
    equipment_cost: Optional[Decimal] = None
    total_cost: Optional[Decimal] = None
    collection: Optional[str] = None
    section: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class StandardRate(StandardRateBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/", response_model=List[StandardRate])
def get_standard_rates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список нормативных расценок"""
    rates = db.query(StandardRateModel).offset(skip).limit(limit).all()
    return rates


@router.get("/{rate_id}", response_model=StandardRate)
def get_standard_rate(rate_id: int, db: Session = Depends(get_db)):
    """Получить расценку по ID"""
    rate = db.query(StandardRate).filter(StandardRate.id == rate_id).first()
    if not rate:
        raise HTTPException(status_code=404, detail="Расценка не найдена")
    return rate


@router.post("/", response_model=StandardRate)
def create_standard_rate(rate: StandardRateCreate, db: Session = Depends(get_db)):
    """Создать нормативную расценку"""
    rate_data = rate.model_dump()
    if not rate_data.get("total_cost"):
        rate_data["total_cost"] = (rate_data.get("materials_cost", 0) + 
                                   rate_data.get("labor_cost", 0) + 
                                   rate_data.get("equipment_cost", 0))
    
    db_rate = StandardRateModel(**rate_data)
    db.add(db_rate)
    db.commit()
    db.refresh(db_rate)
    return db_rate


@router.put("/{rate_id}", response_model=StandardRate)
def update_standard_rate(rate_id: int, rate: StandardRateUpdate, db: Session = Depends(get_db)):
    """Обновить нормативную расценку"""
    db_rate = db.query(StandardRate).filter(StandardRate.id == rate_id).first()
    if not db_rate:
        raise HTTPException(status_code=404, detail="Расценка не найдена")
    
    update_data = rate.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_rate, field, value)
    
    # Пересчет total_cost если изменились компоненты
    if any(k in update_data for k in ["materials_cost", "labor_cost", "equipment_cost"]):
        db_rate.total_cost = (db_rate.materials_cost + db_rate.labor_cost + db_rate.equipment_cost)
    
    db.commit()
    db.refresh(db_rate)
    return db_rate


@router.delete("/{rate_id}")
def delete_standard_rate(rate_id: int, db: Session = Depends(get_db)):
    """Удалить нормативную расценку"""
    rate = db.query(StandardRate).filter(StandardRate.id == rate_id).first()
    if not rate:
        raise HTTPException(status_code=404, detail="Расценка не найдена")
    db.delete(rate)
    db.commit()
    return {"message": "Расценка удалена"}