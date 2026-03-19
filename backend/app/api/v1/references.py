from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.database import get_db
from app.models.references import (
    Organization as OrganizationModel,
    Counterparty as CounterpartyModel,
    PaymentType as PaymentTypeModel,
    MaterialKind as MaterialKindModel,
)

router = APIRouter()


class OrganizationBase(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None


class OrganizationCreate(OrganizationBase):
    pass


class Organization(OrganizationBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CounterpartyBase(BaseModel):
    name: str
    inn: Optional[str] = None
    kpp: Optional[str] = None
    contacts: Optional[str] = None
    description: Optional[str] = None


class CounterpartyCreate(CounterpartyBase):
    pass


class Counterparty(CounterpartyBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PaymentTypeBase(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None


class PaymentTypeCreate(PaymentTypeBase):
    pass


class PaymentType(PaymentTypeBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MaterialKindBase(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None


class MaterialKindCreate(MaterialKindBase):
    pass


class MaterialKind(MaterialKindBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/organizations/", response_model=List[Organization])
def list_organizations(db: Session = Depends(get_db)):
    return db.query(OrganizationModel).filter(OrganizationModel.is_active == True).order_by(OrganizationModel.name).all()  # noqa: E712


@router.post("/organizations/", response_model=Organization)
def create_organization(payload: OrganizationCreate, db: Session = Depends(get_db)):
    row = OrganizationModel(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/counterparties/", response_model=List[Counterparty])
def list_counterparties(db: Session = Depends(get_db)):
    return db.query(CounterpartyModel).filter(CounterpartyModel.is_active == True).order_by(CounterpartyModel.name).all()  # noqa: E712


@router.post("/counterparties/", response_model=Counterparty)
def create_counterparty(payload: CounterpartyCreate, db: Session = Depends(get_db)):
    row = CounterpartyModel(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/payment-types/", response_model=List[PaymentType])
def list_payment_types(db: Session = Depends(get_db)):
    return db.query(PaymentTypeModel).filter(PaymentTypeModel.is_active == True).order_by(PaymentTypeModel.name).all()  # noqa: E712


@router.post("/payment-types/", response_model=PaymentType)
def create_payment_type(payload: PaymentTypeCreate, db: Session = Depends(get_db)):
    row = PaymentTypeModel(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/material-kinds/", response_model=List[MaterialKind])
def list_material_kinds(db: Session = Depends(get_db)):
    return db.query(MaterialKindModel).filter(MaterialKindModel.is_active == True).order_by(MaterialKindModel.name).all()  # noqa: E712


@router.post("/material-kinds/", response_model=MaterialKind)
def create_material_kind(payload: MaterialKindCreate, db: Session = Depends(get_db)):
    row = MaterialKindModel(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

