from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.application_workflow import ApplicationWorkflow as ApplicationWorkflowModel
from app.models.application import Application as ApplicationModel
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class ApplicationWorkflowBase(BaseModel):
    order_number: int
    approver_role: str
    approver_name: Optional[str] = None
    approver_department: Optional[str] = None
    is_parallel: bool = False
    is_required: bool = True


class ApplicationWorkflowCreate(ApplicationWorkflowBase):
    pass


class ApplicationWorkflow(ApplicationWorkflowBase):
    id: int
    application_id: int
    status: str
    comment: Optional[str] = None
    approved_date: Optional[datetime] = None
    notification_sent: bool
    notification_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.post("/applications/{application_id}/workflow", response_model=ApplicationWorkflow)
def create_application_workflow(application_id: int, workflow: ApplicationWorkflowCreate, db: Session = Depends(get_db)):
    """Создать этап согласования заявки"""
    application = db.query(ApplicationModel).filter(ApplicationModel.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    db_workflow = ApplicationWorkflowModel(application_id=application_id, **workflow.model_dump())
    db.add(db_workflow)
    db.commit()
    db.refresh(db_workflow)
    return db_workflow


@router.get("/applications/{application_id}/workflow", response_model=List[ApplicationWorkflow])
def get_application_workflow(application_id: int, db: Session = Depends(get_db)):
    """Получить workflow согласования заявки"""
    workflow = db.query(ApplicationWorkflowModel).filter(
        ApplicationWorkflowModel.application_id == application_id
    ).order_by(ApplicationWorkflowModel.order_number).all()
    return workflow


@router.put("/applications/{application_id}/workflow/{workflow_id}/approve", response_model=ApplicationWorkflow)
def approve_application(application_id: int, workflow_id: int, status: str, comment: Optional[str] = None, db: Session = Depends(get_db)):
    """Согласовать заявку на этапе workflow"""
    workflow = db.query(ApplicationWorkflowModel).filter(
        ApplicationWorkflowModel.id == workflow_id,
        ApplicationWorkflowModel.application_id == application_id
    ).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Этап согласования не найден")
    
    workflow.status = status
    workflow.comment = comment
    workflow.approved_date = datetime.now()
    
    # Проверка, все ли обязательные согласования пройдены
    application = db.query(ApplicationModel).filter(ApplicationModel.id == application_id).first()
    required_approvals = [w for w in application.workflow if w.is_required and w.status != "approved"]
    if not required_approvals:
        application.status = "approved"
        if not application.approval_date:
            from datetime import date
            application.approval_date = date.today()
            application.approved_by = workflow.approver_name
    
    db.commit()
    db.refresh(workflow)
    return workflow