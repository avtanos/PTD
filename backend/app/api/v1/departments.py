from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db, engine
from app.models.department import Department as DepartmentModel
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


def _ensure_parent_id_column():
    """Добавить колонку parent_id в departments, если её нет (миграция для существующих БД)."""
    try:
        with engine.connect() as conn:
            r = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='departments'"))
            if r.fetchone():
                r2 = conn.execute(text("PRAGMA table_info(departments)"))
                cols = [row[1] for row in r2.fetchall()]
                if "parent_id" not in cols:
                    conn.execute(text("ALTER TABLE departments ADD COLUMN parent_id INTEGER REFERENCES departments(id)"))
                    conn.commit()
    except Exception:
        pass


_ensure_parent_id_column()


class DepartmentBase(BaseModel):
    parent_id: Optional[int] = None
    code: str
    name: str
    short_name: Optional[str] = None
    description: Optional[str] = None
    head: Optional[str] = None
    is_active: bool = True


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    parent_id: Optional[int] = None
    code: Optional[str] = None
    name: Optional[str] = None
    short_name: Optional[str] = None
    description: Optional[str] = None
    head: Optional[str] = None
    is_active: Optional[bool] = None


class DepartmentBrief(BaseModel):
    id: int
    code: str
    name: str
    short_name: Optional[str] = None

    class Config:
        from_attributes = True


class Department(DepartmentBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    parent: Optional[DepartmentBrief] = None

    class Config:
        from_attributes = True


def _get_descendant_ids(db: Session, department_id: int) -> set:
    """Рекурсивно получить id всех потомков подразделения (защита от циклов)."""
    result = set()
    children = db.query(DepartmentModel.id).filter(DepartmentModel.parent_id == department_id).all()
    for (cid,) in children:
        result.add(cid)
        result.update(_get_descendant_ids(db, cid))
    return result


@router.get("/", response_model=List[Department])
def get_departments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список подразделений (с parent для построения дерева)"""
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
    if department.parent_id is not None:
        parent = db.query(DepartmentModel).filter(DepartmentModel.id == department.parent_id).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Родительское подразделение не найдено")
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
    if "parent_id" in update_data:
        new_parent_id = update_data["parent_id"]
        if new_parent_id is not None:
            if new_parent_id == department_id:
                raise HTTPException(status_code=400, detail="Подразделение не может быть родителем самого себя")
            descendants = _get_descendant_ids(db, department_id)
            if new_parent_id in descendants:
                raise HTTPException(status_code=400, detail="Родителем не может быть дочернее подразделение (цикл)")
            parent = db.query(DepartmentModel).filter(DepartmentModel.id == new_parent_id).first()
            if not parent:
                raise HTTPException(status_code=400, detail="Родительское подразделение не найдено")
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