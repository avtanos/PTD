from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import date, datetime, timedelta
from pathlib import Path
import os
import shutil
from app.db.database import get_db
from app.models.document_roadmap import (
    DocumentRoadmapSection as SectionModel,
    DocumentSectionStatus as StatusModel,
    DocumentFile as FileModel,
    ExecutionStatus,
    DocumentStatus
)
from app.models.document_notification import DocumentNotification as NotificationModel, NotificationType, NotificationChannel
from app.models.project import Project
from app.models.project_documentation import ProjectDocumentation as ProjectDocumentationModel
from app.models.executive_survey import ExecutiveSurvey as ExecutiveSurveyModel
from app.models.executive_doc import ExecutiveDocument as ExecutiveDocumentModel
from pydantic import BaseModel

router = APIRouter()

# Настройки для хранения файлов
UPLOAD_DIR = Path("uploads/documents")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# Pydantic схемы
class SectionBase(BaseModel):
    code: str
    name: str
    parent_code: Optional[str] = None
    order_number: int = 0
    description: Optional[str] = None


class Section(SectionBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class StatusBase(BaseModel):
    project_id: int
    section_code: str
    request_date: Optional[date] = None
    due_date: Optional[date] = None
    valid_until_date: Optional[date] = None
    executor_company: Optional[str] = None
    executor_authority: Optional[str] = None
    execution_status: str = "not_started"
    note: Optional[str] = None


class StatusCreate(StatusBase):
    pass


class StatusUpdate(BaseModel):
    request_date: Optional[date] = None
    due_date: Optional[date] = None
    valid_until_date: Optional[date] = None
    executor_company: Optional[str] = None
    executor_authority: Optional[str] = None
    execution_status: Optional[str] = None
    note: Optional[str] = None


class Status(StatusBase):
    id: int
    document_status: Optional[str] = None
    document_status_calculated_at: Optional[datetime] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    files_count: int = 0

    class Config:
        from_attributes = True


class FileInfo(BaseModel):
    id: int
    file_name: str
    stored_path: str
    file_size: Optional[int] = None
    mime_type: str
    uploaded_by: Optional[str] = None
    uploaded_at: datetime
    description: Optional[str] = None

    class Config:
        from_attributes = True


def calculate_document_status(valid_until_date: Optional[date]) -> Optional[DocumentStatus]:
    """Рассчитывает статус документа на основе срока действия"""
    if not valid_until_date:
        return None
    
    today = date.today()
    days_left = (valid_until_date - today).days
    
    if days_left < 0:
        return DocumentStatus.EXPIRED
    elif days_left <= 7:
        return DocumentStatus.EXPIRING
    elif days_left <= 30:
        return DocumentStatus.EXPIRING
    else:
        return DocumentStatus.VALID


def _create_document_expiry_notifications(status: StatusModel, section: SectionModel, db: Session):
    """Создает уведомления о сроках действия документов"""
    if not status.valid_until_date or not section:
        return
    
    today = date.today()
    days_left = (status.valid_until_date - today).days
    
    # Проверяем, не созданы ли уже уведомления для этого статуса
    existing_notifications = db.query(NotificationModel).filter(
        and_(
            NotificationModel.status_id == status.id,
            NotificationModel.notification_type.in_([
                NotificationType.DOCUMENT_30_DAYS,
                NotificationType.DOCUMENT_7_DAYS,
                NotificationType.DOCUMENT_EXPIRED
            ])
        )
    ).all()
    
    existing_types = {n.notification_type for n in existing_notifications}
    
    # Уведомление за 30 дней
    if 7 < days_left <= 30 and NotificationType.DOCUMENT_30_DAYS not in existing_types:
        notification = NotificationModel(
            status_id=status.id,
            notification_type=NotificationType.DOCUMENT_30_DAYS,
            channel=NotificationChannel.IN_APP,
            title="Внимание! До истечения срока действия документа осталось 30 дней",
            message=f"Внимание! До истечения срока действия документа по разделу '{section.name}' осталось 30 дней. Дата истечения: {status.valid_until_date.strftime('%d.%m.%Y')}"
        )
        db.add(notification)
    
    # Уведомление за 7 дней
    elif 0 < days_left <= 7 and NotificationType.DOCUMENT_7_DAYS not in existing_types:
        notification = NotificationModel(
            status_id=status.id,
            notification_type=NotificationType.DOCUMENT_7_DAYS,
            channel=NotificationChannel.IN_APP,
            title="СРОЧНО! До истечения срока действия документа осталось 7 дней",
            message=f"СРОЧНО! До истечения срока действия документа по разделу '{section.name}' осталось 7 дней. Дата истечения: {status.valid_until_date.strftime('%d.%m.%Y')}. Пример: 'остается неделя до истечения срока действия документа, {status.valid_until_date.strftime('%d.%m.%Y')} истечет'"
        )
        db.add(notification)
    
    # Уведомление о просрочке
    elif days_left < 0 and NotificationType.DOCUMENT_EXPIRED not in existing_types:
        notification = NotificationModel(
            status_id=status.id,
            notification_type=NotificationType.DOCUMENT_EXPIRED,
            channel=NotificationChannel.IN_APP,
            title="ПРОСРОЧЕНО! Срок действия документа истек",
            message=f"ПРОСРОЧЕНО! Срок действия документа по разделу '{section.name}' истек {status.valid_until_date.strftime('%d.%m.%Y')}"
        )
        db.add(notification)
    
    db.commit()


def _map_external_status_to_execution(external: Optional[str]) -> ExecutionStatus:
    """Маппинг статуса из других разделов (проектная документация, съемки, исполнительная) в ExecutionStatus."""
    if not external:
        return ExecutionStatus.NOT_STARTED
    s = (external or "").strip().lower()
    if s in ("completed", "completed", "approved", "signed", "done", "выполнено", "завершен"):
        return ExecutionStatus.COMPLETED
    if s in ("in_progress", "in_work", "in progress", "в работе"):
        return ExecutionStatus.IN_PROGRESS
    if s in ("on_approval", "in_review", "on approval", "на согласовании"):
        return ExecutionStatus.ON_APPROVAL
    return ExecutionStatus.NOT_STARTED


def _sync_status_from_sources(project_id: int, status: StatusModel, section_code: str, db: Session) -> None:
    """
    Подтягивает данные в статус дорожной карты из проектной документации, исполнительных съемок и исполнительной документации.
    Обновляет только пустые поля (не перезаписывает уже заполненное).
    """
    # working.survey — Акт выноса в натуру → исполнительная съемка типа marking
    if section_code == "working.survey":
        row = db.query(ExecutiveSurveyModel).filter(
            and_(
                ExecutiveSurveyModel.project_id == project_id,
                ExecutiveSurveyModel.survey_type == "marking"
            )
        ).order_by(ExecutiveSurveyModel.survey_date.desc()).first()
        if row:
            if not status.request_date and row.survey_date:
                status.request_date = row.survey_date
            if not status.executor_company and row.surveyor:
                status.executor_company = row.surveyor
            if not status.executor_authority and row.department:
                status.executor_authority = row.department
            status.execution_status = _map_external_status_to_execution(getattr(row, "status", None) or "completed")
        return

    # sketch.geo — Инженерно-геологические условия → исполнительная съемка (control/executive) или проектная документация с гео
    if section_code == "sketch.geo":
        row = db.query(ExecutiveSurveyModel).filter(
            and_(
                ExecutiveSurveyModel.project_id == project_id,
                or_(ExecutiveSurveyModel.survey_type == "control", ExecutiveSurveyModel.survey_type == "executive")
            )
        ).order_by(ExecutiveSurveyModel.survey_date.desc()).first()
        if not row:
            row = db.query(ProjectDocumentationModel).filter(
                and_(
                    ProjectDocumentationModel.project_id == project_id,
                    ProjectDocumentationModel.is_active == True
                )
            ).filter(
                or_(ProjectDocumentationModel.name.ilike("%геолог%"), ProjectDocumentationModel.name.ilike("%изыскан%"))
            ).order_by(ProjectDocumentationModel.development_date.desc()).first()
            if row:
                if not status.request_date and getattr(row, "development_date", None):
                    status.request_date = row.development_date
                if not status.due_date and getattr(row, "approval_date", None):
                    status.due_date = row.approval_date
                if not status.executor_company and getattr(row, "developer", None):
                    status.executor_company = row.developer
                if not status.executor_authority and getattr(row, "approved_by", None):
                    status.executor_authority = row.approved_by
                status.execution_status = ExecutionStatus.COMPLETED if getattr(row, "approval_date", None) else ExecutionStatus.IN_PROGRESS
            return
        if row:
            if not status.request_date and row.survey_date:
                status.request_date = row.survey_date
            if not status.executor_company and row.surveyor:
                status.executor_company = row.surveyor
            if not status.executor_authority and row.department:
                status.executor_authority = row.department
            status.execution_status = _map_external_status_to_execution(getattr(row, "status", None))
        return

    # Секции проектной документации: по doc_type или по подстроке в name
    _doc_type_and_name_map = [
        ("working.genplan", None, ["стройгенплан", "генплан"]),
        ("working.gp_ar", "ar", ["архитектур", "гп ар", "генплан"]),
        ("working.ppr", None, ["ппр", "план производственных"]),
        ("sketch.itc.heat", None, ["теплоснабж", "тепло"]),
        ("sketch.itc.power", None, ["электроснабж", "электро"]),
        ("sketch.itc.water", None, ["водопровод", "канализация", "вк"]),
        ("sketch.itc.gas", None, ["газоснабж", "газ"]),
        ("sketch.itc.phone", None, ["телефонизация", "связь"]),
        ("sketch.urban", None, ["градостроительн", "заключение"]),
        ("working.gp_ar.mchs", None, ["мчс"]),
        ("working.gp_ar.sanepid", None, ["санэпид", "санэпидем"]),
        ("working.gp_ar.mpret", None, ["мпрет", "экология"]),
    ]
    for sec, doc_type, keywords in _doc_type_and_name_map:
        if sec != section_code:
            continue
        q = db.query(ProjectDocumentationModel).filter(
            and_(
                ProjectDocumentationModel.project_id == project_id,
                ProjectDocumentationModel.is_active == True
            )
        )
        if doc_type:
            q = q.filter(ProjectDocumentationModel.doc_type == doc_type)
        if keywords:
            cond = or_(*[ProjectDocumentationModel.name.ilike(f"%{k}%") for k in keywords])
            q = q.filter(cond)
        row = q.order_by(ProjectDocumentationModel.development_date.desc()).first()
        if row:
            if not status.request_date and row.development_date:
                status.request_date = row.development_date
            if not status.due_date and row.approval_date:
                status.due_date = row.approval_date
            if not status.executor_company and row.developer:
                status.executor_company = row.developer
            if not status.executor_authority and row.approved_by:
                status.executor_authority = row.approved_by
            status.execution_status = ExecutionStatus.COMPLETED if row.approval_date else ExecutionStatus.IN_PROGRESS
        return


# Endpoints для секций дорожной карты
@router.get("/sections/", response_model=List[Section])
def get_sections(db: Session = Depends(get_db)):
    """Получить все секции дорожной карты"""
    sections = db.query(SectionModel).filter(SectionModel.is_active == True).order_by(SectionModel.order_number).all()
    return sections


@router.get("/sections/{section_code}", response_model=Section)
def get_section(section_code: str, db: Session = Depends(get_db)):
    """Получить секцию по коду"""
    section = db.query(SectionModel).filter(SectionModel.code == section_code).first()
    if not section:
        raise HTTPException(status_code=404, detail="Секция не найдена")
    return section


@router.post("/projects/{project_id}/init-statuses", response_model=List[Status])
def init_project_statuses(project_id: int, db: Session = Depends(get_db)):
    """
    Массовая инициализация блоков дорожной карты для объекта (проекта).
    Создаёт статусы для всех секций, где их ещё нет, и подтягивает данные из разделов:
    проектная документация, исполнительные съемки, исполнительная документация.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    sections = db.query(SectionModel).filter(SectionModel.is_active == True).order_by(SectionModel.order_number).all()
    created_count = 0
    for section in sections:
        existing = db.query(StatusModel).filter(
            and_(
                StatusModel.project_id == project_id,
                StatusModel.section_code == section.code
            )
        ).first()
        if not existing:
            db_status = StatusModel(
                project_id=project_id,
                section_id=section.id,
                section_code=section.code,
                execution_status=ExecutionStatus.NOT_STARTED,
            )
            db.add(db_status)
            db.flush()
            created_count += 1
            existing = db_status

        _sync_status_from_sources(project_id, existing, section.code, db)

    db.commit()

    # Возвращаем актуальный список статусов для проекта
    statuses = db.query(StatusModel).filter(StatusModel.project_id == project_id).all()
    result = []
    for st in statuses:
        doc_status = calculate_document_status(st.valid_until_date)
        if doc_status:
            st.document_status = doc_status
            st.document_status_calculated_at = datetime.now()
        files_count = db.query(FileModel).filter(
            and_(FileModel.status_id == st.id, FileModel.is_active == True)
        ).count()
        status_dict = {
            **{c.name: getattr(st, c.name) for c in st.__table__.columns},
            "files_count": files_count
        }
        status_dict["execution_status"] = getattr(st.execution_status, "value", str(st.execution_status))
        if st.document_status:
            status_dict["document_status"] = st.document_status.value
        result.append(Status(**status_dict))
    return result


# Endpoints для статусов
@router.get("/statuses/", response_model=List[Status])
def get_statuses(project_id: Optional[int] = None, section_code: Optional[str] = None, db: Session = Depends(get_db)):
    """Получить статусы узлов дорожной карты"""
    query = db.query(StatusModel)
    
    if project_id:
        query = query.filter(StatusModel.project_id == project_id)
    if section_code:
        query = query.filter(StatusModel.section_code == section_code)
    
    statuses = query.all()
    
    # Рассчитываем статусы документов и добавляем количество файлов
    result = []
    for status in statuses:
        # Пересчитываем статус документа
        doc_status = calculate_document_status(status.valid_until_date)
        if doc_status:
            status.document_status = doc_status.value
            status.document_status_calculated_at = datetime.now()
        
        # Подсчитываем файлы
        files_count = db.query(FileModel).filter(
            and_(FileModel.status_id == status.id, FileModel.is_active == True)
        ).count()
        
        status_dict = {
            **{c.name: getattr(status, c.name) for c in status.__table__.columns},
            "files_count": files_count
        }
        if status.document_status:
            status_dict["document_status"] = status.document_status
        
        result.append(Status(**status_dict))
    
    return result


@router.get("/statuses/{status_id}", response_model=Status)
def get_status(status_id: int, db: Session = Depends(get_db)):
    """Получить статус по ID"""
    status = db.query(StatusModel).filter(StatusModel.id == status_id).first()
    if not status:
        raise HTTPException(status_code=404, detail="Статус не найден")
    
    doc_status = calculate_document_status(status.valid_until_date)
    if doc_status:
        status.document_status = doc_status.value
        status.document_status_calculated_at = datetime.now()
    
    files_count = db.query(FileModel).filter(
        and_(FileModel.status_id == status.id, FileModel.is_active == True)
    ).count()
    
    status_dict = {
        **{c.name: getattr(status, c.name) for c in status.__table__.columns},
        "files_count": files_count
    }
    if status.document_status:
        status_dict["document_status"] = status.document_status
    
    return Status(**status_dict)


@router.post("/statuses/", response_model=Status)
def create_status(status: StatusCreate, db: Session = Depends(get_db)):
    """Создать статус узла дорожной карты"""
    # Проверяем существование проекта
    project = db.query(Project).filter(Project.id == status.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    # Проверяем существование секции
    section = db.query(SectionModel).filter(SectionModel.code == status.section_code).first()
    if not section:
        raise HTTPException(status_code=404, detail="Секция дорожной карты не найдена")
    
    # Проверяем, не существует ли уже статус для этого проекта и секции
    existing = db.query(StatusModel).filter(
        and_(
            StatusModel.project_id == status.project_id,
            StatusModel.section_code == status.section_code
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Статус для этого проекта и секции уже существует")
    
    # Рассчитываем статус документа
    doc_status = calculate_document_status(status.valid_until_date)
    
    # Создаем статус
    status_data = status.model_dump()
    status_data["section_id"] = section.id  # Добавляем section_id
    status_data["execution_status"] = ExecutionStatus(status_data["execution_status"])
    if doc_status:
        status_data["document_status"] = doc_status
        status_data["document_status_calculated_at"] = datetime.now()
    
    db_status = StatusModel(**status_data)
    db.add(db_status)
    db.commit()
    db.refresh(db_status)
    
    # Создаем уведомление если статус "Выполнено"
    if db_status.execution_status == ExecutionStatus.COMPLETED:
        section = db.query(SectionModel).filter(SectionModel.id == db_status.section_id).first()
        if section:
            notification = NotificationModel(
                status_id=db_status.id,
                notification_type=NotificationType.STATUS_COMPLETED,
                channel=NotificationChannel.IN_APP,
                title="Статус изменен на 'Выполнено'",
                message=f"Исправлен статус по разделу '{section.name}'"
            )
            db.add(notification)
            db.commit()
    
    status_dict = {
        **{c.name: getattr(db_status, c.name) for c in db_status.__table__.columns},
        "files_count": 0
    }
    if db_status.document_status:
        status_dict["document_status"] = db_status.document_status.value
    
    return Status(**status_dict)


@router.put("/statuses/{status_id}", response_model=Status)
def update_status(status_id: int, status_update: StatusUpdate, db: Session = Depends(get_db)):
    """Обновить статус узла дорожной карты"""
    db_status = db.query(StatusModel).filter(StatusModel.id == status_id).first()
    if not db_status:
        raise HTTPException(status_code=404, detail="Статус не найден")
    
    update_data = status_update.model_dump(exclude_unset=True)
    
    old_execution_status = db_status.execution_status
    old_valid_until_date = db_status.valid_until_date
    
    # Обновляем статус выполнения если указан
    if "execution_status" in update_data:
        update_data["execution_status"] = ExecutionStatus(update_data["execution_status"])
    
    # Пересчитываем статус документа если изменился срок действия
    new_valid_until_date = update_data.get("valid_until_date", old_valid_until_date)
    if "valid_until_date" in update_data or not db_status.document_status:
        doc_status = calculate_document_status(new_valid_until_date)
        if doc_status:
            update_data["document_status"] = doc_status
            update_data["document_status_calculated_at"] = datetime.now()
    
    for field, value in update_data.items():
        setattr(db_status, field, value)
    
    db.commit()
    db.refresh(db_status)
    
    # Создаем уведомление если статус изменился на "Выполнено"
    if old_execution_status != ExecutionStatus.COMPLETED and db_status.execution_status == ExecutionStatus.COMPLETED:
        section = db.query(SectionModel).filter(SectionModel.id == db_status.section_id).first()
        if section:
            notification = NotificationModel(
                status_id=db_status.id,
                notification_type=NotificationType.STATUS_COMPLETED,
                channel=NotificationChannel.IN_APP,
                title="Статус изменен на 'Выполнено'",
                message=f"Исправлен статус по разделу '{section.name}'"
            )
            db.add(notification)
            db.commit()
    
    # Создаем уведомления по срокам действия документа
    if new_valid_until_date and new_valid_until_date != old_valid_until_date:
        section = db.query(SectionModel).filter(SectionModel.id == db_status.section_id).first()
        if section:
            _create_document_expiry_notifications(db_status, section, db)
    
    files_count = db.query(FileModel).filter(
        and_(FileModel.status_id == db_status.id, FileModel.is_active == True)
    ).count()
    
    status_dict = {
        **{c.name: getattr(db_status, c.name) for c in db_status.__table__.columns},
        "files_count": files_count
    }
    if db_status.document_status:
        status_dict["document_status"] = db_status.document_status.value
    
    return Status(**status_dict)


@router.delete("/statuses/{status_id}")
def delete_status(status_id: int, db: Session = Depends(get_db)):
    """Удалить статус узла дорожной карты"""
    status = db.query(StatusModel).filter(StatusModel.id == status_id).first()
    if not status:
        raise HTTPException(status_code=404, detail="Статус не найден")
    
    db.delete(status)
    db.commit()
    return {"message": "Статус удален"}


# Endpoints для файлов
@router.post("/statuses/{status_id}/files", response_model=FileInfo)
async def upload_file(
    status_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Загрузить файл к статусу узла дорожной карты"""
    status = db.query(StatusModel).filter(StatusModel.id == status_id).first()
    if not status:
        raise HTTPException(status_code=404, detail="Статус не найден")
    
    # Проверяем тип файла (только PDF)
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Разрешена загрузка только PDF файлов")
    
    # Сохраняем файл
    file_ext = Path(file.filename).suffix
    unique_filename = f"{status_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_size = file_path.stat().st_size
    
    # Создаем запись в БД
    db_file = FileModel(
        status_id=status_id,
        file_name=file.filename,
        stored_path=str(file_path),
        file_size=file_size,
        mime_type=file.content_type or "application/pdf",
        description=description
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    return FileInfo(**{c.name: getattr(db_file, c.name) for c in db_file.__table__.columns})


@router.get("/statuses/{status_id}/files", response_model=List[FileInfo])
def get_files(status_id: int, db: Session = Depends(get_db)):
    """Получить список файлов статуса"""
    status = db.query(StatusModel).filter(StatusModel.id == status_id).first()
    if not status:
        raise HTTPException(status_code=404, detail="Статус не найден")
    
    files = db.query(FileModel).filter(
        and_(FileModel.status_id == status_id, FileModel.is_active == True)
    ).order_by(FileModel.uploaded_at.desc()).all()
    
    return [FileInfo(**{c.name: getattr(f, c.name) for c in f.__table__.columns}) for f in files]


@router.delete("/files/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db)):
    """Удалить файл"""
    file = db.query(FileModel).filter(FileModel.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    # Удаляем физический файл
    file_path = Path(file.stored_path)
    if file_path.exists():
        file_path.unlink()
    
    db.delete(file)
    db.commit()
    return {"message": "Файл удален"}


@router.get("/files/{file_id}/download")
async def download_file(file_id: int, db: Session = Depends(get_db)):
    """Скачать файл"""
    from fastapi.responses import FileResponse
    
    file = db.query(FileModel).filter(FileModel.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    file_path = Path(file.stored_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Файл не найден на диске")
    
    return FileResponse(
        path=str(file_path),
        filename=file.file_name,
        media_type=file.mime_type
    )
