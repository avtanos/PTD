from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class DocumentType(str, enum.Enum):
    """Типы исполнительной документации"""
    EXECUTIVE_SCHEME = "executive_scheme"  # Исполнительная схема
    HIDDEN_WORK_ACT = "hidden_work_act"  # Акт на скрытые работы
    TEST_ACT = "test_act"  # Акт испытаний
    WORK_JOURNAL = "work_journal"  # Журнал работ
    MATERIAL_CERTIFICATE = "material_certificate"  # Сертификат на материалы
    OTHER = "other"  # Прочее
    
    @classmethod
    def _missing_(cls, value):
        """Обработка значений, которые не соответствуют Enum (для обратной совместимости)"""
        if isinstance(value, str):
            # Пробуем найти по значению в нижнем регистре
            for member in cls:
                if member.value.lower() == value.lower():
                    return member
        return None


class ExecutiveDocument(Base):
    """Модель исполнительной документации"""
    __tablename__ = "executive_documents"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    doc_type = Column(String(50), nullable=False, comment="Тип документа")
    name = Column(String(500), nullable=False, comment="Наименование документа")
    number = Column(String(100), comment="Номер документа")
    date = Column(Date, comment="Дата документа")
    description = Column(Text, comment="Описание")
    file_path = Column(String(1000), comment="Путь к файлу")
    created_by = Column(String(200), comment="Создал")
    approved_by = Column(String(200), comment="Утвердил")
    status = Column(String(50), default="draft", comment="Статус (draft, in_work, in_review, approved, signed, rejected)")
    department = Column(String(200), comment="Подразделение (геодезия)")
    ks2_id = Column(Integer, ForeignKey("ks2.id"), comment="Связанный КС-2")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="executive_docs")
    ks2 = relationship("KS2", foreign_keys=[ks2_id])