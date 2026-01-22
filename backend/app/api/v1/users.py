from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.user import User as UserModel, Permission as PermissionModel, UserPermission as UserPermissionModel
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


class UserCreate(UserBase):
    pass


class User(UserBase):
    id: int
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

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


@router.get("/users/", response_model=List[User])
def get_users(department_id: Optional[int] = None, role: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список пользователей"""
    query = db.query(UserModel)
    if department_id:
        query = query.filter(UserModel.department_id == department_id)
    if role:
        query = query.filter(UserModel.role == role)
    users = query.offset(skip).limit(limit).all()
    return users


@router.post("/users/", response_model=User)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Создать пользователя"""
    db_user = UserModel(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/users/{user_id}", response_model=User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Получить пользователя по ID"""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user


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