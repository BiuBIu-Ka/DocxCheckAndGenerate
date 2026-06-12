
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


class TemplateRule(BaseModel):
    section_name: str = Field(alias="sectionName")
    requirement_type: str = Field(alias="requirementType")
    description: str
    is_active: bool = Field(True, alias="isActive")

    model_config = {"populate_by_name": True}


class TemplateTerm(BaseModel):
    standard_name: str = Field(alias="standardName")
    aliases: Optional[str] = None
    forbidden_terms: Optional[str] = Field(None, alias="forbiddenTerms")
    description: Optional[str] = None

    model_config = {"populate_by_name": True}

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
    template_file_name: Optional[str] = Field(None, alias="templateFileName")
    structure_json: Optional[str] = Field(None, alias="structureJson")
    rules_json: Optional[str] = Field(None, alias="rulesJson")
    terms_json: Optional[str] = Field(None, alias="termsJson")
    content_json: Optional[str] = Field(None, alias="contentJson")
    review_score: Optional[int] = Field(None, alias="reviewScore")
    review_summary: Optional[str] = Field(None, alias="reviewSummary")
    issues_json: Optional[str] = Field(None, alias="issuesJson")
    
    model_config = {"populate_by_name": True}

class DocumentSchema(DocumentBase):
    id: int
    status: str
    template_file_name: Optional[str] = Field(None, alias="templateFileName")
    structure_json: Optional[str] = Field(None, alias="structureJson")
    rules_json: Optional[str] = Field(None, alias="rulesJson")
    terms_json: Optional[str] = Field(None, alias="termsJson")
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

# Model Providers
class ModelProviderResponse(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    provider: str
    base_url: Optional[str] = Field(None, alias="baseUrl")
    endpoint: Optional[str] = None # For status service
    model_name: Optional[str] = Field(None, alias="modelName")
    model: Optional[str] = None # For status service
    is_default: bool = Field(False, alias="isDefault")
    default: bool = False # For status service
    status: Optional[str] = "unknown"
    last_status: Optional[str] = Field(None, alias="lastStatus")

    model_config = {"populate_by_name": True, "from_attributes": True}

# Runtime Status
class RuntimeVersionInfo(BaseModel):
    node: str
    npm: str
    python: str
    git: str

class RuntimeServiceStatus(BaseModel):
    name: str
    status: str
    detail: str

class EnvironmentStatusResponse(BaseModel):
    platform: str
    workspace: str
    branch: str
    commit: str
    versions: RuntimeVersionInfo
    services: List[RuntimeServiceStatus]

class CodeStatusResponse(BaseModel):
    branch: str
    commit: str
    dirty: bool
    changed_files: int = Field(alias="changedFiles")
    untracked_files: int = Field(alias="untrackedFiles")
    client_pages: int = Field(alias="clientPages")
    client_components: int = Field(alias="clientComponents")
    server_routes: int = Field(alias="serverRoutes")
    server_tests: int = Field(alias="serverTests")
    
    model_config = {"populate_by_name": True}

class KnowledgeAssetSummary(BaseModel):
    category: str
    count: int
    description: str

class EnvironmentSummaryResponse(BaseModel):
    environment: EnvironmentStatusResponse
    code: CodeStatusResponse
    model_providers: List[ModelProviderResponse] = Field(alias="modelProviders")
    knowledge_assets: List[KnowledgeAssetSummary] = Field(alias="knowledgeAssets")
    
    model_config = {"populate_by_name": True}

# Manuals
class ManualDraftRequest(BaseModel):
    target_module: str = Field(alias="targetModule")
    target_audience: str = Field(alias="targetAudience")
    screenshots: List[str]

    model_config = {"populate_by_name": True}

class ManualDraftResponse(BaseModel):
    title: str
    paragraphs: List[str]
