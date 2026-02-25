"""API учёта кадров"""
import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import date, datetime
from app.db.database import get_db
from app.models.personnel import (
    Personnel as PersonnelModel,
    ProjectPersonnel,
    PersonnelStatus,
    ProjectPersonnelRole,
    PersonnelDocument,
    PersonnelDocumentType,
    PersonnelHistory,
    PersonnelHistoryAction,
)
from app.models.department import Department
from pydantic import BaseModel, Field

UPLOAD_DIR = Path(__file__).resolve().parents[3] / "uploads" / "personnel"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter()


# === Schemas ===
class PersonnelBase(BaseModel):
    tab_number: Optional[str] = None
    full_name: str
    position: str
    department_id: Optional[int] = None
    hire_date: date
    dismissal_date: Optional[date] = None
    birth_date: Optional[date] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    inn: Optional[str] = None
    passport_series: Optional[str] = None
    passport_number: Optional[str] = None
    address: Optional[str] = None
    status: str = "employed"
    user_id: Optional[int] = None
    is_active: bool = True
    notes: Optional[str] = None


class PersonnelCreate(PersonnelBase):
    pass


class PersonnelUpdate(BaseModel):
    tab_number: Optional[str] = None
    full_name: Optional[str] = None
    position: Optional[str] = None
    department_id: Optional[int] = None
    hire_date: Optional[date] = None
    dismissal_date: Optional[date] = None
    birth_date: Optional[date] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    inn: Optional[str] = None
    passport_series: Optional[str] = None
    passport_number: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None
    user_id: Optional[int] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class DepartmentBrief(BaseModel):
    id: int
    code: str
    name: str

    class Config:
        from_attributes = True


