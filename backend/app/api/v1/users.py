from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.user import (
    User as UserModel,
    Permission as PermissionModel,
    UserPermission as UserPermissionModel,
    RolePermission as RolePermissionModel,
    UserRole,
)
from app.models.personnel import Personnel as PersonnelModel
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: str
    role: str
    department_id: Optional[int] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True
    notes: Optional[str] = None


class UserCreate(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: str
    department_id: Optional[int] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True
    notes: Optional[str] = None
    personnel_id: Optional[int] = None


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    department_id: Optional[int] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None
    personnel_id: Optional[int] = None


class User(UserBase):
    id: int
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    personnel_id: Optional[int] = None

    class Config:
        from_attributes = True


class PermissionBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    module: Optional[str] = None


class PermissionCreate(PermissionBase):
    pass


class Permission(PermissionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserPermissionBase(BaseModel):
    permission_id: int
    granted: bool = True
    granted_by: Optional[str] = None
    expires_at: Optional[datetime] = None
    notes: Optional[str] = None


class UserPermissionCreate(UserPermissionBase):
    pass


class UserPermission(UserPermissionBase):
    id: int
    user_id: int
    granted_date: datetime

    class Config:
        from_attributes = True


class RolePermissions(BaseModel):
    role: str
    permission_ids: List[int]


def _user_to_response(u: UserModel) -> User:
    """Собрать ответ User с personnel_id из связи."""
    data = {f: getattr(u, f) for f in User.model_fields if f != "personnel_id" and hasattr(u, f)}
    data["personnel_id"] = u.personnel.id if u.personnel else None
    return User(**data)


@router.get("/users/", response_model=List[User])
def get_users(department_id: Optional[int] = None, role: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список пользователей"""
    query = db.query(UserModel)
    if department_id:
        query = query.filter(UserModel.department_id == department_id)
    if role:
        query = query.filter(UserModel.role == role)
    users = query.offset(skip).limit(limit).all()
    return [_user_to_response(u) for u in users]


@router.post("/users/", response_model=User)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Создать пользователя. ФИО, должность, подразделение берутся из выбранного сотрудника (Кадры)."""
    personnel_id = user.personnel_id
    payload = user.model_dump(exclude={"personnel_id"})
    if personnel_id is not None:
        personnel = db.query(PersonnelModel).filter(PersonnelModel.id == personnel_id).first()
        if personnel:
            payload["full_name"] = personnel.full_name
            payload["position"] = personnel.position
            payload["department_id"] = personnel.department_id
    if not (payload.get("full_name") or (payload.get("full_name") or "").strip()):
        raise HTTPException(status_code=400, detail="Выберите сотрудника из Кадров (привязка к пользователю)")
    db_user = UserModel(**payload)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    if personnel_id is not None:
        db.query(PersonnelModel).filter(PersonnelModel.user_id == db_user.id).update({PersonnelModel.user_id: None})
        db.query(PersonnelModel).filter(PersonnelModel.id == personnel_id).update({PersonnelModel.user_id: db_user.id})
        db.commit()
        db.refresh(db_user)
    return _user_to_response(db_user)


@router.put("/users/{user_id}", response_model=User)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    """Обновить пользователя. При смене сотрудника ФИО, должность, подразделение берутся из нового сотрудника."""
    db_user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    update_data = user_update.model_dump(exclude_unset=True)
    personnel_id = update_data.pop("personnel_id", None)
    personnel_key_sent = "personnel_id" in user_update.model_dump(exclude_unset=True)
    if personnel_key_sent and personnel_id is not None:
        personnel = db.query(PersonnelModel).filter(PersonnelModel.id == personnel_id).first()
        if personnel:
            update_data["full_name"] = personnel.full_name
            update_data["position"] = personnel.position
            update_data["department_id"] = personnel.department_id
    for field, value in update_data.items():
        setattr(db_user, field, value)
    db.commit()
    db.refresh(db_user)
    if personnel_key_sent:
        db.query(PersonnelModel).filter(PersonnelModel.user_id == user_id).update({PersonnelModel.user_id: None})
        if personnel_id is not None:
            db.query(PersonnelModel).filter(PersonnelModel.id == personnel_id).update({PersonnelModel.user_id: user_id})
        db.commit()
        db.refresh(db_user)
    return _user_to_response(db_user)


@router.get("/users/{user_id}", response_model=User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Получить пользователя по ID"""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return _user_to_response(user)


@router.get("/permissions/", response_model=List[Permission])
def get_permissions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список разрешений"""
    permissions = db.query(PermissionModel).offset(skip).limit(limit).all()
    return permissions


@router.post("/permissions/", response_model=Permission)
def create_permission(permission: PermissionCreate, db: Session = Depends(get_db)):
    """Создать разрешение"""
    db_permission = PermissionModel(**permission.model_dump())
    db.add(db_permission)
    db.commit()
    db.refresh(db_permission)
    return db_permission


@router.post("/users/{user_id}/permissions", response_model=UserPermission)
def grant_permission(user_id: int, user_permission: UserPermissionCreate, db: Session = Depends(get_db)):
    """Выдать разрешение пользователю"""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    permission = db.query(PermissionModel).filter(PermissionModel.id == user_permission.permission_id).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Разрешение не найдено")
    
    db_user_permission = UserPermissionModel(user_id=user_id, **user_permission.model_dump())
    db.add(db_user_permission)
    db.commit()
    db.refresh(db_user_permission)
    return db_user_permission


@router.get("/users/{user_id}/permissions", response_model=List[UserPermission])
def get_user_permissions(user_id: int, db: Session = Depends(get_db)):
    """Получить разрешения пользователя"""
    permissions = db.query(UserPermissionModel).filter(UserPermissionModel.user_id == user_id).all()
    return permissions


@router.get("/roles/permissions", response_model=List[RolePermissions])
def get_roles_permissions(db: Session = Depends(get_db)):
    """Получить матрицу ролей и разрешений (привязка прав к ролям)."""
    rows = db.query(RolePermissionModel).all()
    mapping: dict[str, set[int]] = {}
    for r in rows:
        mapping.setdefault(r.role, set()).add(r.permission_id)

    # Добавляем все роли из enum, даже если пока нет записей
    for role_enum in UserRole:
        mapping.setdefault(role_enum.value, set())

    result: List[RolePermissions] = []
    for role, ids in mapping.items():
        result.append(RolePermissions(role=role, permission_ids=sorted(ids)))
    return result


@router.put("/roles/{role}/permissions", response_model=RolePermissions)
def set_role_permissions(role: str, payload: RolePermissions, db: Session = Depends(get_db)):
    """Задать набор разрешений для роли (полная перезапись)."""
    try:
        # Валидируем, что роль известна
        role_enum = UserRole(role)
        role_value = role_enum.value
    except ValueError:
        raise HTTPException(status_code=400, detail="Неизвестная роль")

    # Проверяем, что все разрешения существуют
    if payload.permission_ids:
        cnt = (
            db.query(PermissionModel)
            .filter(PermissionModel.id.in_(payload.permission_ids))
            .count()
        )
        if cnt != len(set(payload.permission_ids)):
            raise HTTPException(status_code=400, detail="Некоторые разрешения не найдены")

    # Удаляем старые привязки
    db.query(RolePermissionModel).filter(RolePermissionModel.role == role_value).delete()

    # Создаем новые привязки
    for pid in sorted(set(payload.permission_ids)):
        db.add(RolePermissionModel(role=role_value, permission_id=pid))

    db.commit()

    return RolePermissions(role=role_value, permission_ids=sorted(set(payload.permission_ids)))