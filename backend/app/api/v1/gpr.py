from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.gpr import GPR as GPRModel, GPRTask as GPRTaskModel
from pydantic import BaseModel
from datetime import date, datetime

router = APIRouter()


class GPRTaskBase(BaseModel):
    name: str
    work_type: Optional[str] = None
    responsible: Optional[str] = None
    start_date: date
    end_date: date
    planned_duration: Optional[int] = None
    status: str = "planned"
    dependencies: Optional[str] = None
    notes: Optional[str] = None


class GPRTaskCreate(GPRTaskBase):
    pass


class GPRTask(GPRTaskBase):
    id: int
    gpr_id: int
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    progress: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GPRBase(BaseModel):
    project_id: int
    name: str
    version: Optional[str] = None
    start_date: date
    end_date: date
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    status: str = "draft"
    description: Optional[str] = None


class GPRCreate(GPRBase):
    tasks: List[GPRTaskCreate] = []


class GPRUpdate(BaseModel):
    name: Optional[str] = None
    version: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None


class GPR(GPRBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    tasks: List[GPRTask] = []

    class Config:
        from_attributes = True


@router.get("/", response_model=List[GPR])
def get_gprs(project_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список ГПР"""
    try:
        query = db.query(GPRModel)
        if project_id:
            query = query.filter(GPRModel.project_id == project_id)
        gprs = query.offset(skip).limit(limit).all()
        
        result = []
        for gpr in gprs:
            try:
                gpr_dict = {
                    "id": gpr.id,
                    "project_id": gpr.project_id,
                    "name": gpr.name,
                    "version": gpr.version,
                    "start_date": gpr.start_date,
                    "end_date": gpr.end_date,
                    "created_by": gpr.created_by,
                    "approved_by": gpr.approved_by,
                    "status": gpr.status or "draft",
                    "description": gpr.description,
                    "created_at": gpr.created_at,
                    "updated_at": gpr.updated_at,
                    "tasks": [
                        {
                            "id": task.id,
                            "gpr_id": task.gpr_id,
                            "name": task.name,
                            "work_type": task.work_type,
                            "responsible": task.responsible,
                            "start_date": task.start_date,
                            "end_date": task.end_date,
                            "planned_duration": task.planned_duration,
                            "status": task.status or "planned",
                            "dependencies": task.dependencies,
                            "notes": task.notes,
                            "actual_start_date": task.actual_start_date,
                            "actual_end_date": task.actual_end_date,
                            "progress": task.progress or 0,
                            "created_at": task.created_at,
                            "updated_at": task.updated_at
                        } for task in (gpr.tasks or [])
                    ]
                }
                result.append(GPR(**gpr_dict))
            except Exception as e:
                import traceback
                print(f"Error serializing GPR {getattr(gpr, 'id', 'unknown')}: {e}")
                traceback.print_exc()
                continue
        
        return result
    except Exception as e:
        import traceback
        print(f"Error in get_gprs: {e}")
        traceback.print_exc()
        return []


@router.get("/{gpr_id}", response_model=GPR)
def get_gpr(gpr_id: int, db: Session = Depends(get_db)):
    """Получить ГПР по ID"""
    gpr = db.query(GPRModel).filter(GPRModel.id == gpr_id).first()
    if not gpr:
        raise HTTPException(status_code=404, detail="ГПР не найден")
    
    gpr_dict = {
        "id": gpr.id,
        "project_id": gpr.project_id,
        "name": gpr.name,
        "version": gpr.version,
        "start_date": gpr.start_date,
        "end_date": gpr.end_date,
        "created_by": gpr.created_by,
        "approved_by": gpr.approved_by,
        "status": gpr.status or "draft",
        "description": gpr.description,
        "created_at": gpr.created_at,
        "updated_at": gpr.updated_at,
        "tasks": [
            {
                "id": task.id,
                "gpr_id": task.gpr_id,
                "name": task.name,
                "work_type": task.work_type,
                "responsible": task.responsible,
                "start_date": task.start_date,
                "end_date": task.end_date,
                "planned_duration": task.planned_duration,
                "status": task.status or "planned",
                "dependencies": task.dependencies,
                "notes": task.notes,
                "actual_start_date": task.actual_start_date,
                "actual_end_date": task.actual_end_date,
                "progress": task.progress or 0,
                "created_at": task.created_at,
                "updated_at": task.updated_at
            } for task in (gpr.tasks or [])
        ]
    }
    return GPR(**gpr_dict)


@router.post("/", response_model=GPR)
def create_gpr(gpr: GPRCreate, db: Session = Depends(get_db)):
    """Создать новый ГПР"""
    tasks_data = gpr.tasks
    gpr_data = gpr.model_dump(exclude={"tasks"})
    
    db_gpr = GPRModel(**gpr_data)
    db.add(db_gpr)
    db.flush()
    
    for task_data in tasks_data:
        task = GPRTaskModel(gpr_id=db_gpr.id, **task_data.model_dump())
        db.add(task)
    
    db.commit()
    db.refresh(db_gpr)
    
    gpr_dict = {
        "id": db_gpr.id,
        "project_id": db_gpr.project_id,
        "name": db_gpr.name,
        "version": db_gpr.version,
        "start_date": db_gpr.start_date,
        "end_date": db_gpr.end_date,
        "created_by": db_gpr.created_by,
        "approved_by": db_gpr.approved_by,
        "status": db_gpr.status or "draft",
        "description": db_gpr.description,
        "created_at": db_gpr.created_at,
        "updated_at": db_gpr.updated_at,
        "tasks": [
            {
                "id": task.id,
                "gpr_id": task.gpr_id,
                "name": task.name,
                "work_type": task.work_type,
                "responsible": task.responsible,
                "start_date": task.start_date,
                "end_date": task.end_date,
                "planned_duration": task.planned_duration,
                "status": task.status or "planned",
                "dependencies": task.dependencies,
                "notes": task.notes,
                "actual_start_date": task.actual_start_date,
                "actual_end_date": task.actual_end_date,
                "progress": task.progress or 0,
                "created_at": task.created_at,
                "updated_at": task.updated_at
            } for task in (db_gpr.tasks or [])
        ]
    }
    return GPR(**gpr_dict)


@router.put("/{gpr_id}", response_model=GPR)
def update_gpr(gpr_id: int, gpr: GPRUpdate, db: Session = Depends(get_db)):
    """Обновить ГПР"""
    db_gpr = db.query(GPRModel).filter(GPRModel.id == gpr_id).first()
    if not db_gpr:
        raise HTTPException(status_code=404, detail="ГПР не найден")
    
    update_data = gpr.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_gpr, field, value)
    
    db.commit()
    db.refresh(db_gpr)
    
    gpr_dict = {
        "id": db_gpr.id,
        "project_id": db_gpr.project_id,
        "name": db_gpr.name,
        "version": db_gpr.version,
        "start_date": db_gpr.start_date,
        "end_date": db_gpr.end_date,
        "created_by": db_gpr.created_by,
        "approved_by": db_gpr.approved_by,
        "status": db_gpr.status or "draft",
        "description": db_gpr.description,
        "created_at": db_gpr.created_at,
        "updated_at": db_gpr.updated_at,
        "tasks": [
            {
                "id": task.id,
                "gpr_id": task.gpr_id,
                "name": task.name,
                "work_type": task.work_type,
                "responsible": task.responsible,
                "start_date": task.start_date,
                "end_date": task.end_date,
                "planned_duration": task.planned_duration,
                "status": task.status or "planned",
                "dependencies": task.dependencies,
                "notes": task.notes,
                "actual_start_date": task.actual_start_date,
                "actual_end_date": task.actual_end_date,
                "progress": task.progress or 0,
                "created_at": task.created_at,
                "updated_at": task.updated_at
            } for task in (db_gpr.tasks or [])
        ]
    }
    return GPR(**gpr_dict)


@router.delete("/{gpr_id}")
def delete_gpr(gpr_id: int, db: Session = Depends(get_db)):
    """Удалить ГПР"""
    gpr = db.query(GPRModel).filter(GPRModel.id == gpr_id).first()
    if not gpr:
        raise HTTPException(status_code=404, detail="ГПР не найден")
    db.delete(gpr)
    db.commit()
    return {"message": "ГПР удален"}