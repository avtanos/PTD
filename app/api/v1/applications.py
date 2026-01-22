from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from app.db.database import get_db
from app.models.application import Application as ApplicationModel, ApplicationItem
from pydantic import BaseModel
from datetime import date, datetime

router = APIRouter()


class ApplicationItemBase(BaseModel):
    line_number: Optional[int] = None
    material_name: str
    specification: Optional[str] = None
    unit: Optional[str] = None
    quantity: Decimal
    price: Optional[Decimal] = None
    amount: Optional[Decimal] = None
    delivery_date: Optional[date] = None
    notes: Optional[str] = None


class ApplicationItemCreate(ApplicationItemBase):
    pass


class ApplicationItem(ApplicationItemBase):
    id: int
    application_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ApplicationBase(BaseModel):
    project_id: int
    application_type: str  # materials, equipment, services, other
    number: str
    date: date
    requested_by: Optional[str] = None
    department: Optional[str] = None
    status: str = "draft"  # draft, submitted, in_process, approved, rejected, completed
    description: Optional[str] = None
    warehouse: Optional[str] = None
    notes: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    items: List[ApplicationItemCreate] = []


class ApplicationUpdate(BaseModel):
    project_id: Optional[int] = None
    application_type: Optional[str] = None
    number: Optional[str] = None
    date: Optional[date] = None
    requested_by: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    warehouse: Optional[str] = None
    notes: Optional[str] = None
    approved_by: Optional[str] = None
    approval_date: Optional[date] = None


class Application(ApplicationBase):
    id: int
    total_amount: Optional[Decimal] = None
    approved_by: Optional[str] = None
    approval_date: Optional[date] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[ApplicationItem] = []

    class Config:
        from_attributes = True


@router.get("/", response_model=List[Application])
def get_applications(project_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список заявок"""
    query = db.query(ApplicationModel)
    if project_id:
        query = query.filter(ApplicationModel.project_id == project_id)
    applications = query.offset(skip).limit(limit).all()
    return applications


@router.get("/{application_id}", response_model=Application)
def get_application(application_id: int, db: Session = Depends(get_db)):
    """Получить заявку по ID"""
    application = db.query(ApplicationModel).filter(ApplicationModel.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    return application


@router.post("/", response_model=Application)
def create_application(application: ApplicationCreate, db: Session = Depends(get_db)):
    """Создать новую заявку"""
    items_data = application.items
    app_data = application.model_dump(exclude={"items"})
    
    db_application = ApplicationModel(**app_data)
    db.add(db_application)
    db.flush()
    
    total_amount = Decimal(0)
    for item_data in items_data:
        item = ApplicationItem(application_id=db_application.id, **item_data.model_dump())
        db.add(item)
        if item.amount:
            total_amount += item.amount
    
    db_application.total_amount = total_amount
    db.commit()
    db.refresh(db_application)
    return db_application


@router.put("/{application_id}", response_model=Application)
def update_application(application_id: int, application: ApplicationUpdate, db: Session = Depends(get_db)):
    """Обновить заявку"""
    db_application = db.query(ApplicationModel).filter(ApplicationModel.id == application_id).first()
    if not db_application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    update_data = application.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_application, field, value)
    
    db.commit()
    db.refresh(db_application)
    return db_application


@router.delete("/{application_id}")
def delete_application(application_id: int, db: Session = Depends(get_db)):
    """Удалить заявку"""
    application = db.query(ApplicationModel).filter(ApplicationModel.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    db.delete(application)
    db.commit()
    return {"message": "Заявка удалена"}