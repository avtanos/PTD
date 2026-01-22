from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from datetime import date, datetime
from app.db.database import get_db
from app.models.estimate import Estimate as EstimateModel
from app.models.estimate_validation import (
    EstimateValidation as EstimateValidationModel,
    VolumeProjectMatch as VolumeProjectMatchModel,
    MaterialSpecification as MaterialSpecificationModel,
    EstimateContractLink as EstimateContractLinkModel,
    CostControl as CostControlModel,
    ValidationRule, ValidationStatus
)
from app.models.work_volume import WorkVolume as WorkVolumeModel
from app.models.project_documentation import ProjectDocumentation as ProjectDocumentationModel
from app.models.contract import Contract as ContractModel
from pydantic import BaseModel

router = APIRouter()


class EstimateValidationBase(BaseModel):
    validation_type: str
    rule: str
    description: Optional[str] = None
    expected_value: Optional[str] = None
    actual_value: Optional[str] = None
    is_critical: bool = False
    notes: Optional[str] = None


class EstimateValidationCreate(EstimateValidationBase):
    pass


class EstimateValidation(EstimateValidationBase):
    id: int
    estimate_id: int
    status: str
    checked_by: Optional[str] = None
    checked_date: Optional[datetime] = None
    deviation_percentage: Optional[Decimal] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class VolumeProjectMatchBase(BaseModel):
    construct_id: Optional[int] = None
    work_volume_id: Optional[int] = None
    estimate_id: Optional[int] = None
    project_documentation_id: Optional[int] = None
    work_code: Optional[str] = None
    work_name: Optional[str] = None
    notes: Optional[str] = None


class VolumeProjectMatch(VolumeProjectMatchBase):
    id: int
    project_id: int
    project_volume: Optional[Decimal] = None
    estimated_volume: Optional[Decimal] = None
    actual_volume: Optional[Decimal] = None
    deviation_estimate: Optional[Decimal] = None
    deviation_actual: Optional[Decimal] = None
    deviation_percentage: Optional[Decimal] = None
    status: str
    checked_by: Optional[str] = None
    checked_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MaterialSpecificationBase(BaseModel):
    construct_id: Optional[int] = None
    material_code: Optional[str] = None
    material_name: str
    specification: Optional[str] = None
    unit: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None
    brand: Optional[str] = None
    standard: Optional[str] = None
    manufacturer: Optional[str] = None
    supplier: Optional[str] = None
    delivery_date: Optional[date] = None
    quality_certificate: Optional[str] = None
    storage_conditions: Optional[str] = None
    installation_requirements: Optional[str] = None
    compatibility: Optional[str] = None
    notes: Optional[str] = None


class MaterialSpecificationCreate(MaterialSpecificationBase):
    pass


class MaterialSpecification(MaterialSpecificationBase):
    id: int
    project_documentation_id: int
    total_price: Optional[Decimal] = None
    created_at: datetime

    class Config:
        from_attributes = True


class EstimateContractLinkBase(BaseModel):
    contract_id: int
    is_primary: bool = False
    usage_type: Optional[str] = None
    notes: Optional[str] = None


class EstimateContractLinkCreate(EstimateContractLinkBase):
    pass


class EstimateContractLink(EstimateContractLinkBase):
    id: int
    estimate_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CostControlBase(BaseModel):
    contract_id: Optional[int] = None
    control_date: date
    planned_amount: Decimal
    actual_amount: Decimal = Decimal(0)
    materials_planned: Optional[Decimal] = None
    materials_actual: Optional[Decimal] = None
    labor_planned: Optional[Decimal] = None
    labor_actual: Optional[Decimal] = None
    equipment_planned: Optional[Decimal] = None
    equipment_actual: Optional[Decimal] = None
    related_costs_planned: Optional[Decimal] = None
    related_costs_actual: Optional[Decimal] = None
    notes: Optional[str] = None


class CostControlCreate(CostControlBase):
    pass


class CostControl(CostControlBase):
    id: int
    estimate_id: int
    deviation_amount: Optional[Decimal] = None
    deviation_percentage: Optional[Decimal] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/estimates/{estimate_id}/validate-volume", response_model=VolumeProjectMatch)
