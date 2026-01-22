from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.executive_doc import ExecutiveDocument, DocumentType
from pydantic import BaseModel
from datetime import date, datetime
from datetime import datetime as dt

router = APIRouter()


class ExecutiveDocBase(BaseModel):
    project_id: int
    doc_type: str
    name: str
    number: Optional[str] = None
    date: Optional[date] = None
    description: Optional[str] = None
    file_path: Optional[str] = None
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    status: str = "draft"


class ExecutiveDocCreate(ExecutiveDocBase):
    pass


class ExecutiveDocUpdate(BaseModel):
    project_id: Optional[int] = None
    doc_type: Optional[str] = None
    name: Optional[str] = None
    number: Optional[str] = None
    date: Optional[date] = None
    description: Optional[str] = None
    file_path: Optional[str] = None
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    status: Optional[str] = None
    department: Optional[str] = None
    ks2_id: Optional[int] = None


class ExecutiveDoc(ExecutiveDocBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


@router.get("/", response_model=List[ExecutiveDoc])
def get_executive_docs(project_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список исполнительной документации"""
    try:
        from sqlalchemy import text
        
        # Используем raw SQL для обхода проблем с Enum
        sql = """
            SELECT id, project_id, doc_type, name, number, date, description, 
                   file_path, created_by, approved_by, status, department, ks2_id,
                   created_at, updated_at
            FROM executive_documents
        """
        params = {}
        
        if project_id:
            sql += " WHERE project_id = :project_id"
            params["project_id"] = project_id
        
        # SQLite требует использовать позиционные параметры для LIMIT/OFFSET
        sql += f" LIMIT {limit} OFFSET {skip}"
        
        rows = db.execute(text(sql), params).fetchall()
        
        if not rows:
            return []
        
        # Преобразуем строки в схемы
        result = []
        for row in rows:
            try:
                # Проверяем обязательные поля
                if not row[3]:  # name is required
                    continue
                if not row[13]:  # created_at is required
                    continue
                
                doc_dict = {
                    "id": row[0],
                    "project_id": row[1],
                    "doc_type": str(row[2]) if row[2] else "other",
                    "name": row[3],
                    "number": row[4],
                    "date": row[5],
                    "description": row[6],
                    "file_path": row[7],
                    "created_by": row[8],
                    "approved_by": row[9],
                    "status": row[10] if row[10] else "draft",
                    "created_at": row[13],
                    "updated_at": row[14]
                }
                
                result.append(ExecutiveDoc(**doc_dict))
            except Exception as e:
                import traceback
                print(f"[ERROR] Error serializing doc {row[0] if row else 'unknown'}: {e}")
                traceback.print_exc()
                continue
        
        return result
    except Exception as e:
        import traceback
        error_msg = str(e)
        print(f"[ERROR] Error in get_executive_docs: {error_msg}")
        traceback.print_exc()
        # Если ошибка связана с таблицей или колонками, возвращаем пустой массив
        if "no such table" in error_msg.lower() or "no such column" in error_msg.lower():
            return []
        # Для других ошибок возвращаем пустой массив вместо исключения
        return []


@router.get("/{doc_id}", response_model=ExecutiveDoc)
def get_executive_doc(doc_id: int, db: Session = Depends(get_db)):
    """Получить документ по ID"""
    doc = db.query(ExecutiveDocument).filter(ExecutiveDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Документ не найден")
    return ExecutiveDoc(
        id=doc.id,
        project_id=doc.project_id,
        doc_type=doc.doc_type.value if hasattr(doc.doc_type, 'value') else str(doc.doc_type),
        name=doc.name,
        number=doc.number,
        date=doc.date,
        description=doc.description,
        file_path=doc.file_path,
        created_by=doc.created_by,
        approved_by=doc.approved_by,
        status=doc.status,
        created_at=doc.created_at,
        updated_at=doc.updated_at
    )


@router.post("/", response_model=ExecutiveDoc)
def create_executive_doc(doc: ExecutiveDocCreate, db: Session = Depends(get_db)):
    """Создать новый документ"""
    doc_data = doc.model_dump()
    # Преобразуем строку doc_type в Enum, если нужно
    if 'doc_type' in doc_data and isinstance(doc_data['doc_type'], str):
        try:
            doc_data['doc_type'] = DocumentType(doc_data['doc_type'])
        except ValueError:
            pass  # Оставляем как строку, если не соответствует Enum
    
    db_doc = ExecutiveDocument(**doc_data)
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return ExecutiveDoc(
        id=db_doc.id,
        project_id=db_doc.project_id,
        doc_type=db_doc.doc_type.value if hasattr(db_doc.doc_type, 'value') else str(db_doc.doc_type),
        name=db_doc.name,
        number=db_doc.number,
        date=db_doc.date,
        description=db_doc.description,
        file_path=db_doc.file_path,
        created_by=db_doc.created_by,
        approved_by=db_doc.approved_by,
        status=db_doc.status,
        created_at=db_doc.created_at,
        updated_at=db_doc.updated_at
    )


@router.put("/{doc_id}", response_model=ExecutiveDoc)
def update_executive_doc(doc_id: int, doc: ExecutiveDocUpdate, db: Session = Depends(get_db)):
    """Обновить документ"""
    db_doc = db.query(ExecutiveDocument).filter(ExecutiveDocument.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Документ не найден")
    
    update_data = doc.model_dump(exclude_unset=True)
    # Преобразуем doc_type в Enum, если нужно
    if 'doc_type' in update_data and isinstance(update_data['doc_type'], str):
        try:
            update_data['doc_type'] = DocumentType(update_data['doc_type'])
        except ValueError:
            pass
    
    for field, value in update_data.items():
        setattr(db_doc, field, value)
    
    db.commit()
    db.refresh(db_doc)
    return ExecutiveDoc(
        id=db_doc.id,
        project_id=db_doc.project_id,
        doc_type=db_doc.doc_type.value if hasattr(db_doc.doc_type, 'value') else str(db_doc.doc_type),
        name=db_doc.name,
        number=db_doc.number,
        date=db_doc.date,
        description=db_doc.description,
        file_path=db_doc.file_path,
        created_by=db_doc.created_by,
        approved_by=db_doc.approved_by,
        status=db_doc.status,
        created_at=db_doc.created_at,
        updated_at=db_doc.updated_at
    )


@router.delete("/{doc_id}")
def delete_executive_doc(doc_id: int, db: Session = Depends(get_db)):
    """Удалить документ"""
    db_doc = db.query(ExecutiveDocument).filter(ExecutiveDocument.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Документ не найден")
    db.delete(db_doc)
    db.commit()
    return {"message": "Документ удален"}