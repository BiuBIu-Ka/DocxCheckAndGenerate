
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class GeneratedSection(BaseModel):
    title: str
    body: str

class ReviewIssue(BaseModel):
    id: str
    title: str
    severity: str
    rule: str
    suggestion: str
    location: str
    status: str = "open"

class ReviewResponse(BaseModel):
    score: int
    summary: str
    issues: List[ReviewIssue]

# Document Models
class DocumentBase(BaseModel):
    title: str
    project_name: str = Field(alias="projectName")
    doc_type: str = Field(alias="docType")
    
    model_config = {"populate_by_name": True}

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    content_json: Optional[str] = Field(None, alias="contentJson")
    review_score: Optional[int] = Field(None, alias="reviewScore")
    review_summary: Optional[str] = Field(None, alias="reviewSummary")
    issues_json: Optional[str] = Field(None, alias="issuesJson")
    
    model_config = {"populate_by_name": True}

class DocumentSchema(DocumentBase):
    id: int
    status: str
    content_json: Optional[str] = Field(None, alias="contentJson")
    review_score: Optional[int] = Field(None, alias="reviewScore")
    review_summary: Optional[str] = Field(None, alias="reviewSummary")
    issues_json: Optional[str] = Field(None, alias="issuesJson")
    created_at: datetime = Field(alias="createdAt")
    
    model_config = {"populate_by_name": True, "from_attributes": True}

# Rule Models
class GjbRuleBase(BaseModel):
    doc_type: str = Field(alias="docType")
    section_name: str = Field(alias="sectionName")
    requirement_type: str = Field(alias="requirementType")
    description: str
    is_active: bool = Field(True, alias="isActive")
    
    model_config = {"populate_by_name": True}

class GjbRuleCreate(GjbRuleBase):
    pass

class GjbRuleSchema(GjbRuleBase):
    id: int
    
    model_config = {"populate_by_name": True, "from_attributes": True}

# Term Models
class TermBaseSchema(BaseModel):
    standard_name: str = Field(alias="standardName")
    aliases: Optional[str] = None
    forbidden_terms: Optional[str] = Field(None, alias="forbiddenTerms")
    description: Optional[str] = None
    
    model_config = {"populate_by_name": True}

class TermCreate(TermBaseSchema):
    pass

class TermSchema(TermBaseSchema):
    id: int
    
    model_config = {"populate_by_name": True, "from_attributes": True}

# Legacy / Utils
class ModelProviderResponse(BaseModel):
    id: int
    name: str
    provider: str
    base_url: str
    model_name: str
    is_default: bool
    last_status: Optional[str] = "unknown"
