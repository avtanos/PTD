from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from app.db.database import get_db
from app.models.application import Application as ApplicationModel, ApplicationItem
from app.models.personnel import Personnel as PersonnelModel
from pydantic import BaseModel
from datetime import date, datetime

router = APIRouter()


class ApplicationItemBase(BaseModel):
    line_number: Optional[int] = None
    material_name: str
    specification: Optional[str] = None
    unit: Optional[str] = None
    quantity: Decimal
    price: Optional[Decimal] = None
    amount: Optional[Decimal] = None
    delivery_date: Optional[date] = None
    notes: Optional[str] = None
    payment_type_id: Optional[int] = None
    counterparty_id: Optional[int] = None
    contractor_id: Optional[int] = None


class ApplicationItemCreate(ApplicationItemBase):
    pass


class ApplicationItem(ApplicationItemBase):
    id: int
    application_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ApplicationBase(BaseModel):
    project_id: int
    application_type: str  # materials, equipment, services, other
    number: str
    date: date
    requested_by: Optional[str] = None
    requested_by_personnel_id: Optional[int] = None
    department: Optional[str] = None
    department_id: Optional[int] = None
    organization_id: Optional[int] = None
    status: str = "draft"  # draft, submitted, in_process, approved, rejected, completed
    basis: Optional[str] = None
    old_number: Optional[str] = None
    material_kind_id: Optional[int] = None
    description: Optional[str] = None
    warehouse: Optional[str] = None
    warehouse_id: Optional[int] = None
    payment_type_id: Optional[int] = None
    counterparty_id: Optional[int] = None
    initiator_counterparty_id: Optional[int] = None
    notes: Optional[str] = None
    author_user_id: Optional[int] = None
    responsible_personnel_id: Optional[int] = None
    comment: Optional[str] = None
    is_posted: Optional[bool] = False


class ApplicationCreate(ApplicationBase):
    items: List[ApplicationItemCreate] = []


class ApplicationUpdate(BaseModel):
    project_id: Optional[int] = None
    application_type: Optional[str] = None
    number: Optional[str] = None
    date: Optional[date] = None
    requested_by: Optional[str] = None
    requested_by_personnel_id: Optional[int] = None
    department: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    warehouse: Optional[str] = None
    notes: Optional[str] = None
    approved_by: Optional[str] = None
    approval_date: Optional[date] = None
    # extended fields
    department_id: Optional[int] = None
    organization_id: Optional[int] = None
    basis: Optional[str] = None
    old_number: Optional[str] = None
    material_kind_id: Optional[int] = None
    warehouse_id: Optional[int] = None
    payment_type_id: Optional[int] = None
    counterparty_id: Optional[int] = None
    initiator_counterparty_id: Optional[int] = None
    author_user_id: Optional[int] = None
    responsible_personnel_id: Optional[int] = None
    comment: Optional[str] = None
    is_posted: Optional[bool] = None
    items: Optional[List[ApplicationItemBase]] = None


class Application(ApplicationBase):
    id: int
    total_amount: Optional[Decimal] = None
    approved_by: Optional[str] = None
    approval_date: Optional[date] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[ApplicationItem] = []

    class Config:
        from_attributes = True