class Personnel(PersonnelBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    department: Optional[DepartmentBrief] = None

    class Config:
        from_attributes = True


class ProjectPersonnelBase(BaseModel):
    project_id: int
    personnel_id: int
    role: str = "other"
    date_from: date
    date_to: Optional[date] = None
    is_main: bool = False
    notes: Optional[str] = None


class ProjectPersonnelCreate(ProjectPersonnelBase):
    pass


class ProjectPersonnelUpdate(BaseModel):
    role: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    is_main: Optional[bool] = None
    notes: Optional[str] = None


class ProjectBrief(BaseModel):
    id: int
    name: str
    code: Optional[str] = None

    class Config:
        from_attributes = True


class ProjectPersonnelSchema(ProjectPersonnelBase):
    id: int
    personnel: Optional[Personnel] = None
    project: Optional[ProjectBrief] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PersonnelDocumentSchema(BaseModel):
    id: int
    personnel_id: int
    document_type: str
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


class PersonnelHistorySchema(BaseModel):
    id: int
    personnel_id: int
    action: str
    changed_at: datetime
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


# === Personnel CRUD ===
@router.get("/by-department/{department_id}", response_model=List[Personnel])
def get_personnel_by_department(department_id: int, db: Session = Depends(get_db)):
    """Получить сотрудников подразделения (для выпадающих списков)"""
    return db.query(PersonnelModel).filter(
        PersonnelModel.department_id == department_id,
        PersonnelModel.is_active == True,
        PersonnelModel.status == PersonnelStatus.EMPLOYED.value
    ).all()


@router.get("/", response_model=List[Personnel])
def get_personnel(
    skip: int = 0,
    limit: int = 100,
    department_id: Optional[int] = Query(None, description="Фильтр по подразделению"),
    status: Optional[str] = Query(None, description="Фильтр по статусу"),
    search: Optional[str] = Query(None, description="Поиск по ФИО, должности, табельному"),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """Получить список сотрудников"""
    q = db.query(PersonnelModel)
    if department_id is not None:
        q = q.filter(PersonnelModel.department_id == department_id)
    if status:
        q = q.filter(PersonnelModel.status == status)
    if is_active is not None:
        q = q.filter(PersonnelModel.is_active == is_active)
    if search:
        s = f"%{search}%"
        q = q.filter(
            or_(
                PersonnelModel.full_name.ilike(s),
                PersonnelModel.position.ilike(s),
                PersonnelModel.tab_number.ilike(s)
            )
        )
    personnel_list = q.offset(skip).limit(limit).all()
    return personnel_list


@router.get("/{personnel_id}", response_model=Personnel)
def get_personnel_by_id(personnel_id: int, db: Session = Depends(get_db)):
    """Получить сотрудника по ID"""
    p = db.query(PersonnelModel).filter(PersonnelModel.id == personnel_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    return p


def _str_val(v):
    if v is None:
        return None
    if isinstance(v, (date, datetime)):
        return v.isoformat()
    return str(v)


@router.post("/", response_model=Personnel)
def create_personnel(personnel: PersonnelCreate, db: Session = Depends(get_db)):
    """Создать сотрудника"""
    if personnel.tab_number and db.query(PersonnelModel).filter(PersonnelModel.tab_number == personnel.tab_number).first():
        raise HTTPException(status_code=400, detail="Сотрудник с таким табельным номером уже существует")
    db_personnel = PersonnelModel(**personnel.model_dump())
    db.add(db_personnel)
    db.commit()
    db.refresh(db_personnel)
    hist = PersonnelHistory(
        personnel_id=db_personnel.id,
        action=PersonnelHistoryAction.CREATED,
        description="Создана карточка сотрудника",
    )
    db.add(hist)
    db.commit()
    return db_personnel


FIELD_LABELS = {
    "tab_number": "Табельный номер",
    "full_name": "ФИО",
    "position": "Должность",
    "department_id": "Подразделение",
    "hire_date": "Дата приёма",
    "dismissal_date": "Дата увольнения",
    "birth_date": "Дата рождения",
    "phone": "Телефон",
    "email": "Email",
    "status": "Статус",
    "is_active": "Активен",
    "notes": "Примечания",
}


@router.put("/{personnel_id}", response_model=Personnel)
def update_personnel(personnel_id: int, personnel_data: PersonnelUpdate, db: Session = Depends(get_db)):
    """Обновить сотрудника"""
    p = db.query(PersonnelModel).filter(PersonnelModel.id == personnel_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    update_data = personnel_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        old_val = getattr(p, field, None)
        if old_val != value:
            hist = PersonnelHistory(
                personnel_id=personnel_id,
                action=PersonnelHistoryAction.UPDATED,
                field_name=field,
                old_value=_str_val(old_val),
                new_value=_str_val(value),
                description=f"{FIELD_LABELS.get(field, field)}: было «{_str_val(old_val) or '—'}», стало «{_str_val(value) or '—'}»",
            )
            db.add(hist)
        setattr(p, field, value)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{personnel_id}")
def delete_personnel(personnel_id: int, db: Session = Depends(get_db)):
    """Удалить сотрудника"""
    p = db.query(PersonnelModel).filter(PersonnelModel.id == personnel_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    db.delete(p)
    db.commit()
    return {"message": "Сотрудник удалён"}


# === Project assignments ===
@router.get("/{personnel_id}/projects", response_model=List[ProjectPersonnelSchema])
def get_personnel_projects(personnel_id: int, db: Session = Depends(get_db)):
    """Получить проекты сотрудника"""
    p = db.query(PersonnelModel).filter(PersonnelModel.id == personnel_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    assignments = db.query(ProjectPersonnel).filter(ProjectPersonnel.personnel_id == personnel_id).all()
    return assignments


@router.post("/{personnel_id}/projects", response_model=ProjectPersonnelSchema)
def assign_personnel_to_project(
    personnel_id: int,
    assignment: ProjectPersonnelCreate,
    db: Session = Depends(get_db)
):
    """Назначить сотрудника на проект"""
    if assignment.personnel_id != personnel_id:
        raise HTTPException(status_code=400, detail="personnel_id в теле не совпадает с URL")
    p = db.query(PersonnelModel).filter(PersonnelModel.id == personnel_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    db_assignment = ProjectPersonnel(**assignment.model_dump())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment


@router.delete("/{personnel_id}/projects/{assignment_id}")
def remove_personnel_from_project(
    personnel_id: int,
    assignment_id: int,
    db: Session = Depends(get_db)
):
    """Снять сотрудника с проекта"""
    a = db.query(ProjectPersonnel).filter(
        ProjectPersonnel.id == assignment_id,
        ProjectPersonnel.personnel_id == personnel_id
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Назначение не найдено")
    db.delete(a)
    db.commit()
    return {"message": "Сотрудник снят с проекта"}


# === Документы сотрудника ===
DOCUMENT_TYPE_MAP = {
    "resume": PersonnelDocumentType.RESUME,
    "autobiography": PersonnelDocumentType.AUTOBIOGRAPHY,
    "diploma": PersonnelDocumentType.DIPLOMA,
    "certificate": PersonnelDocumentType.CERTIFICATE,
    "contract": PersonnelDocumentType.CONTRACT,
    "other": PersonnelDocumentType.OTHER,
}


@router.get("/{personnel_id}/documents", response_model=List[PersonnelDocumentSchema])
def get_personnel_documents(personnel_id: int, db: Session = Depends(get_db)):
    """Список документов сотрудника"""
    p = db.query(PersonnelModel).filter(PersonnelModel.id == personnel_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    docs = db.query(PersonnelDocument).filter(PersonnelDocument.personnel_id == personnel_id).order_by(PersonnelDocument.uploaded_at.desc()).all()
    return docs


@router.post("/{personnel_id}/documents", response_model=PersonnelDocumentSchema)
async def upload_personnel_document(
    personnel_id: int,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Загрузить документ сотрудника"""
    p = db.query(PersonnelModel).filter(PersonnelModel.id == personnel_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    dt = DOCUMENT_TYPE_MAP.get(document_type.lower(), PersonnelDocumentType.OTHER)
    ext = Path(file.filename or "").suffix or ".bin"
    safe_name = f"{uuid.uuid4().hex}{ext}"
    personnel_dir = UPLOAD_DIR / str(personnel_id)
    personnel_dir.mkdir(parents=True, exist_ok=True)
    file_path = personnel_dir / safe_name
    contents = await file.read()
    file_path.write_bytes(contents)
    rel_path = str(personnel_dir.relative_to(UPLOAD_DIR) / safe_name)
    doc = PersonnelDocument(
        personnel_id=personnel_id,
        document_type=dt,
        file_name=file.filename or "document",
        file_path=rel_path,
        file_size=len(contents),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/{personnel_id}/documents/{document_id}")
def delete_personnel_document(
    personnel_id: int,
    document_id: int,
    db: Session = Depends(get_db),
):
    """Удалить документ сотрудника"""
    doc = db.query(PersonnelDocument).filter(
        PersonnelDocument.id == document_id,
        PersonnelDocument.personnel_id == personnel_id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Документ не найден")
    full_path = UPLOAD_DIR / doc.file_path
    if full_path.exists():
        full_path.unlink()
    db.delete(doc)
    db.commit()
    return {"message": "Документ удалён"}


@router.get("/{personnel_id}/documents/{document_id}/download")
def download_personnel_document(
    personnel_id: int,
    document_id: int,
    db: Session = Depends(get_db),
):
    """Скачать документ сотрудника"""
    doc = db.query(PersonnelDocument).filter(
        PersonnelDocument.id == document_id,
        PersonnelDocument.personnel_id == personnel_id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Документ не найден")
    full_path = UPLOAD_DIR / doc.file_path
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Файл не найден на диске")
    return FileResponse(full_path, filename=doc.file_name)


# === История изменений ===
@router.get("/{personnel_id}/history", response_model=List[PersonnelHistorySchema])
def get_personnel_history(personnel_id: int, db: Session = Depends(get_db)):
    """История изменений сотрудника"""
    p = db.query(PersonnelModel).filter(PersonnelModel.id == personnel_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    items = db.query(PersonnelHistory).filter(PersonnelHistory.personnel_id == personnel_id).order_by(PersonnelHistory.changed_at.desc()).all()
    return items


