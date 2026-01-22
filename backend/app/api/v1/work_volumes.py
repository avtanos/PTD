from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from app.db.database import get_db
from app.models.work_volume import WorkVolume as WorkVolumeModel, WorkVolumeEntry as WorkVolumeEntryModel
from pydantic import BaseModel
from datetime import date, datetime

router = APIRouter()


class WorkVolumeEntryBase(BaseModel):
    entry_date: date
    actual_volume: Decimal
    location: Optional[str] = None
    entered_by: Optional[str] = None
    contractor_id: Optional[int] = None
    survey_id: Optional[int] = None
    photos: Optional[str] = None
    notes: Optional[str] = None


class WorkVolumeEntryCreate(WorkVolumeEntryBase):
    pass


class WorkVolumeEntry(WorkVolumeEntryBase):
    id: int
    work_volume_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class WorkVolumeBase(BaseModel):
    project_id: int
    construct_id: Optional[int] = None
    work_code: Optional[str] = None
    work_name: str
    unit: Optional[str] = None
    planned_volume: Decimal
    estimated_price: Optional[Decimal] = None
    contractor_id: Optional[int] = None
    status: str = "planned"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None


class WorkVolumeCreate(WorkVolumeBase):
    pass


class WorkVolumeUpdate(BaseModel):
    construct_id: Optional[int] = None
    work_code: Optional[str] = None
    work_name: Optional[str] = None
    unit: Optional[str] = None
    planned_volume: Optional[Decimal] = None
    estimated_price: Optional[Decimal] = None
    contractor_id: Optional[int] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None


class WorkVolume(WorkVolumeBase):
    id: int
    actual_volume: Optional[Decimal] = None
    completed_percentage: Optional[Decimal] = None
    planned_amount: Optional[Decimal] = None
    actual_amount: Optional[Decimal] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    entries: List[WorkVolumeEntry] = []

    class Config:
        from_attributes = True


@router.get("/", response_model=List[WorkVolume])
def get_work_volumes(project_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список объемов работ"""
    query = db.query(WorkVolumeModel)
    if project_id:
        query = query.filter(WorkVolumeModel.project_id == project_id)
    volumes = query.offset(skip).limit(limit).all()
    return volumes


@router.get("/{volume_id}", response_model=WorkVolume)
def get_work_volume(volume_id: int, db: Session = Depends(get_db)):
    """Получить объем работ по ID"""
    volume = db.query(WorkVolumeModel).filter(WorkVolumeModel.id == volume_id).first()
    if not volume:
        raise HTTPException(status_code=404, detail="Объем работ не найден")
    return volume


@router.post("/", response_model=WorkVolume)
def create_work_volume(volume: WorkVolumeCreate, db: Session = Depends(get_db)):
    """Создать запись объемов работ"""
    volume_data = volume.model_dump()
    if volume_data.get("estimated_price") and volume_data.get("planned_volume"):
        volume_data["planned_amount"] = volume_data["estimated_price"] * volume_data["planned_volume"]
    
    db_volume = WorkVolumeModel(**volume_data)
    db.add(db_volume)
    db.commit()
    db.refresh(db_volume)
    return db_volume


@router.put("/{volume_id}", response_model=WorkVolume)
def update_work_volume(volume_id: int, volume: WorkVolumeUpdate, db: Session = Depends(get_db)):
    """Обновить объем работ"""
    db_volume = db.query(WorkVolumeModel).filter(WorkVolumeModel.id == volume_id).first()
    if not db_volume:
        raise HTTPException(status_code=404, detail="Объем работ не найден")
    
    update_data = volume.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_volume, field, value)
    
    # Пересчет плановой суммы
    if db_volume.estimated_price and db_volume.planned_volume:
        db_volume.planned_amount = db_volume.estimated_price * db_volume.planned_volume
    
    db.commit()
    db.refresh(db_volume)
    return db_volume


@router.post("/{volume_id}/entries", response_model=WorkVolumeEntry)
def add_work_volume_entry(volume_id: int, entry: WorkVolumeEntryCreate, db: Session = Depends(get_db)):
    """Добавить запись фактического объема"""
    work_volume = db.query(WorkVolumeModel).filter(WorkVolumeModel.id == volume_id).first()
    if not work_volume:
        raise HTTPException(status_code=404, detail="Объем работ не найден")
    
    # Проверка перевыполнения
    new_total = (work_volume.actual_volume or 0) + entry.actual_volume
    if new_total > work_volume.planned_volume:
        # Предупреждение, но разрешаем ввод (можно требовать обоснование)
        pass
    
    db_entry = WorkVolumeEntryModel(work_volume_id=volume_id, **entry.model_dump())
    db.add(db_entry)
    
    # Обновление фактического объема
    work_volume.actual_volume = new_total
    if work_volume.planned_volume > 0:
        work_volume.completed_percentage = (new_total / work_volume.planned_volume) * 100
    
    if work_volume.estimated_price:
        work_volume.actual_amount = new_total * work_volume.estimated_price
    
    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.delete("/{volume_id}")
def delete_work_volume(volume_id: int, db: Session = Depends(get_db)):
    """Удалить объем работ"""
    volume = db.query(WorkVolumeModel).filter(WorkVolumeModel.id == volume_id).first()
    if not volume:
        raise HTTPException(status_code=404, detail="Объем работ не найден")
    db.delete(volume)
    db.commit()
    return {"message": "Объем работ удален"}