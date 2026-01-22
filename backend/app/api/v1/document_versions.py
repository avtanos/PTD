from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.document_version import DocumentVersion as DocumentVersionModel
from pydantic import BaseModel
from datetime import date, datetime

router = APIRouter()


class DocumentVersionBase(BaseModel):
    document_type: str
    document_id: int
    version_number: str
    version_date: date
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    changes_description: Optional[str] = None
    created_by: str
    previous_version_id: Optional[int] = None
    notes: Optional[str] = None


class DocumentVersionCreate(DocumentVersionBase):
    pass


class DocumentVersion(DocumentVersionBase):
    id: int
    is_current: bool
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/", response_model=List[DocumentVersion])
def get_document_versions(document_type: str, document_id: int, db: Session = Depends(get_db)):
    """Получить версии документа"""
    versions = db.query(DocumentVersionModel).filter(
        DocumentVersionModel.document_type == document_type,
        DocumentVersionModel.document_id == document_id
    ).order_by(DocumentVersionModel.created_at.desc()).all()
    return versions


@router.post("/", response_model=DocumentVersion)
def create_document_version(version: DocumentVersionCreate, db: Session = Depends(get_db)):
    """Создать новую версию документа"""
    # Помечаем все предыдущие версии как неактуальные
    db.query(DocumentVersionModel).filter(
        DocumentVersionModel.document_type == version.document_type,
        DocumentVersionModel.document_id == version.document_id,
        DocumentVersionModel.is_current == True
    ).update({"is_current": False})
    
    db_version = DocumentVersionModel(**version.model_dump(), is_current=True)
    db.add(db_version)
    db.commit()
    db.refresh(db_version)
    return db_version


@router.get("/{version_id}", response_model=DocumentVersion)
def get_document_version(version_id: int, db: Session = Depends(get_db)):
    """Получить версию документа по ID"""
    version = db.query(DocumentVersionModel).filter(DocumentVersionModel.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Версия не найдена")
    return version


@router.put("/{version_id}/set-current")
def set_current_version(version_id: int, db: Session = Depends(get_db)):
    """Установить версию как текущую"""
    version = db.query(DocumentVersionModel).filter(DocumentVersionModel.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Версия не найдена")
    
    # Помечаем все версии этого документа как неактуальные
    db.query(DocumentVersionModel).filter(
        DocumentVersionModel.document_type == version.document_type,
        DocumentVersionModel.document_id == version.document_id
    ).update({"is_current": False})
    
    version.is_current = True
    db.commit()
    return {"message": "Версия установлена как текущая"}