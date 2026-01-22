from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from app.db.database import get_db
from app.models.material import (
    Material as MaterialModel, Warehouse as WarehouseModel,
    WarehouseStock as WarehouseStockModel, MaterialMovement as MaterialMovementModel,
    MaterialWriteOff as MaterialWriteOffModel, MaterialWriteOffItem as MaterialWriteOffItemModel
)
from pydantic import BaseModel
from datetime import date, datetime

router = APIRouter()


# Material schemas
class MaterialBase(BaseModel):
    code: str
    name: str
    material_type: str
    unit: str
    specification: Optional[str] = None
    standard_price: Optional[Decimal] = None
    is_active: bool = True
    notes: Optional[str] = None


class MaterialCreate(MaterialBase):
    pass


class Material(MaterialBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Warehouse schemas
class WarehouseBase(BaseModel):
    code: str
    name: str
    location: Optional[str] = None
    responsible: Optional[str] = None
    is_active: bool = True
    notes: Optional[str] = None


class WarehouseCreate(WarehouseBase):
    pass


class Warehouse(WarehouseBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# WarehouseStock schema
class WarehouseStock(BaseModel):
    id: int
    warehouse_id: int
    material_id: int
    quantity: Decimal
    reserved_quantity: Decimal
    last_movement_date: Optional[datetime] = None

    class Config:
        from_attributes = True


# MaterialMovement schemas
class MaterialMovementBase(BaseModel):
    movement_type: str
    movement_number: str
    movement_date: date
    material_id: int
    quantity: Decimal
    price: Optional[Decimal] = None
    from_warehouse_id: Optional[int] = None
    to_warehouse_id: Optional[int] = None
    project_id: Optional[int] = None
    application_id: Optional[int] = None
    supplier: Optional[str] = None
    batch_number: Optional[str] = None
    receipt_date: Optional[date] = None
    responsible: Optional[str] = None
    notes: Optional[str] = None


class MaterialMovementCreate(MaterialMovementBase):
    pass


class MaterialMovement(MaterialMovementBase):
    id: int
    amount: Optional[Decimal] = None
    created_at: datetime

    class Config:
        from_attributes = True


# MaterialWriteOff schemas
class MaterialWriteOffItemBase(BaseModel):
    material_id: int
    movement_id: Optional[int] = None
    line_number: Optional[int] = None
    quantity: Decimal
    price: Optional[Decimal] = None
    batch_number: Optional[str] = None
    notes: Optional[str] = None


class MaterialWriteOffItemCreate(MaterialWriteOffItemBase):
    pass


class MaterialWriteOffItem(MaterialWriteOffItemBase):
    id: int
    write_off_id: int
    amount: Optional[Decimal] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MaterialWriteOffBase(BaseModel):
    write_off_number: str
    write_off_date: date
    project_id: int
    work_volume_id: Optional[int] = None
    warehouse_id: Optional[int] = None
    reason: str
    description: Optional[str] = None
    responsible: str
    approved_by: Optional[str] = None
    notes: Optional[str] = None


class MaterialWriteOffCreate(MaterialWriteOffBase):
    items: List[MaterialWriteOffItemCreate] = []


class MaterialWriteOff(MaterialWriteOffBase):
    id: int
    approved_date: Optional[date] = None
    status: str
    total_amount: Decimal
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[MaterialWriteOffItem] = []

    class Config:
        from_attributes = True


# Material endpoints
@router.get("/materials/", response_model=List[Material])
def get_materials(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список материалов"""
    materials = db.query(MaterialModel).offset(skip).limit(limit).all()
    return materials


@router.post("/materials/", response_model=Material)
def create_material(material: MaterialCreate, db: Session = Depends(get_db)):
    """Создать материал"""
    db_material = MaterialModel(**material.model_dump())
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material


# Warehouse endpoints
@router.get("/warehouses/", response_model=List[Warehouse])
def get_warehouses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список складов"""
    warehouses = db.query(WarehouseModel).offset(skip).limit(limit).all()
    return warehouses


@router.post("/warehouses/", response_model=Warehouse)
def create_warehouse(warehouse: WarehouseCreate, db: Session = Depends(get_db)):
    """Создать склад"""
    db_warehouse = WarehouseModel(**warehouse.model_dump())
    db.add(db_warehouse)
    db.commit()
    db.refresh(db_warehouse)
    return db_warehouse


@router.get("/warehouses/{warehouse_id}/stocks", response_model=List[WarehouseStock])
def get_warehouse_stocks(warehouse_id: int, db: Session = Depends(get_db)):
    """Получить остатки на складе"""
    stocks = db.query(WarehouseStockModel).filter(WarehouseStockModel.warehouse_id == warehouse_id).all()
    return stocks


# Movement endpoints
@router.post("/movements/", response_model=MaterialMovement)
def create_movement(movement: MaterialMovementCreate, db: Session = Depends(get_db)):
    """Создать движение материалов"""
    movement_data = movement.model_dump()
    if movement_data.get("price") and movement_data.get("quantity"):
        movement_data["amount"] = movement_data["price"] * movement_data["quantity"]
    
    db_movement = MaterialMovementModel(**movement_data)
    db.add(db_movement)
    
    # Обновление остатков на складе
    if movement.to_warehouse_id:
        stock = db.query(WarehouseStockModel).filter(
            WarehouseStockModel.warehouse_id == movement.to_warehouse_id,
            WarehouseStockModel.material_id == movement.material_id
        ).first()
        if stock:
            stock.quantity += movement.quantity
            stock.last_movement_date = datetime.now()
        else:
            stock = WarehouseStockModel(
                warehouse_id=movement.to_warehouse_id,
                material_id=movement.material_id,
                quantity=movement.quantity,
                last_movement_date=datetime.now()
            )
            db.add(stock)
    
    if movement.from_warehouse_id:
        stock = db.query(WarehouseStockModel).filter(
            WarehouseStockModel.warehouse_id == movement.from_warehouse_id,
            WarehouseStockModel.material_id == movement.material_id
        ).first()
        if stock:
            stock.quantity -= movement.quantity
            stock.last_movement_date = datetime.now()
    
    db.commit()
    db.refresh(db_movement)
    return db_movement


# Write-off endpoints
@router.get("/write-offs/", response_model=List[MaterialWriteOff])
def get_write_offs(project_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список списаний"""
    query = db.query(MaterialWriteOffModel)
    if project_id:
        query = query.filter(MaterialWriteOffModel.project_id == project_id)
    write_offs = query.offset(skip).limit(limit).all()
    return write_offs


@router.post("/write-offs/", response_model=MaterialWriteOff)
def create_write_off(write_off: MaterialWriteOffCreate, db: Session = Depends(get_db)):
    """Создать списание материалов"""
    items_data = write_off.items
    write_off_data = write_off.model_dump(exclude={"items"})
    
    db_write_off = MaterialWriteOffModel(**write_off_data)
    db.add(db_write_off)
    db.flush()
    
    total_amount = Decimal(0)
    for item_data in items_data:
        item_dict = item_data.model_dump()
        if not item_dict.get("amount") and item_dict.get("price") and item_dict.get("quantity"):
            item_dict["amount"] = item_dict["price"] * item_dict["quantity"]
        item = MaterialWriteOffItemModel(write_off_id=db_write_off.id, **item_dict)
        db.add(item)
        if item.amount:
            total_amount += item.amount
        
        # Обновление остатков на складе
        if db_write_off.warehouse_id:
            stock = db.query(WarehouseStockModel).filter(
                WarehouseStockModel.warehouse_id == db_write_off.warehouse_id,
                WarehouseStockModel.material_id == item.material_id
            ).first()
            if stock:
                stock.quantity -= item.quantity
                stock.last_movement_date = datetime.now()
    
    db_write_off.total_amount = total_amount
    db.commit()
    db.refresh(db_write_off)
    return db_write_off