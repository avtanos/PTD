from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.executive_survey import ExecutiveSurvey as ExecutiveSurveyModel
from pydantic import BaseModel
from datetime import date, datetime

router = APIRouter()


class ExecutiveSurveyBase(BaseModel):
    project_id: int
    survey_type: str
    number: Optional[str] = None
    survey_date: date
    surveyor: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    coordinates: Optional[str] = None
    file_path: Optional[str] = None
    drawing_path: Optional[str] = None
    status: str = "completed"
    notes: Optional[str] = None


class ExecutiveSurveyCreate(ExecutiveSurveyBase):
    pass


class ExecutiveSurveyUpdate(BaseModel):
    project_id: Optional[int] = None
    survey_type: Optional[str] = None
    number: Optional[str] = None
    survey_date: Optional[date] = None
    surveyor: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    coordinates: Optional[str] = None
    file_path: Optional[str] = None
    drawing_path: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class ExecutiveSurvey(ExecutiveSurveyBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/", response_model=List[ExecutiveSurvey])
def get_surveys(project_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список исполнительных съемок"""
    try:
        from sqlalchemy import text
        
        # Используем raw SQL для обхода проблем с Enum
        sql = """
            SELECT id, project_id, survey_type, number, survey_date, surveyor,
                   department, description, coordinates, file_path, drawing_path,
                   status, notes, created_at, updated_at
            FROM executive_surveys
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
                survey_dict = {
                    "id": row[0],
                    "project_id": row[1],
                    "survey_type": str(row[2]) if row[2] else "other",
                    "number": row[3],
                    "survey_date": row[4],
                    "surveyor": row[5],
                    "department": row[6],
                    "description": row[7],
                    "coordinates": row[8],
                    "file_path": row[9],
                    "drawing_path": row[10],
                    "status": row[11] or "completed",
                    "notes": row[12],
                    "created_at": row[13],
                    "updated_at": row[14]
                }
                result.append(ExecutiveSurvey(**survey_dict))
            except Exception as e:
                import traceback
                print(f"Error serializing survey {row[0] if row else 'unknown'}: {e}")
                traceback.print_exc()
                continue
        
        return result
    except Exception as e:
        import traceback
        print(f"Error in get_surveys: {e}")
        traceback.print_exc()
        return []


@router.get("/{survey_id}", response_model=ExecutiveSurvey)
def get_survey(survey_id: int, db: Session = Depends(get_db)):
    """Получить съемку по ID"""
    survey = db.query(ExecutiveSurveyModel).filter(ExecutiveSurveyModel.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Съемка не найдена")
    
    # Преобразуем Enum в строку для сериализации
    survey_dict = {
        "id": survey.id,
        "project_id": survey.project_id,
        "survey_type": survey.survey_type.value if hasattr(survey.survey_type, 'value') else str(survey.survey_type),
        "number": survey.number,
        "survey_date": survey.survey_date,
        "surveyor": survey.surveyor,
        "department": survey.department,
        "description": survey.description,
        "coordinates": survey.coordinates,
        "file_path": survey.file_path,
        "drawing_path": survey.drawing_path,
        "status": survey.status,
        "notes": survey.notes,
        "created_at": survey.created_at,
        "updated_at": survey.updated_at
    }
    return ExecutiveSurvey(**survey_dict)


@router.post("/", response_model=ExecutiveSurvey)
def create_survey(survey: ExecutiveSurveyCreate, db: Session = Depends(get_db)):
    """Создать исполнительную съемку"""
    survey_data = survey.model_dump()
    
    # Преобразуем строки в Enum для сохранения в БД
    from app.models.executive_survey import SurveyType
    if 'survey_type' in survey_data and survey_data['survey_type']:
        try:
            survey_data['survey_type'] = SurveyType(survey_data['survey_type'])
        except (ValueError, KeyError):
            pass
    
    db_survey = ExecutiveSurveyModel(**survey_data)
    db.add(db_survey)
    db.commit()
    db.refresh(db_survey)
    
    # Преобразуем обратно для ответа
    survey_dict = {
        "id": db_survey.id,
        "project_id": db_survey.project_id,
        "survey_type": db_survey.survey_type.value if hasattr(db_survey.survey_type, 'value') else str(db_survey.survey_type),
        "number": db_survey.number,
        "survey_date": db_survey.survey_date,
        "surveyor": db_survey.surveyor,
        "department": db_survey.department,
        "description": db_survey.description,
        "coordinates": db_survey.coordinates,
        "file_path": db_survey.file_path,
        "drawing_path": db_survey.drawing_path,
        "status": db_survey.status,
        "notes": db_survey.notes,
        "created_at": db_survey.created_at,
        "updated_at": db_survey.updated_at
    }
    return ExecutiveSurvey(**survey_dict)


@router.put("/{survey_id}", response_model=ExecutiveSurvey)
def update_survey(survey_id: int, survey: ExecutiveSurveyUpdate, db: Session = Depends(get_db)):
    """Обновить исполнительную съемку"""
    db_survey = db.query(ExecutiveSurveyModel).filter(ExecutiveSurveyModel.id == survey_id).first()
    if not db_survey:
        raise HTTPException(status_code=404, detail="Съемка не найдена")
    
    update_data = survey.model_dump(exclude_unset=True)
    
    # Преобразуем строки в Enum если нужно
    from app.models.executive_survey import SurveyType
    if 'survey_type' in update_data and update_data['survey_type']:
        try:
            update_data['survey_type'] = SurveyType(update_data['survey_type'])
        except (ValueError, KeyError):
            pass
    
    for field, value in update_data.items():
        setattr(db_survey, field, value)
    
    db.commit()
    db.refresh(db_survey)
    
    # Преобразуем обратно для ответа
    survey_dict = {
        "id": db_survey.id,
        "project_id": db_survey.project_id,
        "survey_type": db_survey.survey_type.value if hasattr(db_survey.survey_type, 'value') else str(db_survey.survey_type),
        "number": db_survey.number,
        "survey_date": db_survey.survey_date,
        "surveyor": db_survey.surveyor,
        "department": db_survey.department,
        "description": db_survey.description,
        "coordinates": db_survey.coordinates,
        "file_path": db_survey.file_path,
        "drawing_path": db_survey.drawing_path,
        "status": db_survey.status,
        "notes": db_survey.notes,
        "created_at": db_survey.created_at,
        "updated_at": db_survey.updated_at
    }
    return ExecutiveSurvey(**survey_dict)


@router.delete("/{survey_id}")
def delete_survey(survey_id: int, db: Session = Depends(get_db)):
    """Удалить исполнительную съемку"""
    survey = db.query(ExecutiveSurveyModel).filter(ExecutiveSurveyModel.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Съемка не найдена")
    db.delete(survey)
    db.commit()
    return {"message": "Съемка удалена"}