def validate_volume_against_project(estimate_id: int, construct_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Проверить соответствие объемов работ проекту"""
    estimate = db.query(EstimateModel).filter(EstimateModel.id == estimate_id).first()
    if not estimate:
        raise HTTPException(status_code=404, detail="Смета не найдена")
    
    # Получаем объемы по проекту из проектной документации
    project_docs = db.query(ProjectDocumentationModel).filter(
        ProjectDocumentationModel.project_id == estimate.project_id
    ).all()
    
    # Получаем объемы работ из ВОР
    work_volumes = db.query(WorkVolumeModel).filter(
        WorkVolumeModel.project_id == estimate.project_id
    )
    if construct_id:
        work_volumes = work_volumes.filter(WorkVolumeModel.construct_id == construct_id)
    work_volumes = work_volumes.all()
    
    # Сравниваем объемы
    matches = []
    for wv in work_volumes:
        project_volume = wv.planned_volume
        estimated_volume = Decimal(0)
        # Находим соответствующий объем в смете
        for item in estimate.items:
            if item.work_name and wv.work_name and item.work_name.lower() in wv.work_name.lower():
                estimated_volume += item.quantity
        
        deviation_estimate = estimated_volume - project_volume if project_volume else Decimal(0)
        deviation_percentage = (deviation_estimate / project_volume * 100) if project_volume > 0 else Decimal(0)
        
        match = VolumeProjectMatchModel(
            project_id=estimate.project_id,
            construct_id=wv.construct_id,
            work_volume_id=wv.id,
            estimate_id=estimate_id,
            work_code=wv.work_code,
            work_name=wv.work_name,
            project_volume=project_volume,
            estimated_volume=estimated_volume,
            actual_volume=wv.actual_volume,
            deviation_estimate=deviation_estimate,
            deviation_actual=(wv.actual_volume - project_volume) if project_volume else None,
            deviation_percentage=deviation_percentage,
            status="pending"
        )
        db.add(match)
        matches.append(match)
    
    db.commit()
    if matches:
        db.refresh(matches[0])
        return matches[0]
    raise HTTPException(status_code=404, detail="Не найдено объемов для проверки")


@router.get("/estimates/{estimate_id}/validations", response_model=List[EstimateValidation])
def get_estimate_validations(estimate_id: int, db: Session = Depends(get_db)):
    """Получить проверки сметы"""
    validations = db.query(EstimateValidationModel).filter(
        EstimateValidationModel.estimate_id == estimate_id
    ).all()
    return validations


@router.get("/projects/{project_id}/volume-matches", response_model=List[VolumeProjectMatch])
def get_volume_matches(project_id: int, db: Session = Depends(get_db)):
    """Получить проверки соответствия объемов проекту"""
    matches = db.query(VolumeProjectMatchModel).filter(
        VolumeProjectMatchModel.project_id == project_id
    ).all()
    return matches


@router.post("/project-documentation/{doc_id}/specifications", response_model=MaterialSpecification)
def create_material_specification(doc_id: int, spec: MaterialSpecificationCreate, db: Session = Depends(get_db)):
    """Добавить спецификацию материалов из проектной документации"""
    doc = db.query(ProjectDocumentationModel).filter(ProjectDocumentationModel.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Документ не найден")
    
    spec_data = spec.model_dump()
    if spec_data.get("unit_price") and spec_data.get("quantity"):
        spec_data["total_price"] = spec_data["unit_price"] * spec_data["quantity"]
    
    db_spec = MaterialSpecificationModel(project_documentation_id=doc_id, **spec_data)
    db.add(db_spec)
    db.commit()
    db.refresh(db_spec)
    return db_spec


@router.post("/estimates/{estimate_id}/link-contract", response_model=EstimateContractLink)
def link_estimate_to_contract(estimate_id: int, link: EstimateContractLinkCreate, db: Session = Depends(get_db)):
    """Связать смету с договором"""
    estimate = db.query(EstimateModel).filter(EstimateModel.id == estimate_id).first()
    if not estimate:
        raise HTTPException(status_code=404, detail="Смета не найдена")
    
    contract = db.query(ContractModel).filter(ContractModel.id == link.contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Договор не найден")
    
    # Если это основная смета, снимаем флаг с других
    if link.is_primary:
        db.query(EstimateContractLinkModel).filter(
            EstimateContractLinkModel.contract_id == link.contract_id
        ).update({"is_primary": False})
    
    db_link = EstimateContractLinkModel(estimate_id=estimate_id, **link.model_dump())
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return db_link


@router.post("/estimates/{estimate_id}/cost-control", response_model=CostControl)
def create_cost_control(estimate_id: int, control: CostControlCreate, db: Session = Depends(get_db)):
    """Создать контроль затрат по смете"""
    estimate = db.query(EstimateModel).filter(EstimateModel.id == estimate_id).first()
    if not estimate:
        raise HTTPException(status_code=404, detail="Смета не найдена")
    
    control_data = control.model_dump()
    deviation_amount = control.actual_amount - control.planned_amount
    deviation_percentage = (deviation_amount / control.planned_amount * 100) if control.planned_amount > 0 else Decimal(0)
    
    # Определяем статус по отклонению
    if abs(deviation_percentage) <= 5:
        status = "normal"
    elif abs(deviation_percentage) <= 10:
        status = "warning"
    else:
        status = "critical"
    
    control_data["deviation_amount"] = deviation_amount
    control_data["deviation_percentage"] = deviation_percentage
    control_data["status"] = status
    
    db_control = CostControlModel(estimate_id=estimate_id, **control_data)
    db.add(db_control)
    db.commit()
    db.refresh(db_control)
    return db_control


@router.get("/estimates/{estimate_id}/cost-controls", response_model=List[CostControl])
def get_cost_controls(estimate_id: int, db: Session = Depends(get_db)):
    """Получить контроль затрат по смете"""
    controls = db.query(CostControlModel).filter(
        CostControlModel.estimate_id == estimate_id
    ).order_by(CostControlModel.control_date.desc()).all()
    return controls


@router.post("/estimates/{estimate_id}/calculate-summary")
def calculate_summary_estimate(estimate_id: int, db: Session = Depends(get_db)):
    """Рассчитать сводную смету на основе локальных смет"""
    from app.models.estimate import EstimateType
    
    estimate = db.query(EstimateModel).filter(EstimateModel.id == estimate_id).first()
    if not estimate:
        raise HTTPException(status_code=404, detail="Смета не найдена")
    
    if estimate.estimate_type != EstimateType.SUMMARY:
        raise HTTPException(status_code=400, detail="Смета должна быть сводной")
    
    # Находим все локальные и объектные сметы этого проекта
    local_estimates = db.query(EstimateModel).filter(
        EstimateModel.project_id == estimate.project_id,
        EstimateModel.estimate_type.in_([EstimateType.LOCAL, EstimateType.OBJECT]),
        EstimateModel.is_active == True
    ).all()
    
    total_amount = Decimal(0)
    total_materials = Decimal(0)
    total_labor = Decimal(0)
    total_equipment = Decimal(0)
    total_related = Decimal(0)
    
    for local_est in local_estimates:
        if local_est.total_amount:
            total_amount += local_est.total_amount
        if local_est.materials_cost:
            total_materials += local_est.materials_cost
        if local_est.labor_cost:
            total_labor += local_est.labor_cost
        if local_est.equipment_cost:
            total_equipment += local_est.equipment_cost
        if local_est.related_costs:
            total_related += local_est.related_costs
    
    estimate.total_amount = total_amount
    estimate.materials_cost = total_materials
    estimate.labor_cost = total_labor
    estimate.equipment_cost = total_equipment
    estimate.related_costs = total_related
    
    db.commit()
    db.refresh(estimate)
    return {
        "estimate_id": estimate.id,
        "total_amount": str(total_amount),
        "materials_cost": str(total_materials),
        "labor_cost": str(total_labor),
        "equipment_cost": str(total_equipment),
        "related_costs": str(total_related),
        "local_estimates_count": len(local_estimates)
    }