from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal

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
    stage_id: Optional[int] = None  # Этап проекта (опционально, для иерархии)
    estimate_type: str
    number: str
    name: str
    date: date
    version: Optional[str] = None
    base_estimate_id: Optional[int] = None
    developed_by: Optional[str] = None
    approved_by: Optional[str] = None
    file_path: Optional[str] = None
    status: Optional[str] = "draft"
    is_active: bool = True
    notes: Optional[str] = None

class EstimateCreate(EstimateBase):
    items: List[EstimateItemCreate] = []
    related_cost_items: List[RelatedCostCreate] = []

class EstimateUpdate(BaseModel):
    project_id: Optional[int] = None
    stage_id: Optional[int] = None
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
    items: Optional[List[EstimateItemCreate]] = None
    related_cost_items: Optional[List[RelatedCostCreate]] = None

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
