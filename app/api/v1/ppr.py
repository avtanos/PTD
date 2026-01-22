from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.ppr import PPR as PPRModel, PPRSection as PPRSectionModel
from pydantic import BaseModel
from datetime import date, datetime

router = APIRouter()


class PPRSectionBase(BaseModel):
    section_type: str
    title: str
    content: Optional[str] = None
    order_number: int = 0
    file_path: Optional[str] = None


class PPRSectionCreate(PPRSectionBase):
    pass


class PPRSection(PPRSectionBase):
    id: int
    ppr_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PPRBase(BaseModel):
    project_id: int
    name: str
    number: Optional[str] = None
    version: Optional[str] = None
    development_date: Optional[date] = None
    developer: Optional[str] = None
    approved_by: Optional[str] = None
    status: str = "draft"
    description: Optional[str] = None
    file_path: Optional[str] = None


class PPRCreate(PPRBase):
    sections: List[PPRSectionCreate] = []


class PPRUpdate(BaseModel):
    name: Optional[str] = None
    number: Optional[str] = None
    version: Optional[str] = None
    development_date: Optional[date] = None
    developer: Optional[str] = None
    approved_by: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    file_path: Optional[str] = None


class PPR(PPRBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    sections: List[PPRSection] = []

    class Config:
        from_attributes = True


@router.get("/", response_model=List[PPR])
def get_pprs(project_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список ППР"""
    try:
        query = db.query(PPRModel)
        if project_id:
            query = query.filter(PPRModel.project_id == project_id)
        pprs = query.offset(skip).limit(limit).all()
        
        result = []
        for ppr in pprs:
            try:
                ppr_dict = {
                    "id": ppr.id,
                    "project_id": ppr.project_id,
                    "name": ppr.name,
                    "number": ppr.number,
                    "version": ppr.version,
                    "development_date": ppr.development_date,
                    "developer": ppr.developer,
                    "approved_by": ppr.approved_by,
                    "status": ppr.status or "draft",
                    "description": ppr.description,
                    "file_path": ppr.file_path,
                    "created_at": ppr.created_at,
                    "updated_at": ppr.updated_at,
                    "sections": [
                        {
                            "id": section.id,
                            "ppr_id": section.ppr_id,
                            "section_type": section.section_type,
                            "title": section.title,
                            "content": section.content,
                            "order_number": section.order_number,
                            "file_path": section.file_path,
                            "created_at": section.created_at,
                            "updated_at": section.updated_at
                        } for section in (ppr.sections or [])
                    ]
                }
                result.append(PPR(**ppr_dict))
            except Exception as e:
                import traceback
                print(f"Error serializing PPR {getattr(ppr, 'id', 'unknown')}: {e}")
                traceback.print_exc()
                continue
        
        return result
    except Exception as e:
        import traceback
        print(f"Error in get_pprs: {e}")
        traceback.print_exc()
        return []


@router.get("/{ppr_id}", response_model=PPR)
def get_ppr(ppr_id: int, db: Session = Depends(get_db)):
    """Получить ППР по ID"""
    ppr = db.query(PPRModel).filter(PPRModel.id == ppr_id).first()
    if not ppr:
        raise HTTPException(status_code=404, detail="ППР не найден")
    
    ppr_dict = {
        "id": ppr.id,
        "project_id": ppr.project_id,
        "name": ppr.name,
        "number": ppr.number,
        "version": ppr.version,
        "development_date": ppr.development_date,
        "developer": ppr.developer,
        "approved_by": ppr.approved_by,
        "status": ppr.status or "draft",
        "description": ppr.description,
        "file_path": ppr.file_path,
        "created_at": ppr.created_at,
        "updated_at": ppr.updated_at,
        "sections": [
            {
                "id": section.id,
                "ppr_id": section.ppr_id,
                "section_type": section.section_type,
                "title": section.title,
                "content": section.content,
                "order_number": section.order_number,
                "file_path": section.file_path,
                "created_at": section.created_at,
                "updated_at": section.updated_at
            } for section in (ppr.sections or [])
        ]
    }
    return PPR(**ppr_dict)


@router.post("/", response_model=PPR)
def create_ppr(ppr: PPRCreate, db: Session = Depends(get_db)):
    """Создать новый ППР"""
    sections_data = ppr.sections
    ppr_data = ppr.model_dump(exclude={"sections"})
    
    db_ppr = PPRModel(**ppr_data)
    db.add(db_ppr)
    db.flush()
    
    for section_data in sections_data:
        section = PPRSectionModel(ppr_id=db_ppr.id, **section_data.model_dump())
        db.add(section)
    
    db.commit()
    db.refresh(db_ppr)
    
    ppr_dict = {
        "id": db_ppr.id,
        "project_id": db_ppr.project_id,
        "name": db_ppr.name,
        "number": db_ppr.number,
        "version": db_ppr.version,
        "development_date": db_ppr.development_date,
        "developer": db_ppr.developer,
        "approved_by": db_ppr.approved_by,
        "status": db_ppr.status or "draft",
        "description": db_ppr.description,
        "file_path": db_ppr.file_path,
        "created_at": db_ppr.created_at,
        "updated_at": db_ppr.updated_at,
        "sections": [
            {
                "id": section.id,
                "ppr_id": section.ppr_id,
                "section_type": section.section_type,
                "title": section.title,
                "content": section.content,
                "order_number": section.order_number,
                "file_path": section.file_path,
                "created_at": section.created_at,
                "updated_at": section.updated_at
            } for section in (db_ppr.sections or [])
        ]
    }
    return PPR(**ppr_dict)


@router.delete("/{ppr_id}")
def delete_ppr(ppr_id: int, db: Session = Depends(get_db)):
    """Удалить ППР"""
    ppr = db.query(PPRModel).filter(PPRModel.id == ppr_id).first()
    if not ppr:
        raise HTTPException(status_code=404, detail="ППР не найден")
    db.delete(ppr)
    db.commit()
    return {"message": "ППР удален"}