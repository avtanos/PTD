"""Схемы для модуля кадров"""
from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional


class DepartmentBrief(BaseModel):
    id: int
    name: str
    code: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class EmployeeBase(BaseModel):
    personnel_number: str
    full_name: str
    position: str
    department_id: Optional[int] = None
    last_name: Optional[str] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    birth_date: Optional[date] = None
    hire_date: date
    dismissal_date: Optional[date] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    inn: Optional[str] = None
    snils: Optional[str] = None
    status: str = "employed"
    address: Optional[str] = None
    education: Optional[str] = None
    notes: Optional[str] = None
    user_id: Optional[int] = None
    is_active: bool = True


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    personnel_number: Optional[str] = None
    full_name: Optional[str] = None
    position: Optional[str] = None
    department_id: Optional[int] = None
    last_name: Optional[str] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    birth_date: Optional[date] = None
    hire_date: Optional[date] = None
    dismissal_date: Optional[date] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    inn: Optional[str] = None
    snils: Optional[str] = None
    status: Optional[str] = None
    address: Optional[str] = None
    education: Optional[str] = None
    notes: Optional[str] = None
    user_id: Optional[int] = None
    is_active: Optional[bool] = None


class Employee(EmployeeBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    department: Optional[DepartmentBrief] = None

    model_config = ConfigDict(from_attributes=True)


class EmployeeBrief(BaseModel):
    """Краткая информация о сотруднике для выпадающих списков"""
    id: int
    personnel_number: str
    full_name: str
    position: Optional[str] = None
    department: Optional[DepartmentBrief] = None

    model_config = ConfigDict(from_attributes=True)
