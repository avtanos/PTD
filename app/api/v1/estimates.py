from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from app.db.database import get_db
from app.models.estimate import Estimate, EstimateItem, RelatedCost
from pydantic import BaseModel
from datetime import date, datetime

router = APIRouter()


class EstimateItemBase(BaseModel):
    item_type: str
    line_number: Optional[int] = None
    code: Optional[str] = None
    work_name: str
    unit: Optional[str] = None
    quantity: Decimal
    unit_price: Optional[Decimal] = None
    total_price: Optional[Decimal] = None
    materials_price: Optional[Decimal] = None
    labor_price: Optional[Decimal] = None
    equipment_price: Optional[Decimal] = None
    standard_rate_id: Optional[int] = None
    notes: Optional[str] = None


class EstimateItemCreate(EstimateItemBase):
    pass


class EstimateItem(EstimateItemBase):
    id: int
    estimate_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class RelatedCostBase(BaseModel):
    cost_type: str
    description: Optional[str] = None
    amount: Decimal
    percentage: Optional[Decimal] = None
    notes: Optional[str] = None


class RelatedCostCreate(RelatedCostBase):
    pass


class RelatedCost(RelatedCostBase):
    id: int
    estimate_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class EstimateBase(BaseModel):
    project_id: int
    estimate_type: str
    number: str
    name: str
    date: date
    version: Optional[str] = None
    base_estimate_id: Optional[int] = None
    developed_by: Optional[str] = None
    approved_by: Optional[str] = None
    file_path: Optional[str] = None
    is_active: bool = True
    notes: Optional[str] = None


class EstimateCreate(EstimateBase):
    items: List[EstimateItemCreate] = []
    related_cost_items: List[RelatedCostCreate] = []


class EstimateUpdate(BaseModel):
    project_id: Optional[int] = None
    estimate_type: Optional[str] = None
    number: Optional[str] = None
    name: Optional[str] = None
    date: Optional[date] = None
    version: Optional[str] = None
    base_estimate_id: Optional[int] = None
    developed_by: Optional[str] = None
    approved_by: Optional[str] = None
    file_path: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class Estimate(EstimateBase):
    id: int
    total_amount: Optional[Decimal] = None
    materials_cost: Optional[Decimal] = None
    labor_cost: Optional[Decimal] = None
    equipment_cost: Optional[Decimal] = None
    overhead_cost: Optional[Decimal] = None
    related_costs: Optional[Decimal] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[EstimateItem] = []
    related_cost_items: List[RelatedCost] = []

    class Config:
        from_attributes = True


@router.get("/", response_model=List[Estimate])
def get_estimates(project_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список смет"""
    query = db.query(EstimateModel)
    if project_id:
        query = query.filter(EstimateModel.project_id == project_id)
    estimates = query.offset(skip).limit(limit).all()
    return estimates


@router.get("/{estimate_id}", response_model=Estimate)
def get_estimate(estimate_id: int, db: Session = Depends(get_db)):
    """Получить смету по ID"""
    estimate = db.query(EstimateModel).filter(EstimateModel.id == estimate_id).first()
    if not estimate:
        raise HTTPException(status_code=404, detail="Смета не найдена")
    return estimate


@router.post("/", response_model=Estimate)
def create_estimate(estimate: EstimateCreate, db: Session = Depends(get_db)):
    """Создать новую смету"""
    items_data = estimate.items
    related_costs_data = estimate.related_cost_items
    estimate_data = estimate.model_dump(exclude={"items", "related_cost_items"})
    
    db_estimate = EstimateModel(**estimate_data)
    db.add(db_estimate)
    db.flush()
    
    total_materials = Decimal(0)
    total_labor = Decimal(0)
    total_equipment = Decimal(0)
    total_amount = Decimal(0)
    total_related = Decimal(0)
    
    for item_data in items_data:
        item = EstimateItem(estimate_id=db_estimate.id, **item_data.model_dump())
        db.add(item)
        if item.materials_price:
            total_materials += item.materials_price
        if item.labor_price:
            total_labor += item.labor_price
        if item.equipment_price:
            total_equipment += item.equipment_price
        if item.total_price:
            total_amount += item.total_price
    
    for cost_data in related_costs_data:
        cost = RelatedCost(estimate_id=db_estimate.id, **cost_data.model_dump())
        db.add(cost)
        total_related += cost.amount
    
    db_estimate.materials_cost = total_materials
    db_estimate.labor_cost = total_labor
    db_estimate.equipment_cost = total_equipment
    db_estimate.related_costs = total_related
    db_estimate.total_amount = total_amount + total_related
    
    db.commit()
    db.refresh(db_estimate)
    return db_estimate


@router.put("/{estimate_id}", response_model=Estimate)
def update_estimate(estimate_id: int, estimate: EstimateUpdate, db: Session = Depends(get_db)):
    """Обновить смету"""
    db_estimate = db.query(Estimate).filter(Estimate.id == estimate_id).first()
    if not db_estimate:
        raise HTTPException(status_code=404, detail="Смета не найдена")
    
    update_data = estimate.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_estimate, field, value)
    
    db.commit()
    db.refresh(db_estimate)
    return db_estimate


@router.delete("/{estimate_id}")
def delete_estimate(estimate_id: int, db: Session = Depends(get_db)):
    """Удалить смету"""
    estimate = db.query(EstimateModel).filter(EstimateModel.id == estimate_id).first()
    if not estimate:
        raise HTTPException(status_code=404, detail="Смета не найдена")
    db.delete(estimate)
    db.commit()
    return {"message": "Смета удалена"}