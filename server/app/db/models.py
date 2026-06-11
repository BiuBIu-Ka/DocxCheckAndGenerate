
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from .database import Base

class ModelConfig(Base):
    __tablename__ = "model_configs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    provider = Column(String)  # openai, deepseek, ollama, etc.
    base_url = Column(String)
    api_key = Column(String)
    model_name = Column(String)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class GjbRule(Base):
    __tablename__ = "gjb_rules"

    id = Column(Integer, primary_key=True, index=True)
    doc_type = Column(String, index=True)  # SRS, SDD, etc.
    section_name = Column(String)
    requirement_type = Column(String)  # mandatory, optional
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DocumentTemplate(Base):
    __tablename__ = "document_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    doc_type = Column(String)
    structure_json = Column(Text)  # JSON string of the section tree
    file_path = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ReviewRecord(Base):
    __tablename__ = "review_records"

    id = Column(Integer, primary_key=True, index=True)
    doc_name = Column(String)
    doc_type = Column(String)
    score = Column(Integer)
    summary = Column(Text)
    issues_json = Column(Text)  # JSON string of list of issues
    created_at = Column(DateTime(timezone=True), server_default=func.now())
