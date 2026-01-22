from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from app.db.database import get_db
from app.models.project_change import ProjectChange as ProjectChangeModel, ChangeApproval as ChangeApprovalModel, Defect as DefectModel
from pydantic import BaseModel
from datetime import date, datetime

router = APIRouter()


class ChangeApprovalBase(BaseModel):
    order_number: int
    approver_role: str
    approver_name: Optional[str] = None
    is_parallel: bool = False
    is_required: bool = True


class ChangeApprovalCreate(ChangeApprovalBase):
    pass


class ChangeApproval(ChangeApprovalBase):
    id: int
    project_change_id: int
    status: str
    comment: Optional[str] = None
    approved_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProjectChangeBase(BaseModel):
    project_id: int
    change_type: str
    change_number: str
    title: str
    description: str
    justification: Optional[str] = None
    impact_volume: Optional[Decimal] = None
    impact_cost: Optional[Decimal] = None
    impact_schedule: Optional[int] = None
    related_document_id: Optional[int] = None
    related_construct_id: Optional[int] = None
    initiator: str
    initiator_date: date
    file_path: Optional[str] = None
    notes: Optional[str] = None


class ProjectChangeCreate(ProjectChangeBase):
    approvals: List[ChangeApprovalCreate] = []


class ProjectChangeUpdate(BaseModel):
    change_type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    justification: Optional[str] = None
    impact_volume: Optional[Decimal] = None
    impact_cost: Optional[Decimal] = None
    impact_schedule: Optional[int] = None
    status: Optional[str] = None
    file_path: Optional[str] = None
    notes: Optional[str] = None


class ProjectChange(ProjectChangeBase):
    id: int
    status: str
    approved_date: Optional[date] = None
    implemented_date: Optional[date] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    approvals: List[ChangeApproval] = []

    class Config:
        from_attributes = True


