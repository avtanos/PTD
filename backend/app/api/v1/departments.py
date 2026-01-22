from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.department import Department as DepartmentModel
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class DepartmentBase(BaseModel):
    code: str
    name: str
    short_name: Optional[str] = None
    description: Optional[str] = None
    head: Optional[str] = None
    is_active: bool = True


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    short_name: Optional[str] = None
    description: Optional[str] = None
    head: Optional[str] = None
    is_active: Optional[bool] = None


class Department(DepartmentBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/", response_model=List[Department])
def get_departments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список подразделений"""
    departments = db.query(DepartmentModel).offset(skip).limit(limit).all()
    return departments


@router.get("/{department_id}", response_model=Department)
def get_department(department_id: int, db: Session = Depends(get_db)):
    """Получить подразделение по ID"""
    department = db.query(DepartmentModel).filter(DepartmentModel.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Подразделение не найдено")
    return department


@router.post("/", response_model=Department)
def create_department(department: DepartmentCreate, db: Session = Depends(get_db)):
    """Создать подразделение"""
    db_department = DepartmentModel(**department.model_dump())
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    return db_department


@router.put("/{department_id}", response_model=Department)
def update_department(department_id: int, department: DepartmentUpdate, db: Session = Depends(get_db)):
    """Обновить подразделение"""
    db_department = db.query(DepartmentModel).filter(DepartmentModel.id == department_id).first()
    if not db_department:
        raise HTTPException(status_code=404, detail="Подразделение не найдено")
    
    update_data = department.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_department, field, value)
    
    db.commit()
    db.refresh(db_department)
    return db_department


@router.delete("/{department_id}")
def delete_department(department_id: int, db: Session = Depends(get_db)):
    """Удалить подразделение"""
    department = db.query(DepartmentModel).filter(DepartmentModel.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Подразделение не найдено")
    db.delete(department)
    db.commit()
    return {"message": "Подразделение удалено"}