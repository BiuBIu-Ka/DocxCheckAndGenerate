
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from .database import Base

class ModelConfig(Base):
    __tablename__ = "model_configs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    provider = Column(String)
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
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TermBase(Base):
    __tablename__ = "term_bases"
    id = Column(Integer, primary_key=True, index=True)
    standard_name = Column(String, index=True)
    aliases = Column(String)  # Comma separated
    forbidden_terms = Column(String)  # Comma separated
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    project_name = Column(String, index=True)
    doc_type = Column(String)
    status = Column(String, default="draft")  # draft, generating, reviewing, completed
    template_file_name = Column(String)
    template_html = Column(Text)
    structure_json = Column(Text)  # JSON string of parsed structure
    rules_json = Column(Text)  # JSON string of template-scoped rules
    terms_json = Column(Text)  # JSON string of template-scoped terms
    content_json = Column(Text)  # JSON string of sections
    review_score = Column(Integer)
    review_summary = Column(Text)
    issues_json = Column(Text)  # JSON string of list of issues
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class DocumentTemplate(Base):
    __tablename__ = "document_templates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    doc_type = Column(String)
    structure_json = Column(Text)
    file_path = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