@router.get("/", response_model=List[ProjectChange])
def get_project_changes(project_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список изменений проекта"""
    try:
        from sqlalchemy import text
        
        # Используем raw SQL для обхода проблем с Enum
        sql = """
            SELECT id, project_id, change_type, change_number, title, description,
                   justification, impact_volume, impact_cost, impact_schedule,
                   related_document_id, related_construct_id, initiator, initiator_date,
                   status, approved_date, implemented_date, file_path, notes,
                   created_at, updated_at
            FROM project_changes
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
        
        # Получаем approvals отдельно
        change_ids = [row[0] for row in rows]
        approvals_map = {}
        if change_ids:
            # Используем параметризованный запрос для безопасности
            placeholders = ",".join([f":id{i}" for i in range(len(change_ids))])
            approvals_sql = f"""
                SELECT id, project_change_id, order_number, approver_role, approver_name,
                       is_parallel, is_required, status, comment, approved_date,
                       created_at, updated_at
                FROM change_approvals
                WHERE project_change_id IN ({placeholders})
            """
            approvals_params = {f"id{i}": change_ids[i] for i in range(len(change_ids))}
            approvals_rows = db.execute(text(approvals_sql), approvals_params).fetchall()
            
            for app_row in approvals_rows:
                change_id = app_row[1]
                if change_id not in approvals_map:
                    approvals_map[change_id] = []
                approvals_map[change_id].append({
                    "id": app_row[0],
                    "project_change_id": app_row[1],
                    "order_number": app_row[2],
                    "approver_role": app_row[3],
                    "approver_name": app_row[4],
                    "is_parallel": bool(app_row[5]) if app_row[5] is not None else False,
                    "is_required": bool(app_row[6]) if app_row[6] is not None else True,
                    "status": str(app_row[7]) if app_row[7] else "pending",
                    "comment": app_row[8],
                    "approved_date": app_row[9],
                    "created_at": app_row[10],
                    "updated_at": app_row[11]
                })
        
        # Преобразуем строки в схемы
        result = []
        for row in rows:
            try:
                change_dict = {
                    "id": row[0],
                    "project_id": row[1],
                    "change_type": str(row[2]) if row[2] else "other",
                    "change_number": row[3],
                    "title": row[4],
                    "description": row[5],
                    "justification": row[6],
                    "impact_volume": float(row[7]) if row[7] is not None else None,
                    "impact_cost": float(row[8]) if row[8] is not None else None,
                    "impact_schedule": int(row[9]) if row[9] is not None else None,
                    "related_document_id": row[10],
                    "related_construct_id": row[11],
                    "initiator": row[12],
                    "initiator_date": row[13],
                    "status": str(row[14]) if row[14] else "draft",
                    "approved_date": row[15],
                    "implemented_date": row[16],
                    "file_path": row[17],
                    "notes": row[18],
                    "created_at": row[19],
                    "updated_at": row[20],
                    "approvals": approvals_map.get(row[0], [])
                }
                result.append(ProjectChange(**change_dict))
            except Exception as e:
                import traceback
                print(f"Error serializing change {row[0] if row else 'unknown'}: {e}")
                traceback.print_exc()
                continue
        
        return result
    except Exception as e:
        import traceback
        print(f"Error in get_project_changes: {e}")
        traceback.print_exc()
        return []


@router.get("/{change_id}", response_model=ProjectChange)
def get_project_change(change_id: int, db: Session = Depends(get_db)):
    """Получить изменение по ID"""
    change = db.query(ProjectChangeModel).filter(ProjectChangeModel.id == change_id).first()
    if not change:
        raise HTTPException(status_code=404, detail="Изменение не найдено")
    return change


@router.post("/", response_model=ProjectChange)
def create_project_change(change: ProjectChangeCreate, db: Session = Depends(get_db)):
    """Создать изменение проекта"""
    approvals_data = change.approvals
    change_data = change.model_dump(exclude={"approvals"})
    
    # Преобразуем строки в Enum для сохранения в БД
    from app.models.project_change import ChangeType, ChangeStatus
    if 'change_type' in change_data and change_data['change_type']:
        try:
            change_data['change_type'] = ChangeType(change_data['change_type'])
        except (ValueError, KeyError):
            pass
    
    change_data['status'] = ChangeStatus.DRAFT
    
    db_change = ProjectChangeModel(**change_data)
    db.add(db_change)
    db.flush()
    
    for approval_data in approvals_data:
        approval = ChangeApprovalModel(project_change_id=db_change.id, **approval_data.model_dump())
        db.add(approval)
    
    db.commit()
    db.refresh(db_change)
    
    # Преобразуем обратно для ответа
    change_dict = {
        "id": db_change.id,
        "project_id": db_change.project_id,
        "change_type": db_change.change_type.value if hasattr(db_change.change_type, 'value') else str(db_change.change_type),
        "change_number": db_change.change_number,
        "title": db_change.title,
        "description": db_change.description,
        "justification": db_change.justification,
        "impact_volume": db_change.impact_volume,
        "impact_cost": db_change.impact_cost,
        "impact_schedule": db_change.impact_schedule,
        "related_document_id": db_change.related_document_id,
        "related_construct_id": db_change.related_construct_id,
        "initiator": db_change.initiator,
        "initiator_date": db_change.initiator_date,
        "status": db_change.status.value if hasattr(db_change.status, 'value') else str(db_change.status),
        "approved_date": db_change.approved_date,
        "implemented_date": db_change.implemented_date,
        "file_path": db_change.file_path,
        "notes": db_change.notes,
        "created_at": db_change.created_at,
        "updated_at": db_change.updated_at,
        "approvals": []
    }
    return ProjectChange(**change_dict)


@router.put("/{change_id}", response_model=ProjectChange)
def update_project_change(change_id: int, change: ProjectChangeUpdate, db: Session = Depends(get_db)):
    """Обновить изменение проекта"""
    db_change = db.query(ProjectChangeModel).filter(ProjectChangeModel.id == change_id).first()
    if not db_change:
        raise HTTPException(status_code=404, detail="Изменение не найдено")
    
    update_data = change.model_dump(exclude_unset=True)
    
    # Преобразуем строки в Enum если нужно
    from app.models.project_change import ChangeType, ChangeStatus
    if 'change_type' in update_data and update_data['change_type']:
        try:
            update_data['change_type'] = ChangeType(update_data['change_type'])
        except (ValueError, KeyError):
            pass
    if 'status' in update_data and update_data['status']:
        try:
            update_data['status'] = ChangeStatus(update_data['status'])
        except (ValueError, KeyError):
            pass
    
    for field, value in update_data.items():
        setattr(db_change, field, value)
    
    db.commit()
    db.refresh(db_change)
    
    # Преобразуем обратно для ответа
    change_dict = {
        "id": db_change.id,
        "project_id": db_change.project_id,
        "change_type": db_change.change_type.value if hasattr(db_change.change_type, 'value') else str(db_change.change_type),
        "change_number": db_change.change_number,
        "title": db_change.title,
        "description": db_change.description,
        "justification": db_change.justification,
        "impact_volume": db_change.impact_volume,
        "impact_cost": db_change.impact_cost,
        "impact_schedule": db_change.impact_schedule,
        "related_document_id": db_change.related_document_id,
        "related_construct_id": db_change.related_construct_id,
        "initiator": db_change.initiator,
        "initiator_date": db_change.initiator_date,
        "status": db_change.status.value if hasattr(db_change.status, 'value') else str(db_change.status),
        "approved_date": db_change.approved_date,
        "implemented_date": db_change.implemented_date,
        "file_path": db_change.file_path,
        "notes": db_change.notes,
        "created_at": db_change.created_at,
        "updated_at": db_change.updated_at,
        "approvals": [
            {
                "id": a.id,
                "project_change_id": a.project_change_id,
                "order_number": a.order_number,
                "approver_role": a.approver_role,
                "approver_name": a.approver_name,
                "is_parallel": a.is_parallel,
                "is_required": a.is_required,
                "status": a.status.value if hasattr(a.status, 'value') else str(a.status),
                "comment": a.comment,
                "approved_date": a.approved_date,
                "created_at": a.created_at,
                "updated_at": a.updated_at
            } for a in (db_change.approvals or [])
        ]
    }
    return ProjectChange(**change_dict)


@router.put("/{change_id}/approve/{approval_id}", response_model=ChangeApproval)
def approve_change(change_id: int, approval_id: int, status: str, comment: Optional[str] = None, db: Session = Depends(get_db)):
    """Согласовать изменение"""
    approval = db.query(ChangeApprovalModel).filter(
        ChangeApprovalModel.id == approval_id,
        ChangeApprovalModel.project_change_id == change_id
    ).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Согласование не найдено")
    
    approval.status = status
    approval.comment = comment
    approval.approved_date = datetime.now()
    
    # Проверка, все ли обязательные согласования пройдены
    change = db.query(ProjectChangeModel).filter(ProjectChangeModel.id == change_id).first()
    required_approvals = [a for a in change.approvals if a.is_required and a.status != "approved"]
    if not required_approvals:
        change.status = "approved"
        change.approved_date = date.today()
    
    db.commit()
    db.refresh(approval)
    return approval


@router.delete("/{change_id}")
def delete_project_change(change_id: int, db: Session = Depends(get_db)):
    """Удалить изменение"""
    change = db.query(ProjectChangeModel).filter(ProjectChangeModel.id == change_id).first()
    if not change:
        raise HTTPException(status_code=404, detail="Изменение не найдено")
    db.delete(change)
    db.commit()
    return {"message": "Изменение удалено"}


# Defects endpoints
class DefectBase(BaseModel):
    project_id: int
    project_change_id: Optional[int] = None
    defect_number: Optional[str] = None
    title: str
    description: str
    severity: str = "medium"
    location: Optional[str] = None
    detected_by: Optional[str] = None
    detected_date: date
    responsible: Optional[str] = None
    due_date: Optional[date] = None
    photos: Optional[str] = None
    notes: Optional[str] = None


class DefectCreate(DefectBase):
    pass


class Defect(DefectBase):
    id: int
    status: str
    fixed_date: Optional[date] = None
    fixed_by: Optional[str] = None
    verified_date: Optional[date] = None
    verified_by: Optional[str] = None
    fix_confirmation: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/defects/", response_model=List[Defect])
def get_defects(project_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список замечаний"""
    query = db.query(DefectModel)
    if project_id:
        query = query.filter(DefectModel.project_id == project_id)
    defects = query.offset(skip).limit(limit).all()
    return defects


@router.post("/defects/", response_model=Defect)
def create_defect(defect: DefectCreate, db: Session = Depends(get_db)):
    """Создать замечание"""
    db_defect = DefectModel(**defect.model_dump())
    db.add(db_defect)
    db.commit()
    db.refresh(db_defect)
    return db_defect


@router.put("/defects/{defect_id}/fix", response_model=Defect)
def mark_defect_fixed(defect_id: int, fixed_by: str, fix_confirmation: str, db: Session = Depends(get_db)):
    """Отметить замечание как устраненное"""
    defect = db.query(DefectModel).filter(DefectModel.id == defect_id).first()
    if not defect:
        raise HTTPException(status_code=404, detail="Замечание не найдено")
    
    defect.status = "fixed"
    defect.fixed_by = fixed_by
    defect.fixed_date = date.today()
    defect.fix_confirmation = fix_confirmation
    
    db.commit()
    db.refresh(defect)
    return defect