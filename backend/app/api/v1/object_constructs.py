from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.object_construct import ObjectConstruct as ObjectConstructModel, ProjectConstruct as ProjectConstructModel
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class ObjectConstructBase(BaseModel):
    code: str
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True


class ObjectConstructCreate(ObjectConstructBase):
    pass


class ObjectConstruct(ObjectConstructBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProjectConstructBase(BaseModel):
    project_id: int
    stage_id: Optional[int] = None  # Этап проекта (опционально, для иерархии Объект → Этап → Конструктив)
    construct_id: int
    planned_volume: Optional[str] = None
    notes: Optional[str] = None


class ProjectConstructCreate(ProjectConstructBase):
    pass


class ProjectConstruct(ProjectConstructBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/", response_model=List[ObjectConstruct])
def get_constructs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список конструктивов"""
    constructs = db.query(ObjectConstructModel).offset(skip).limit(limit).all()
    return constructs


@router.post("/", response_model=ObjectConstruct)
def create_construct(construct: ObjectConstructCreate, db: Session = Depends(get_db)):
    """Создать конструктив"""
    db_construct = ObjectConstructModel(**construct.model_dump())
    db.add(db_construct)
    db.commit()
    db.refresh(db_construct)
    return db_construct


@router.get("/projects/{project_id}", response_model=List[ProjectConstruct])
def get_project_constructs(project_id: int, db: Session = Depends(get_db)):
    """Получить конструктивы проекта"""
    constructs = db.query(ProjectConstructModel).filter(ProjectConstructModel.project_id == project_id).all()
    return constructs


@router.post("/projects/", response_model=ProjectConstruct)
def create_project_construct(project_construct: ProjectConstructCreate, db: Session = Depends(get_db)):
    """Добавить конструктив к проекту (объектно-центрированный подход)"""
    # Валидация: если указан stage_id, проверяем что этап принадлежит проекту
    if project_construct.stage_id:
        from app.models.project_stage import ProjectStage
        stage = db.query(ProjectStage).filter(ProjectStage.id == project_construct.stage_id).first()
        if not stage:
            raise HTTPException(status_code=404, detail="Этап не найден")
        if stage.project_id != project_construct.project_id:
            raise HTTPException(status_code=400, detail="Этап не принадлежит указанному проекту")
    
    db_pc = ProjectConstructModel(**project_construct.model_dump())
    db.add(db_pc)
    db.commit()
    db.refresh(db_pc)
    return db_pc