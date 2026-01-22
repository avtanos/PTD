from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from typing import List, Optional, Dict, Any
from app.db.database import get_db
from app.models.project import Project
from app.models.department import Department
from app.schemas.project import ProjectCreate, ProjectUpdate, Project as ProjectSchema, DepartmentInfo
from app.schemas.common import PaginationMeta

router = APIRouter()


def project_to_schema(project: Project) -> ProjectSchema:
    """Преобразует проект из модели в схему для сериализации"""
    # Преобразуем department если есть
    department_info = None
    if hasattr(project, 'department') and project.department is not None:
        try:
            dept = project.department
            department_info = DepartmentInfo(
                id=dept.id,
                name=dept.name,
                code=getattr(dept, 'code', None)
            )
        except Exception as e:
            import traceback
            print(f"Error converting department for project {project.id}: {e}")
            traceback.print_exc()
            department_info = None
    
    try:
        # Создаем словарь для ProjectSchema
        project_dict = {
            "id": project.id,
            "name": project.name,
            "code": project.code,
            "address": project.address,
            "customer": project.customer,
            "contractor": project.contractor,
            "description": project.description,
            "work_type": project.work_type,
            "department_id": project.department_id,
            "start_date": project.start_date,
            "end_date": project.end_date,
            "status": project.status,
            "is_active": project.is_active,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "department": department_info
        }
        
        return ProjectSchema(**project_dict)
    except Exception as e:
        import traceback
        print(f"Error creating ProjectSchema for project {project.id}: {e}")
        traceback.print_exc()
        # Возвращаем без department
        project_dict = {
            "id": project.id,
            "name": project.name,
            "code": project.code,
            "address": project.address,
            "customer": project.customer,
            "contractor": project.contractor,
            "description": project.description,
            "work_type": project.work_type,
            "department_id": project.department_id,
            "start_date": project.start_date,
            "end_date": project.end_date,
            "status": project.status,
            "is_active": project.is_active,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "department": None
        }
        return ProjectSchema(**project_dict)


