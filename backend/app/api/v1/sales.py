from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from datetime import date, datetime
from app.db.database import get_db
from app.models.sales import (
    SalesProposal as SalesProposalModel,
    SalesProposalItem as SalesProposalItemModel,
    CustomerAgreement as CustomerAgreementModel,
    SalesProposalStatus
)
from app.models.estimate import Estimate as EstimateModel
from pydantic import BaseModel

router = APIRouter()


class SalesProposalItemBase(BaseModel):
    line_number: Optional[int] = None
    work_name: str
    unit: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit_price: Decimal
    notes: Optional[str] = None


class SalesProposalItemCreate(SalesProposalItemBase):
    pass


class SalesProposalItem(SalesProposalItemBase):
    id: int
    proposal_id: int
    amount: Optional[Decimal] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SalesProposalBase(BaseModel):
    project_id: int
    estimate_id: Optional[int] = None
    proposal_number: str
    proposal_date: date
    customer_name: str
    customer_contact: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    total_amount: Decimal
    discount_percentage: Decimal = Decimal(0)
    validity_period: Optional[date] = None
    payment_terms: Optional[str] = None
    delivery_terms: Optional[str] = None
    prepared_by: str
    notes: Optional[str] = None
    file_path: Optional[str] = None


class SalesProposalCreate(SalesProposalBase):
    items: List[SalesProposalItemCreate] = []


class SalesProposal(SalesProposalBase):
    id: int
    discount_amount: Decimal
    final_amount: Decimal
    status: str
    sent_date: Optional[date] = None
    response_date: Optional[date] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[SalesProposalItem] = []

    class Config:
        from_attributes = True


class CustomerAgreementBase(BaseModel):
    project_id: int
    proposal_id: Optional[int] = None
    estimate_id: Optional[int] = None
    agreement_date: date
    customer_name: str
    agreed_amount: Decimal
    changes_requested: Optional[str] = None
    agreement_status: str = "pending"
    agreed_by: Optional[str] = None
    sales_manager: str
    notes: Optional[str] = None


class CustomerAgreementCreate(CustomerAgreementBase):
    pass


class CustomerAgreement(CustomerAgreementBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/proposals/", response_model=List[SalesProposal])
def get_sales_proposals(
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Получить список коммерческих предложений"""
    query = db.query(SalesProposalModel)
    if project_id:
        query = query.filter(SalesProposalModel.project_id == project_id)
    if status:
        query = query.filter(SalesProposalModel.status == status)
    proposals = query.offset(skip).limit(limit).all()
    return proposals


@router.post("/proposals/", response_model=SalesProposal)
def create_sales_proposal(proposal: SalesProposalCreate, db: Session = Depends(get_db)):
    """Создать коммерческое предложение для клиента"""
    items_data = proposal.items
    proposal_data = proposal.model_dump(exclude={"items"})
    
    # Расчет скидки и итоговой суммы
    discount_amount = (proposal.total_amount * proposal.discount_percentage / 100) if proposal.discount_percentage > 0 else Decimal(0)
    final_amount = proposal.total_amount - discount_amount
    
    proposal_data["discount_amount"] = discount_amount
    proposal_data["final_amount"] = final_amount
    
    db_proposal = SalesProposalModel(**proposal_data)
    db.add(db_proposal)
    db.flush()
    
    total_amount = Decimal(0)
    for item_data in items_data:
        item_dict = item_data.model_dump()
        if not item_dict.get("amount") and item_dict.get("unit_price") and item_dict.get("quantity"):
            item_dict["amount"] = item_dict["unit_price"] * item_dict["quantity"]
        item = SalesProposalItemModel(proposal_id=db_proposal.id, **item_dict)
        db.add(item)
        if item.amount:
            total_amount += item.amount
    
    # Если сумма из позиций отличается, обновляем
    if total_amount > 0 and total_amount != proposal.total_amount:
        db_proposal.total_amount = total_amount
        discount_amount = (total_amount * proposal.discount_percentage / 100) if proposal.discount_percentage > 0 else Decimal(0)
        db_proposal.discount_amount = discount_amount
        db_proposal.final_amount = total_amount - discount_amount
    
    db.commit()
    db.refresh(db_proposal)
    return db_proposal


@router.put("/proposals/{proposal_id}/send", response_model=SalesProposal)
def send_proposal(proposal_id: int, sent_date: Optional[date] = None, db: Session = Depends(get_db)):
    """Отправить коммерческое предложение клиенту"""
    proposal = db.query(SalesProposalModel).filter(SalesProposalModel.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Предложение не найдено")
    
    proposal.status = SalesProposalStatus.SENT
    proposal.sent_date = sent_date or date.today()
    
    db.commit()
    db.refresh(proposal)
    return proposal


@router.post("/agreements/", response_model=CustomerAgreement)
def create_customer_agreement(agreement: CustomerAgreementCreate, db: Session = Depends(get_db)):
    """Создать согласование с клиентом"""
    db_agreement = CustomerAgreementModel(**agreement.model_dump())
    db.add(db_agreement)
    
    # Обновление статуса предложения, если указано
    if agreement.proposal_id:
        proposal = db.query(SalesProposalModel).filter(SalesProposalModel.id == agreement.proposal_id).first()
        if proposal:
            if agreement.agreement_status == "approved":
                proposal.status = SalesProposalStatus.APPROVED
                proposal.response_date = agreement.agreement_date
            elif agreement.agreement_status == "rejected":
                proposal.status = SalesProposalStatus.REJECTED
                proposal.response_date = agreement.agreement_date
    
    db.commit()
    db.refresh(db_agreement)
    return db_agreement


@router.get("/agreements/", response_model=List[CustomerAgreement])
def get_customer_agreements(
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Получить список согласований с клиентами"""
    query = db.query(CustomerAgreementModel)
    if project_id:
        query = query.filter(CustomerAgreementModel.project_id == project_id)
    if status:
        query = query.filter(CustomerAgreementModel.agreement_status == status)
    agreements = query.offset(skip).limit(limit).all()
    return agreements


@router.post("/proposals/{proposal_id}/from-estimate/{estimate_id}")
def create_proposal_from_estimate(proposal_id: Optional[int], estimate_id: int, proposal_data: SalesProposalBase, db: Session = Depends(get_db)):
    """Создать коммерческое предложение на основе сметы"""
    estimate = db.query(EstimateModel).filter(EstimateModel.id == estimate_id).first()
    if not estimate:
        raise HTTPException(status_code=404, detail="Смета не найдена")
    
    proposal_dict = proposal_data.model_dump()
    proposal_dict["total_amount"] = estimate.total_amount or Decimal(0)
    
    db_proposal = SalesProposalModel(**proposal_dict)
    db.add(db_proposal)
    db.flush()
    
    # Перенос позиций из сметы
    for estimate_item in estimate.items:
        item = SalesProposalItemModel(
            proposal_id=db_proposal.id,
            work_name=estimate_item.work_name,
            unit=estimate_item.unit,
            quantity=estimate_item.quantity,
            unit_price=estimate_item.unit_price or Decimal(0),
            amount=estimate_item.total_price
        )
        db.add(item)
    
    db.commit()
    db.refresh(db_proposal)
    return db_proposal