@router.get("/", response_model=List[Application])
def get_applications(
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    application_type: Optional[str] = None,
    number: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Получить список заявок"""
    query = db.query(ApplicationModel)
    if project_id:
        query = query.filter(ApplicationModel.project_id == project_id)
    if status:
        query = query.filter(ApplicationModel.status == status)
    if application_type:
        query = query.filter(ApplicationModel.application_type == application_type)
    if number:
        query = query.filter(ApplicationModel.number.ilike(f"%{number}%"))
    if date_from:
        query = query.filter(ApplicationModel.date >= date_from)
    if date_to:
        query = query.filter(ApplicationModel.date <= date_to)
    applications = query.offset(skip).limit(limit).all()
    return applications


@router.get("/{application_id}", response_model=Application)
def get_application(application_id: int, db: Session = Depends(get_db)):
    """Получить заявку по ID"""
    application = db.query(ApplicationModel).filter(ApplicationModel.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    return application


@router.post("/", response_model=Application)
def create_application(
    application: ApplicationCreate,
    db: Session = Depends(get_db),
    x_user_id: Optional[int] = Header(default=None, alias="X-User-Id"),
):
    """Создать новую заявку"""
    items_data = application.items
    app_data = application.model_dump(exclude={"items"})

    # Автор назначается автоматически (если передан текущий пользователь)
    if x_user_id and not app_data.get("author_user_id"):
        app_data["author_user_id"] = x_user_id
    
    db_application = ApplicationModel(**app_data)
    db.add(db_application)
    db.flush()
    
    total_amount = Decimal(0)
    for item_data in items_data:
        item_payload = item_data.model_dump()
        item = ApplicationItem(application_id=db_application.id, **item_payload)
        db.add(item)
        if item.amount:
            total_amount += item.amount
    
    db_application.total_amount = total_amount
    db.commit()
    db.refresh(db_application)
    return db_application


@router.put("/{application_id}", response_model=Application)
def update_application(application_id: int, application: ApplicationUpdate, db: Session = Depends(get_db)):
    """Обновить заявку"""
    db_application = db.query(ApplicationModel).filter(ApplicationModel.id == application_id).first()
    if not db_application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    update_data = application.model_dump(exclude_unset=True)
    items_payload = update_data.pop("items", None)

    for field, value in update_data.items():
        setattr(db_application, field, value)

    # update items (full replace semantics if provided)
    if items_payload is not None:
        db.query(ApplicationItem).filter(ApplicationItem.application_id == db_application.id).delete()
        total_amount = Decimal(0)
        for idx, item in enumerate(items_payload):
            item_dict = item if isinstance(item, dict) else dict(item)
            if not item_dict.get("line_number"):
                item_dict["line_number"] = idx + 1
            db_item = ApplicationItem(application_id=db_application.id, **item_dict)
            db.add(db_item)
            if db_item.amount:
                total_amount += db_item.amount
        db_application.total_amount = total_amount

    db.commit()
    db.refresh(db_application)
    return db_application


@router.post("/{application_id}/approve", response_model=Application)
def approve_application(application_id: int, db: Session = Depends(get_db)):
    """Утвердить заявку ответственным."""
    app = db.query(ApplicationModel).filter(ApplicationModel.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    if not app.responsible_personnel_id:
        raise HTTPException(status_code=400, detail="Не назначен ответственный")
    resp = db.query(PersonnelModel).filter(PersonnelModel.id == app.responsible_personnel_id).first()
    app.status = "approved"
    app.approval_date = date.today()
    app.approved_by = resp.full_name if resp else f"personnel_id={app.responsible_personnel_id}"
    db.commit()
    db.refresh(app)
    return app


@router.post("/{application_id}/reject", response_model=Application)
def reject_application(application_id: int, db: Session = Depends(get_db)):
    """Отклонить заявку ответственным."""
    app = db.query(ApplicationModel).filter(ApplicationModel.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    if not app.responsible_personnel_id:
        raise HTTPException(status_code=400, detail="Не назначен ответственный")
    resp = db.query(PersonnelModel).filter(PersonnelModel.id == app.responsible_personnel_id).first()
    app.status = "rejected"
    app.approval_date = date.today()
    app.approved_by = resp.full_name if resp else f"personnel_id={app.responsible_personnel_id}"
    db.commit()
    db.refresh(app)
    return app


@router.post("/{application_id}/apply-params")
def apply_params_to_items(
    application_id: int,
    payment_type_id: Optional[int] = None,
    counterparty_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """Применить параметры (вид оплаты/контрагент) ко всем строкам заявки."""
    app = db.query(ApplicationModel).filter(ApplicationModel.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    update_map = {}
    if payment_type_id is not None:
        update_map["payment_type_id"] = payment_type_id
    if counterparty_id is not None:
        update_map["counterparty_id"] = counterparty_id
    if not update_map:
        return {"status": "ok", "updated": 0}
    updated = (
        db.query(ApplicationItem)
        .filter(ApplicationItem.application_id == application_id)
        .update(update_map, synchronize_session=False)
    )
    db.commit()
    return {"status": "ok", "updated": updated}


@router.post("/{application_id}/post", response_model=Application)
def post_application(application_id: int, db: Session = Depends(get_db)):
    """Провести документ (установить is_posted=True)."""
    app = db.query(ApplicationModel).filter(ApplicationModel.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    app.is_posted = True
    if app.status == "draft":
        app.status = "submitted"
    db.commit()
    db.refresh(app)
    return app


@router.post("/{application_id}/unpost", response_model=Application)
def unpost_application(application_id: int, db: Session = Depends(get_db)):
    """Отменить проведение (установить is_posted=False)."""
    app = db.query(ApplicationModel).filter(ApplicationModel.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    app.is_posted = False
    db.commit()
    db.refresh(app)
    return app


@router.delete("/{application_id}")
def delete_application(application_id: int, db: Session = Depends(get_db)):
    """Удалить заявку"""
    application = db.query(ApplicationModel).filter(ApplicationModel.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    db.delete(application)
    db.commit()
    return {"message": "Заявка удалена"}