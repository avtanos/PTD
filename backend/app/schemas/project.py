from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional, List


class DepartmentInfo(BaseModel):
    """Информация о подразделении для включения в проект"""
    id: int
    name: str
    code: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProjectBase(BaseModel):
    name: str
    code: Optional[str] = None
    address: Optional[str] = None
    customer: Optional[str] = None
    contractor: Optional[str] = None
    description: Optional[str] = None
    work_type: Optional[str] = None
    department_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = "active"
    is_active: bool = True


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    address: Optional[str] = None
    customer: Optional[str] = None
    contractor: Optional[str] = None
    description: Optional[str] = None
    work_type: Optional[str] = None
    department_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None


class Project(ProjectBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    department: Optional[DepartmentInfo] = None

    model_config = ConfigDict(from_attributes=True)