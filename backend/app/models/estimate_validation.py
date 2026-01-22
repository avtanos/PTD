from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Numeric, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class ValidationStatus(str, enum.Enum):
    """Статусы проверки"""
    PENDING = "pending"  # Ожидает проверки
    IN_PROGRESS = "in_progress"  # Проверяется
    PASSED = "passed"  # Прошла проверку
    FAILED = "failed"  # Не прошла проверку
    NEEDS_REVIEW = "needs_review"  # Требует доработки


class ValidationRule(str, enum.Enum):
    """Правила проверки"""
    VOLUME_MATCH = "volume_match"  # Соответствие объемов
    SPECIFICATION_MATCH = "specification_match"  # Соответствие спецификации
    COST_RANGE = "cost_range"  # Соответствие диапазону стоимости
    CONSTRUCT_COMPLETE = "construct_complete"  # Полнота конструктивов
    DOCUMENTATION_COMPLETE = "documentation_complete"  # Полнота документации


class EstimateValidation(Base):
    """Модель проверки сметы на соответствие проекту"""
    __tablename__ = "estimate_validations"

    id = Column(Integer, primary_key=True, index=True)
    estimate_id = Column(Integer, ForeignKey("estimates.id"), nullable=False, index=True)
    validation_type = Column(String(100), nullable=False, comment="Тип проверки")
    rule = Column(Enum(ValidationRule), nullable=False, comment="Правило проверки")
    status = Column(Enum(ValidationStatus), default=ValidationStatus.PENDING, comment="Статус")
    checked_by = Column(String(200), comment="Проверил")
    checked_date = Column(DateTime(timezone=True), comment="Дата проверки")
    description = Column(Text, comment="Описание проверки")
    expected_value = Column(String(500), comment="Ожидаемое значение")
    actual_value = Column(String(500), comment="Фактическое значение")
    deviation_percentage = Column(Numeric(5, 2), comment="Процент отклонения")
    is_critical = Column(Boolean, default=False, comment="Критичное отклонение")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    estimate = relationship("Estimate", back_populates="validations")


class VolumeProjectMatch(Base):
    """Модель проверки соответствия объемов работ проекту"""
    __tablename__ = "volume_project_matches"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    construct_id = Column(Integer, ForeignKey("object_constructs.id"), comment="Конструктив")
    work_volume_id = Column(Integer, ForeignKey("work_volumes.id"), comment="Объем работ")
    estimate_id = Column(Integer, ForeignKey("estimates.id"), comment="Смета")
    project_documentation_id = Column(Integer, ForeignKey("project_documentation.id"), comment="Проектная документация")
    work_code = Column(String(100), comment="Код работы")
    work_name = Column(String(1000), comment="Наименование работы")
    project_volume = Column(Numeric(15, 3), comment="Объем по проекту")
    estimated_volume = Column(Numeric(15, 3), comment="Объем по смете")
    actual_volume = Column(Numeric(15, 3), comment="Фактический объем")
    deviation_estimate = Column(Numeric(15, 3), comment="Отклонение сметы от проекта")
    deviation_actual = Column(Numeric(15, 3), comment="Отклонение факта от проекта")
    deviation_percentage = Column(Numeric(5, 2), comment="Процент отклонения")
    status = Column(String(50), default="pending", comment="Статус проверки")
    checked_by = Column(String(200), comment="Проверил")
    checked_date = Column(DateTime(timezone=True), comment="Дата проверки")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project = relationship("Project", back_populates="volume_matches")
    construct = relationship("ObjectConstruct")
    work_volume = relationship("WorkVolume")
    estimate = relationship("Estimate")
    project_documentation = relationship("ProjectDocumentation")


class MaterialSpecification(Base):
    """Модель спецификации материалов из проектной документации"""
    __tablename__ = "material_specifications"

    id = Column(Integer, primary_key=True, index=True)
    project_documentation_id = Column(Integer, ForeignKey("project_documentation.id"), nullable=False, index=True)
    construct_id = Column(Integer, ForeignKey("object_constructs.id"), comment="Конструктив")
    material_code = Column(String(100), comment="Код материала")
    material_name = Column(String(500), nullable=False, comment="Наименование материала")
    specification = Column(Text, comment="Характеристики/спецификация (детальное описание)")
    unit = Column(String(50), comment="Единица измерения")
    quantity = Column(Numeric(15, 3), comment="Количество по проекту")
    unit_price = Column(Numeric(15, 2), comment="Цена за единицу")
    total_price = Column(Numeric(15, 2), comment="Общая стоимость")
    brand = Column(String(200), comment="Марка/производитель")
    standard = Column(String(200), comment="ГОСТ/СП/СНиП")
    manufacturer = Column(String(500), comment="Производитель")
    supplier = Column(String(500), comment="Поставщик")
    delivery_date = Column(Date, comment="Срок поставки")
    quality_certificate = Column(String(500), comment="Сертификат качества")
    storage_conditions = Column(Text, comment="Условия хранения")
    installation_requirements = Column(Text, comment="Требования к монтажу")
    compatibility = Column(Text, comment="Совместимость с другими материалами")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project_documentation = relationship("ProjectDocumentation", back_populates="material_specifications")
    construct = relationship("ObjectConstruct")


class EstimateContractLink(Base):
    """Модель связи сметы с договором"""
    __tablename__ = "estimate_contract_links"

    id = Column(Integer, primary_key=True, index=True)
    estimate_id = Column(Integer, ForeignKey("estimates.id"), nullable=False, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False, index=True)
    is_primary = Column(Boolean, default=False, comment="Основная смета для договора")
    usage_type = Column(String(50), comment="Тип использования (basis, control, comparison)")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    estimate = relationship("Estimate", back_populates="contract_links")
    contract = relationship("Contract", back_populates="estimate_links")


class CostControl(Base):
    """Модель контроля затрат по смете"""
    __tablename__ = "cost_controls"

    id = Column(Integer, primary_key=True, index=True)
    estimate_id = Column(Integer, ForeignKey("estimates.id"), nullable=False, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), comment="Связанный договор")
    control_date = Column(Date, nullable=False, comment="Дата контроля")
    planned_amount = Column(Numeric(15, 2), nullable=False, comment="Плановая сумма")
    actual_amount = Column(Numeric(15, 2), default=0, comment="Фактическая сумма")
    deviation_amount = Column(Numeric(15, 2), comment="Отклонение")
    deviation_percentage = Column(Numeric(5, 2), comment="Процент отклонения")
    materials_planned = Column(Numeric(15, 2), comment="План: материалы")
    materials_actual = Column(Numeric(15, 2), comment="Факт: материалы")
    labor_planned = Column(Numeric(15, 2), comment="План: работы")
    labor_actual = Column(Numeric(15, 2), comment="Факт: работы")
    equipment_planned = Column(Numeric(15, 2), comment="План: механизмы")
    equipment_actual = Column(Numeric(15, 2), comment="Факт: механизмы")
    related_costs_planned = Column(Numeric(15, 2), comment="План: сопутствующие")
    related_costs_actual = Column(Numeric(15, 2), comment="Факт: сопутствующие")
    status = Column(String(50), default="normal", comment="Статус (normal, warning, critical)")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    estimate = relationship("Estimate", back_populates="cost_controls")
    contract = relationship("Contract")