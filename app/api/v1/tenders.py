from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from app.db.database import get_db
from app.models.tender import Tender as TenderModel, Contractor as ContractorModel, TenderParticipant, CommercialProposal as CommercialProposalModel, CommercialProposalItem
from pydantic import BaseModel
from datetime import date, datetime

router = APIRouter()


# Contractor schemas
class ContractorBase(BaseModel):
    name: str
    inn: Optional[str] = None
    kpp: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    contact_person: Optional[str] = None
    specialization: Optional[str] = None
    rating: int = 0
    is_active: bool = True
    notes: Optional[str] = None


class ContractorCreate(ContractorBase):
    pass


class Contractor(ContractorBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Tender schemas
class TenderBase(BaseModel):
    project_id: int
    number: str
    name: str
    description: Optional[str] = None
    announcement_date: Optional[date] = None
    submission_deadline: Optional[date] = None
    evaluation_date: Optional[date] = None
    budget: Optional[Decimal] = None
    status: str = "draft"
    winner_id: Optional[int] = None
    notes: Optional[str] = None


class TenderCreate(TenderBase):
    pass


class TenderUpdate(BaseModel):
    project_id: Optional[int] = None
    number: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    announcement_date: Optional[date] = None
    submission_deadline: Optional[date] = None
    evaluation_date: Optional[date] = None
    budget: Optional[Decimal] = None
    status: Optional[str] = None
    winner_id: Optional[int] = None
    notes: Optional[str] = None


class Tender(TenderBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/contractors/", response_model=List[Contractor])
def get_contractors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список подрядчиков"""
    contractors = db.query(Contractor).offset(skip).limit(limit).all()
    return contractors


@router.post("/contractors/", response_model=Contractor)
def create_contractor(contractor: ContractorCreate, db: Session = Depends(get_db)):
    """Создать подрядчика"""
    db_contractor = ContractorModel(**contractor.model_dump())
    db.add(db_contractor)
    db.commit()
    db.refresh(db_contractor)
    return db_contractor


@router.get("/", response_model=List[Tender])
def get_tenders(project_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Получить список тендеров"""
    query = db.query(TenderModel)
    if project_id:
        query = query.filter(TenderModel.project_id == project_id)
    tenders = query.offset(skip).limit(limit).all()
    return tenders


@router.get("/{tender_id}", response_model=Tender)
def get_tender(tender_id: int, db: Session = Depends(get_db)):
    """Получить тендер по ID"""
    tender = db.query(TenderModel).filter(TenderModel.id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Тендер не найден")
    return tender


@router.post("/", response_model=Tender)
def create_tender(tender: TenderCreate, db: Session = Depends(get_db)):
    """Создать новый тендер"""
    db_tender = TenderModel(**tender.model_dump())
    db.add(db_tender)
    db.commit()
    db.refresh(db_tender)
    return db_tender


@router.put("/{tender_id}", response_model=Tender)
def update_tender(tender_id: int, tender: TenderUpdate, db: Session = Depends(get_db)):
    """Обновить тендер"""
    db_tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not db_tender:
        raise HTTPException(status_code=404, detail="Тендер не найден")
    
    update_data = tender.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_tender, field, value)
    
    db.commit()
    db.refresh(db_tender)
    return db_tender


@router.delete("/{tender_id}")
def delete_tender(tender_id: int, db: Session = Depends(get_db)):
    """Удалить тендер"""
    tender = db.query(TenderModel).filter(TenderModel.id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Тендер не найден")
    db.delete(tender)
    db.commit()
    return {"message": "Тендер удален"}


# Commercial Proposal endpoints
class CommercialProposalItemBase(BaseModel):
    line_number: Optional[int] = None
    work_name: str
    unit: Optional[str] = None
    quantity: Optional[Decimal] = None
    price: Decimal
    amount: Optional[Decimal] = None
    notes: Optional[str] = None


class CommercialProposalItemCreate(CommercialProposalItemBase):
    pass


class CommercialProposalItem(CommercialProposalItemBase):
    id: int
    commercial_proposal_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CommercialProposalBase(BaseModel):
    tender_id: int
    contractor_id: int
    number: Optional[str] = None
    date: date
    total_amount: Decimal = 0
    validity_period: Optional[date] = None
    payment_terms: Optional[str] = None
    delivery_terms: Optional[str] = None
    notes: Optional[str] = None
    file_path: Optional[str] = None


class CommercialProposalCreate(CommercialProposalBase):
    items: List[CommercialProposalItemCreate] = []


class CommercialProposal(CommercialProposalBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[CommercialProposalItem] = []

    class Config:
        from_attributes = True


@router.post("/commercial-proposals/", response_model=CommercialProposal)
def create_commercial_proposal(cp: CommercialProposalCreate, db: Session = Depends(get_db)):
    """Создать коммерческое предложение"""
    items_data = cp.items
    cp_data = cp.model_dump(exclude={"items"})
    
    db_cp = CommercialProposal(**cp_data)
    db.add(db_cp)
    db.flush()
    
    total_amount = Decimal(0)
    for item_data in items_data:
        item_dict = item_data.model_dump()
        if not item_dict.get("amount") and item_dict.get("price") and item_dict.get("quantity"):
            item_dict["amount"] = item_dict["price"] * item_dict["quantity"]
        item = CommercialProposalItem(commercial_proposal_id=db_cp.id, **item_dict)
        db.add(item)
        if item.amount:
            total_amount += item.amount
    
    db_cp.total_amount = total_amount
    db.commit()
    db.refresh(db_cp)
    return db_cp


@router.get("/commercial-proposals/{cp_id}", response_model=CommercialProposal)
def get_commercial_proposal(cp_id: int, db: Session = Depends(get_db)):
    """Получить коммерческое предложение по ID"""
    cp = db.query(CommercialProposalModel).filter(CommercialProposalModel.id == cp_id).first()
    if not cp:
        raise HTTPException(status_code=404, detail="Коммерческое предложение не найдено")
    return cp