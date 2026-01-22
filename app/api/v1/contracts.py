from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from app.db.database import get_db
from app.models.contract import Contract as ContractModel
from pydantic import BaseModel
from datetime import date, datetime

router = APIRouter()


class ContractBase(BaseModel):
    project_id: int
    contractor_name: str
    contract_number: str
    contract_date: date
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_amount: Decimal = 0
    advance_payment: Decimal = 0
    work_description: Optional[str] = None
    terms: Optional[str] = None
    status: str = "draft"
    signed_by_customer: Optional[str] = None
    signed_by_contractor: Optional[str] = None
    tender_id: Optional[int] = None
    notes: Optional[str] = None


class ContractCreate(ContractBase):
    pass


class ContractUpdate(BaseModel):
    project_id: Optional[int] = None
    contractor_name: Optional[str] = None
    contract_number: Optional[str] = None
    contract_date: Optional[date] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_amount: Optional[Decimal] = None
    advance_payment: Optional[Decimal] = None
    work_description: Optional[str] = None
    terms: Optional[str] = None
    status: Optional[str] = None
    signed_by_customer: Optional[str] = None
    signed_by_contractor: Optional[str] = None
    tender_id: Optional[int] = None
    notes: Optional[str] = None


class Contract(ContractBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/", response_model=List[Contract])
def get_contracts(project_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список договоров"""
    query = db.query(ContractModel)
    if project_id:
        query = query.filter(ContractModel.project_id == project_id)
    contracts = query.offset(skip).limit(limit).all()
    return contracts


@router.get("/{contract_id}", response_model=Contract)
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    """Получить договор по ID"""
    contract = db.query(ContractModel).filter(ContractModel.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Договор не найден")
    return contract


@router.post("/", response_model=Contract)
def create_contract(contract: ContractCreate, db: Session = Depends(get_db)):
    """Создать новый договор"""
    db_contract = ContractModel(**contract.model_dump())
    db.add(db_contract)
    db.commit()
    db.refresh(db_contract)
    return db_contract


@router.put("/{contract_id}", response_model=Contract)
def update_contract(contract_id: int, contract: ContractUpdate, db: Session = Depends(get_db)):
    """Обновить договор"""
    db_contract = db.query(ContractModel).filter(ContractModel.id == contract_id).first()
    if not db_contract:
        raise HTTPException(status_code=404, detail="Договор не найден")
    
    update_data = contract.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_contract, field, value)
    
    db.commit()
    db.refresh(db_contract)
    return db_contract


@router.delete("/{contract_id}")
def delete_contract(contract_id: int, db: Session = Depends(get_db)):
    """Удалить договор"""
    contract = db.query(ContractModel).filter(ContractModel.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Договор не найден")
    db.delete(contract)
    db.commit()
    return {"message": "Договор удален"}