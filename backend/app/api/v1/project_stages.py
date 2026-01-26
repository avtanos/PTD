from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import date
from decimal import Decimal
from app.db.database import get_db
from app.models.project_stage import ProjectStage as ProjectStageModel
from app.models.project import Project
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class ProjectStageBase(BaseModel):
    project_id: int
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    stage_type: Optional[str] = None
    order_number: int = 0
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    status: str = "planned"
    progress_percentage: Decimal = 0
    responsible: Optional[str] = None
    is_active: bool = True
    notes: Optional[str] = None


class ProjectStageCreate(ProjectStageBase):
    pass


class ProjectStageUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    stage_type: Optional[str] = None
    order_number: Optional[int] = None
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    status: Optional[str] = None
    progress_percentage: Optional[Decimal] = None
    responsible: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class ProjectStage(ProjectStageBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/", response_model=List[ProjectStage])
def get_stages(
    project_id: Optional[int] = Query(None, description="Фильтр по проекту (объекту)"),
    status: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Получить список этапов проекта с фильтрацией"""
    query = db.query(ProjectStageModel)
    
    # Обязательная фильтрация по проекту (объектно-центрированный подход)
    if project_id is None:
        raise HTTPException(status_code=400, detail="project_id обязателен для получения этапов")
    
    query = query.filter(ProjectStageModel.project_id == project_id)
    
    if status:
        query = query.filter(ProjectStageModel.status == status)
    if is_active is not None:
        query = query.filter(ProjectStageModel.is_active == is_active)
    
    query = query.order_by(ProjectStageModel.order_number, ProjectStageModel.name)
    stages = query.all()
    return stages


@router.get("/{stage_id}", response_model=ProjectStage)
def get_stage(stage_id: int, db: Session = Depends(get_db)):
    """Получить этап по ID"""
    stage = db.query(ProjectStageModel).filter(ProjectStageModel.id == stage_id).first()
    if not stage:
        raise HTTPException(status_code=404, detail="Этап не найден")
    return stage


@router.post("/", response_model=ProjectStage, status_code=201)
def create_stage(stage: ProjectStageCreate, db: Session = Depends(get_db)):
    """Создать новый этап проекта"""
    # Проверка существования проекта
    project = db.query(Project).filter(Project.id == stage.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    db_stage = ProjectStageModel(**stage.dict())
    db.add(db_stage)
    db.commit()
    db.refresh(db_stage)
    return db_stage


@router.put("/{stage_id}", response_model=ProjectStage)
def update_stage(stage_id: int, stage_update: ProjectStageUpdate, db: Session = Depends(get_db)):
    """Обновить этап проекта"""
    db_stage = db.query(ProjectStageModel).filter(ProjectStageModel.id == stage_id).first()
    if not db_stage:
        raise HTTPException(status_code=404, detail="Этап не найден")
    
    update_data = stage_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_stage, field, value)
    
    db.commit()
    db.refresh(db_stage)
    return db_stage


@router.delete("/{stage_id}", status_code=204)
def delete_stage(stage_id: int, db: Session = Depends(get_db)):
    """Удалить этап проекта"""
    db_stage = db.query(ProjectStageModel).filter(ProjectStageModel.id == stage_id).first()
    if not db_stage:
        raise HTTPException(status_code=404, detail="Этап не найден")
    
    db.delete(db_stage)
    db.commit()
    return None
