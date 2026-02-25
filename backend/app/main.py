from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import engine, Base

# Импорт моделей для создания таблиц
from app.models.project import Project
from app.models.project_stage import ProjectStage
from app.models.executive_doc import ExecutiveDocument
from app.models.ks2 import KS2, KS2Item
from app.models.ks3 import KS3, KS3Item
from app.models.gpr import GPR, GPRTask
from app.models.ppr import PPR, PPRSection
from app.models.application import Application, ApplicationItem
from app.models.contract import Contract
from app.models.tender import Tender, Contractor, TenderParticipant, CommercialProposal, CommercialProposalItem
from app.models.estimate import Estimate, EstimateItem, RelatedCost
from app.models.invoice import Invoice
from app.models.department import Department
from app.models.object_construct import ObjectConstruct, ProjectConstruct
from app.models.standard_rate import StandardRate
from app.models.project_documentation import ProjectDocumentation
from app.models.executive_survey import ExecutiveSurvey
from app.models.work_volume import WorkVolume, WorkVolumeEntry
from app.models.project_change import ProjectChange, ChangeApproval, Defect
from app.models.material import Material, Warehouse, WarehouseStock, MaterialMovement, MaterialWriteOff, MaterialWriteOffItem
from app.models.document_version import DocumentVersion
from app.models.application_workflow import ApplicationWorkflow
from app.models.estimate_validation import EstimateValidation, VolumeProjectMatch, MaterialSpecification, EstimateContractLink, CostControl
from app.models.user import User, Permission, UserPermission
from app.models.receivables import Receivable, ReceivablePayment, ReceivableNotification, CollectionAction
from app.models.sales import SalesProposal, SalesProposalItem, CustomerAgreement
from app.models.document_roadmap import DocumentRoadmapSection, DocumentSectionStatus, DocumentFile
from app.models.document_notification import DocumentNotification
from app.models.personnel import Personnel, ProjectPersonnel, PersonnelDocument, PersonnelHistory

# Создание таблиц
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Система управления ПТО",
    description="Система для управления документационным сопровождением строительных проектов",
    version="1.0.0"
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
from app.api.v1 import (
    projects, project_stages, executive_docs, ks2, ks3, gpr, ppr,
    applications, contracts, tenders, estimates, invoices,
    departments, object_constructs, standard_rates,
    project_documentation, executive_surveys,
    work_volumes, project_changes, materials,
    application_workflow, document_versions, integration_1c,
    estimate_validation, users, receivables, sales, document_roadmap, personnel
)

app.include_router(projects.router, prefix="/api/v1/projects", tags=["Проекты"])
app.include_router(project_stages.router, prefix="/api/v1/project-stages", tags=["Этапы проекта"])
app.include_router(executive_docs.router, prefix="/api/v1/executive-docs", tags=["Исполнительная документация"])
app.include_router(ks2.router, prefix="/api/v1/ks2", tags=["КС-2"])
app.include_router(ks3.router, prefix="/api/v1/ks3", tags=["КС-3"])
app.include_router(gpr.router, prefix="/api/v1/gpr", tags=["ГПР"])
app.include_router(ppr.router, prefix="/api/v1/ppr", tags=["ППР"])
app.include_router(applications.router, prefix="/api/v1/applications", tags=["Заявки"])
app.include_router(contracts.router, prefix="/api/v1/contracts", tags=["Договора"])
app.include_router(tenders.router, prefix="/api/v1/tenders", tags=["Тендеры"])
app.include_router(estimates.router, prefix="/api/v1/estimates", tags=["Сметы"])
app.include_router(invoices.router, prefix="/api/v1/invoices", tags=["Счета на оплату"])
app.include_router(departments.router, prefix="/api/v1/departments", tags=["Подразделения"])
app.include_router(object_constructs.router, prefix="/api/v1/object-constructs", tags=["Конструктивы"])
app.include_router(standard_rates.router, prefix="/api/v1/standard-rates", tags=["Нормативные расценки"])
app.include_router(project_documentation.router, prefix="/api/v1/project-documentation", tags=["Проектная документация"])
app.include_router(executive_surveys.router, prefix="/api/v1/executive-surveys", tags=["Исполнительные съемки"])
app.include_router(work_volumes.router, prefix="/api/v1/work-volumes", tags=["Учет объемов работ"])
app.include_router(project_changes.router, prefix="/api/v1/project-changes", tags=["Изменения проекта"])
app.include_router(materials.router, prefix="/api/v1/materials", tags=["Материалы и склады"])
app.include_router(application_workflow.router, prefix="/api/v1/workflow", tags=["Workflow заявок"])
app.include_router(document_versions.router, prefix="/api/v1/document-versions", tags=["Версии документов"])
app.include_router(integration_1c.router, prefix="/api/v1/integration/1c", tags=["Интеграция с 1С"])
app.include_router(estimate_validation.router, prefix="/api/v1/validation", tags=["Проверка смет"])
app.include_router(users.router, prefix="/api/v1", tags=["Пользователи и роли"])
app.include_router(receivables.router, prefix="/api/v1/receivables", tags=["Дебиторская задолженность"])
app.include_router(sales.router, prefix="/api/v1/sales", tags=["Отдел продаж"])
app.include_router(document_roadmap.router, prefix="/api/v1/document-roadmap", tags=["Дорожная карта документов"])
app.include_router(personnel.router, prefix="/api/v1/personnel", tags=["Кадры"])


@app.get("/")
async def root():
    return {"message": "Система управления ПТО API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}