@router.get("/")
def get_projects(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    department_id: Optional[int] = None,
    work_type: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Получить список проектов с фильтрацией и пагинацией"""
    # Базовый запрос с join для department
    query = db.query(Project).outerjoin(Department, Project.department_id == Department.id)
    
    # Применяем фильтры
    filters = []
    if status:
        filters.append(Project.status == status)
    if department_id:
        filters.append(Project.department_id == department_id)
    if work_type:
        filters.append(Project.work_type == work_type)
    if is_active is not None:
        filters.append(Project.is_active == is_active)
    if search:
        search_filter = or_(
            Project.name.ilike(f"%{search}%"),
            Project.code.ilike(f"%{search}%"),
            Project.customer.ilike(f"%{search}%"),
            Project.contractor.ilike(f"%{search}%"),
            Project.address.ilike(f"%{search}%")
        )
        filters.append(search_filter)
    
    if filters:
        query = query.filter(and_(*filters))
    
    # Получаем общее количество для метаданных
    total = query.count()
    
    # Сортировка: сначала активные, потом по дате создания (новые первые)
    query = query.order_by(Project.is_active.desc(), Project.created_at.desc())
    
    # Применяем пагинацию
    projects = query.offset(skip).limit(limit).all()
    
    # Преобразуем проекты в схемы с department
    result = []
    for p in projects:
        try:
            department_info = None
            if p.department_id and hasattr(p, 'department') and p.department:
                department_info = DepartmentInfo(
                    id=p.department.id,
                    name=p.department.name,
                    code=getattr(p.department, 'code', None)
                )
            elif p.department_id:
                # Загружаем department отдельно, если не загружен через join
                dept = db.query(Department).filter(Department.id == p.department_id).first()
                if dept:
                    department_info = DepartmentInfo(
                        id=dept.id,
                        name=dept.name,
                        code=getattr(dept, 'code', None)
                    )
            
            result.append(ProjectSchema(
                id=p.id,
                name=p.name,
                code=p.code,
                address=p.address,
                customer=p.customer,
                contractor=p.contractor,
                description=p.description,
                work_type=p.work_type,
                department_id=p.department_id,
                start_date=p.start_date,
                end_date=p.end_date,
                status=p.status,
                is_active=p.is_active,
                created_at=p.created_at,
                updated_at=p.updated_at,
                department=department_info
            ))
        except Exception as e:
            import traceback
            print(f"Error creating schema for project {p.id}: {e}")
            traceback.print_exc()
            raise
    
    # Возвращаем стандартизированный формат с метаданными
    return {
        "data": result,
        "meta": PaginationMeta(
            total=total,
            skip=skip,
            limit=limit,
            page=(skip // limit) + 1 if limit > 0 else 1,
            total_pages=(total + limit - 1) // limit if limit > 0 else 1
        ).model_dump()
    }


@router.get("/{project_id}", response_model=ProjectSchema)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """Получить проект по ID"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    # Загружаем department
    department_info = None
    if project.department_id:
        dept = db.query(Department).filter(Department.id == project.department_id).first()
        if dept:
            department_info = DepartmentInfo(
                id=dept.id,
                name=dept.name,
                code=getattr(dept, 'code', None)
            )
    
    return ProjectSchema(
        id=project.id,
        name=project.name,
        code=project.code,
        address=project.address,
        customer=project.customer,
        contractor=project.contractor,
        description=project.description,
        work_type=project.work_type,
        department_id=project.department_id,
        start_date=project.start_date,
        end_date=project.end_date,
        status=project.status,
        is_active=project.is_active,
        created_at=project.created_at,
        updated_at=project.updated_at,
        department=department_info
    )


@router.post("/", response_model=ProjectSchema)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """Создать новый проект"""
    # Проверка уникальности кода, если он указан
    if project.code:
        existing = db.query(Project).filter(Project.code == project.code).first()
        if existing:
            raise HTTPException(status_code=400, detail="Проект с таким кодом уже существует")
    
    db_project = Project(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    # Загружаем department
    department_info = None
    if db_project.department_id:
        dept = db.query(Department).filter(Department.id == db_project.department_id).first()
        if dept:
            department_info = DepartmentInfo(
                id=dept.id,
                name=dept.name,
                code=getattr(dept, 'code', None)
            )
    
    return ProjectSchema(
        id=db_project.id,
        name=db_project.name,
        code=db_project.code,
        address=db_project.address,
        customer=db_project.customer,
        contractor=db_project.contractor,
        description=db_project.description,
        work_type=db_project.work_type,
        department_id=db_project.department_id,
        start_date=db_project.start_date,
        end_date=db_project.end_date,
        status=db_project.status,
        is_active=db_project.is_active,
        created_at=db_project.created_at,
        updated_at=db_project.updated_at,
        department=department_info
    )


@router.put("/{project_id}", response_model=ProjectSchema)
def update_project(project_id: int, project: ProjectUpdate, db: Session = Depends(get_db)):
    """Обновить проект"""
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    # Проверка уникальности кода, если он изменяется
    if project.code and project.code != db_project.code:
        existing = db.query(Project).filter(Project.code == project.code).first()
        if existing:
            raise HTTPException(status_code=400, detail="Проект с таким кодом уже существует")
    
    update_data = project.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_project, field, value)
    
    db.commit()
    db.refresh(db_project)
    
    # Загружаем department
    department_info = None
    if db_project.department_id:
        dept = db.query(Department).filter(Department.id == db_project.department_id).first()
        if dept:
            department_info = DepartmentInfo(
                id=dept.id,
                name=dept.name,
                code=getattr(dept, 'code', None)
            )
    
    return ProjectSchema(
        id=db_project.id,
        name=db_project.name,
        code=db_project.code,
        address=db_project.address,
        customer=db_project.customer,
        contractor=db_project.contractor,
        description=db_project.description,
        work_type=db_project.work_type,
        department_id=db_project.department_id,
        start_date=db_project.start_date,
        end_date=db_project.end_date,
        status=db_project.status,
        is_active=db_project.is_active,
        created_at=db_project.created_at,
        updated_at=db_project.updated_at,
        department=department_info
    )


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    """Удалить проект"""
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    db.delete(db_project)
    db.commit()
    return {"message": "Проект удален"}