from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from pathlib import Path
from urllib.parse import quote
import os

from pydantic import BaseModel

from app.db.database import get_db
from app.models.lab_test import LabTest as LabTestModel

router = APIRouter()

UPLOAD_DIR = Path("uploads/lab-tests")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class LabTestBase(BaseModel):
    project_id: int
    test_type: str
    sample_description: Optional[str] = None
    lab_name: Optional[str] = None
    protocol_number: Optional[str] = None
    protocol_date: Optional[date] = None
    sample_date: Optional[date] = None
    test_date: Optional[date] = None
    result: str = "pending"  # pending|pass|fail
    description: Optional[str] = None
    notes: Optional[str] = None


class LabTestCreate(LabTestBase):
    pass


class LabTestUpdate(BaseModel):
    project_id: Optional[int] = None
    test_type: Optional[str] = None
    sample_description: Optional[str] = None
    lab_name: Optional[str] = None
    protocol_number: Optional[str] = None
    protocol_date: Optional[date] = None
    sample_date: Optional[date] = None
    test_date: Optional[date] = None
    result: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None


class LabTest(LabTestBase):
    id: int
    file_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/", response_model=List[LabTest])
def list_lab_tests(
    project_id: Optional[int] = None,
    result: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
):
    q = db.query(LabTestModel).filter(LabTestModel.is_active == True)  # noqa: E712
    if project_id:
        q = q.filter(LabTestModel.project_id == project_id)
    if result:
        q = q.filter(LabTestModel.result == result)
    if date_from:
        q = q.filter(LabTestModel.protocol_date >= date_from)
    if date_to:
        q = q.filter(LabTestModel.protocol_date <= date_to)
    return q.order_by(LabTestModel.protocol_date.desc().nullslast(), LabTestModel.created_at.desc()).all()


@router.get("/{test_id}", response_model=LabTest)
def get_lab_test(test_id: int, db: Session = Depends(get_db)):
    row = db.query(LabTestModel).filter(LabTestModel.id == test_id, LabTestModel.is_active == True).first()  # noqa: E712
    if not row:
        raise HTTPException(status_code=404, detail="Испытание не найдено")
    return row


@router.post("/", response_model=LabTest)
def create_lab_test(payload: LabTestCreate, db: Session = Depends(get_db)):
    row = LabTestModel(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/{test_id}", response_model=LabTest)
def update_lab_test(test_id: int, payload: LabTestUpdate, db: Session = Depends(get_db)):
    row = db.query(LabTestModel).filter(LabTestModel.id == test_id, LabTestModel.is_active == True).first()  # noqa: E712
    if not row:
        raise HTTPException(status_code=404, detail="Испытание не найдено")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{test_id}")
def delete_lab_test(test_id: int, db: Session = Depends(get_db)):
    row = db.query(LabTestModel).filter(LabTestModel.id == test_id, LabTestModel.is_active == True).first()  # noqa: E712
    if not row:
        raise HTTPException(status_code=404, detail="Испытание не найдено")
    row.is_active = False
    db.commit()
    return {"status": "ok"}


@router.post("/{test_id}/file")
async def upload_lab_test_file(
    test_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    row = db.query(LabTestModel).filter(LabTestModel.id == test_id, LabTestModel.is_active == True).first()  # noqa: E712
    if not row:
        raise HTTPException(status_code=404, detail="Испытание не найдено")
    if file.content_type not in ("application/pdf", "image/png", "image/jpeg"):
        raise HTTPException(status_code=400, detail="Разрешены PDF/PNG/JPEG")

    safe_name = quote(file.filename)
    unique = f"{test_id}_{int(datetime.utcnow().timestamp())}_{safe_name}"
    dest = UPLOAD_DIR / unique
    with dest.open("wb") as f:
        f.write(await file.read())

    # удалять старый файл не будем, чтобы не ломать историю; можно чистить позже
    row.file_name = file.filename
    row.stored_path = str(dest)
    db.commit()
    return {"status": "ok", "file_name": row.file_name}


@router.get("/{test_id}/file/download")
def download_lab_test_file(test_id: int, db: Session = Depends(get_db)):
    row = db.query(LabTestModel).filter(LabTestModel.id == test_id, LabTestModel.is_active == True).first()  # noqa: E712
    if not row or not row.stored_path or not os.path.exists(row.stored_path):
        raise HTTPException(status_code=404, detail="Файл не найден")
    from fastapi.responses import FileResponse

    return FileResponse(
        path=row.stored_path,
        filename=row.file_name or os.path.basename(row.stored_path),
        media_type="application/octet-stream",
    )

