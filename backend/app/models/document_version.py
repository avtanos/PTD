from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class DocumentVersion(Base):
    """Модель версии документа"""
    __tablename__ = "document_versions"

    id = Column(Integer, primary_key=True, index=True)
    document_type = Column(String(100), nullable=False, index=True, comment="Тип документа (executive_doc, project_doc, etc.)")
    document_id = Column(Integer, nullable=False, index=True, comment="ID документа")
    version_number = Column(String(50), nullable=False, comment="Номер версии")
    version_date = Column(Date, nullable=False, comment="Дата версии")
    file_path = Column(String(1000), comment="Путь к файлу версии")
    file_name = Column(String(500), comment="Имя файла")
    file_size = Column(Integer, comment="Размер файла (байт)")
    mime_type = Column(String(100), comment="MIME тип")
    changes_description = Column(Text, comment="Описание изменений")
    created_by = Column(String(200), nullable=False, comment="Создал")
    is_current = Column(Boolean, default=False, comment="Текущая версия")
    previous_version_id = Column(Integer, ForeignKey("document_versions.id"), comment="Предыдущая версия")
    notes = Column(Text, comment="Примечания")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    previous_version = relationship("DocumentVersion", remote_side=[id])