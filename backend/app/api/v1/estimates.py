from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from app.db.database import get_db
from app.models.estimate import Estimate as EstimateModel, EstimateItem as EstimateItemModel, RelatedCost as RelatedCostModel
from app.schemas.estimate import Estimate, EstimateCreate, EstimateUpdate
from datetime import date, datetime

router = APIRouter()

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
    """Создать новую смету (объектно-центрированный подход)"""
    # Валидация: если указан stage_id, проверяем что этап принадлежит проекту
    if estimate.stage_id:
        from app.models.project_stage import ProjectStage
        stage = db.query(ProjectStage).filter(ProjectStage.id == estimate.stage_id).first()
        if not stage:
            raise HTTPException(status_code=404, detail="Этап не найден")
        if stage.project_id != estimate.project_id:
            raise HTTPException(status_code=400, detail="Этап не принадлежит указанному проекту")
    
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
        item = EstimateItemModel(estimate_id=db_estimate.id, **item_data.model_dump())
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
        cost = RelatedCostModel(estimate_id=db_estimate.id, **cost_data.model_dump())
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
    db_estimate = db.query(EstimateModel).filter(EstimateModel.id == estimate_id).first()
    if not db_estimate:
        raise HTTPException(status_code=404, detail="Смета не найдена")
    
    update_data = estimate.model_dump(exclude_unset=True, exclude={"items", "related_cost_items"})
    for field, value in update_data.items():
        setattr(db_estimate, field, value)
    
    # Update items if provided
    if estimate.items is not None:
        # Delete existing items
        db.query(EstimateItemModel).filter(EstimateItemModel.estimate_id == estimate_id).delete()
        
        # Add new items
        total_materials = Decimal(0)
        total_labor = Decimal(0)
        total_equipment = Decimal(0)
        total_amount = Decimal(0)
        
        for item_data in estimate.items:
            item = EstimateItemModel(estimate_id=estimate_id, **item_data.model_dump())
            db.add(item)
            if item.materials_price:
                total_materials += item.materials_price
            if item.labor_price:
                total_labor += item.labor_price
            if item.equipment_price:
                total_equipment += item.equipment_price
            if item.total_price:
                total_amount += item.total_price
                
        db_estimate.materials_cost = total_materials
        db_estimate.labor_cost = total_labor
        db_estimate.equipment_cost = total_equipment
        # Note: related costs need to be added to total_amount separately if not updating related_cost_items
        
    # Update related costs if provided
    if estimate.related_cost_items is not None:
        # Delete existing related costs
        db.query(RelatedCostModel).filter(RelatedCostModel.estimate_id == estimate_id).delete()
        
        # Add new related costs
        total_related = Decimal(0)
        for cost_data in estimate.related_cost_items:
            cost = RelatedCostModel(estimate_id=estimate_id, **cost_data.model_dump())
            db.add(cost)
            total_related += cost.amount
            
        db_estimate.related_costs = total_related

    # Recalculate total amount
    db.flush()
    db.refresh(db_estimate)
    
    # Recalculate if we only updated one list but not the other, we need current values
    current_items_total = sum([item.total_price or 0 for item in db_estimate.items])
    current_related_total = sum([cost.amount or 0 for cost in db_estimate.related_cost_items])
    
    db_estimate.total_amount = current_items_total + current_related_total

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
