from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.project_documentation import ProjectDocumentation as ProjectDocumentationModel
from pydantic import BaseModel
from datetime import date, datetime

router = APIRouter()


class ProjectDocumentationBase(BaseModel):
    project_id: int
    doc_type: str
    name: str
    number: Optional[str] = None
    version: Optional[str] = None
    development_date: Optional[date] = None
    developer: Optional[str] = None
    approved_by: Optional[str] = None
    approval_date: Optional[date] = None
    file_path: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True
    notes: Optional[str] = None


class ProjectDocumentationCreate(ProjectDocumentationBase):
    pass


class ProjectDocumentationUpdate(BaseModel):
    project_id: Optional[int] = None
    doc_type: Optional[str] = None
    name: Optional[str] = None
    number: Optional[str] = None
    version: Optional[str] = None
    development_date: Optional[date] = None
    developer: Optional[str] = None
    approved_by: Optional[str] = None
    approval_date: Optional[date] = None
    file_path: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class ProjectDocumentation(ProjectDocumentationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/", response_model=List[ProjectDocumentation])
def get_project_documentation(project_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список проектной документации"""
    try:
        from sqlalchemy import text
        
        # Используем raw SQL для обхода проблем с Enum
        sql = """
            SELECT id, project_id, doc_type, name, number, version, development_date,
                   developer, approved_by, approval_date, file_path, description,
                   is_active, notes, created_at, updated_at
            FROM project_documentation
        """
        params = {}
        
        if project_id:
            sql += " WHERE project_id = :project_id"
            params["project_id"] = project_id
        
        sql += " LIMIT :limit OFFSET :skip"
        params["limit"] = limit
        params["skip"] = skip
        
        rows = db.execute(text(sql), params).fetchall()
        
        if not rows:
            return []
        
        # Преобразуем строки в схемы
        result = []
        for row in rows:
            try:
                doc_dict = {
                    "id": row[0],
                    "project_id": row[1],
                    "doc_type": str(row[2]) if row[2] else "other",
                    "name": row[3],
                    "number": row[4],
                    "version": row[5],
                    "development_date": row[6],
                    "developer": row[7],
                    "approved_by": row[8],
                    "approval_date": row[9],
                    "file_path": row[10],
                    "description": row[11],
                    "is_active": bool(row[12]) if row[12] is not None else True,
                    "notes": row[13],
                    "created_at": row[14],
                    "updated_at": row[15]
                }
                result.append(ProjectDocumentation(**doc_dict))
            except Exception as e:
                import traceback
                print(f"Error serializing doc {row[0] if row else 'unknown'}: {e}")
                traceback.print_exc()
                continue
        
        return result
    except Exception as e:
        import traceback
        print(f"Error in get_project_documentation: {e}")
        traceback.print_exc()
        return []


@router.get("/{doc_id}", response_model=ProjectDocumentation)
def get_project_doc(doc_id: int, db: Session = Depends(get_db)):
    """Получить документ по ID"""
    doc = db.query(ProjectDocumentationModel).filter(ProjectDocumentationModel.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Документ не найден")
    
    # Преобразуем Enum в строку для сериализации
    doc_dict = {
        "id": doc.id,
        "project_id": doc.project_id,
        "doc_type": doc.doc_type.value if hasattr(doc.doc_type, 'value') else str(doc.doc_type),
        "name": doc.name,
        "number": doc.number,
        "version": doc.version,
        "development_date": doc.development_date,
        "developer": doc.developer,
        "approved_by": doc.approved_by,
        "approval_date": doc.approval_date,
        "file_path": doc.file_path,
        "description": doc.description,
        "is_active": doc.is_active,
        "notes": doc.notes,
        "created_at": doc.created_at,
        "updated_at": doc.updated_at
    }
    return ProjectDocumentation(**doc_dict)


@router.post("/", response_model=ProjectDocumentation)
def create_project_doc(doc: ProjectDocumentationCreate, db: Session = Depends(get_db)):
    """Создать проектную документацию"""
    doc_data = doc.model_dump()
    
    # Преобразуем строки в Enum для сохранения в БД
    from app.models.project_documentation import DocumentationType
    if 'doc_type' in doc_data and doc_data['doc_type']:
        try:
            doc_data['doc_type'] = DocumentationType(doc_data['doc_type'])
        except (ValueError, KeyError):
            pass
    
    db_doc = ProjectDocumentationModel(**doc_data)
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    # Преобразуем обратно для ответа
    doc_dict = {
        "id": db_doc.id,
        "project_id": db_doc.project_id,
        "doc_type": db_doc.doc_type.value if hasattr(db_doc.doc_type, 'value') else str(db_doc.doc_type),
        "name": db_doc.name,
        "number": db_doc.number,
        "version": db_doc.version,
        "development_date": db_doc.development_date,
        "developer": db_doc.developer,
        "approved_by": db_doc.approved_by,
        "approval_date": db_doc.approval_date,
        "file_path": db_doc.file_path,
        "description": db_doc.description,
        "is_active": db_doc.is_active,
        "notes": db_doc.notes,
        "created_at": db_doc.created_at,
        "updated_at": db_doc.updated_at
    }
    return ProjectDocumentation(**doc_dict)


@router.put("/{doc_id}", response_model=ProjectDocumentation)
def update_project_doc(doc_id: int, doc: ProjectDocumentationUpdate, db: Session = Depends(get_db)):
    """Обновить проектную документацию"""
    db_doc = db.query(ProjectDocumentationModel).filter(ProjectDocumentationModel.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Документ не найден")
    
    update_data = doc.model_dump(exclude_unset=True)
    
    # Преобразуем строки в Enum если нужно
    from app.models.project_documentation import DocumentationType
    if 'doc_type' in update_data and update_data['doc_type']:
        try:
            update_data['doc_type'] = DocumentationType(update_data['doc_type'])
        except (ValueError, KeyError):
            pass
    
    for field, value in update_data.items():
        setattr(db_doc, field, value)
    
    db.commit()
    db.refresh(db_doc)
    
    # Преобразуем обратно для ответа
    doc_dict = {
        "id": db_doc.id,
        "project_id": db_doc.project_id,
        "doc_type": db_doc.doc_type.value if hasattr(db_doc.doc_type, 'value') else str(db_doc.doc_type),
        "name": db_doc.name,
        "number": db_doc.number,
        "version": db_doc.version,
        "development_date": db_doc.development_date,
        "developer": db_doc.developer,
        "approved_by": db_doc.approved_by,
        "approval_date": db_doc.approval_date,
        "file_path": db_doc.file_path,
        "description": db_doc.description,
        "is_active": db_doc.is_active,
        "notes": db_doc.notes,
        "created_at": db_doc.created_at,
        "updated_at": db_doc.updated_at
    }
    return ProjectDocumentation(**doc_dict)


@router.delete("/{doc_id}")
def delete_project_doc(doc_id: int, db: Session = Depends(get_db)):
    """Удалить проектную документацию"""
    doc = db.query(ProjectDocumentationModel).filter(ProjectDocumentationModel.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Документ не найден")
    db.delete(doc)
    db.commit()
    return {"message": "Документ удален"}