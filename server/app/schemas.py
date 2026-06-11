from pydantic import BaseModel, Field


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
    issues: list[ReviewIssue]


class GenerationRequest(BaseModel):
    document_type: str = Field(alias="documentType")
    project_name: str = Field(alias="projectName")
    template_name: str = Field(alias="templateName")
    prompt: str

    model_config = {"populate_by_name": True}


class GenerationResponse(BaseModel):
    title: str
    document_type: str = Field(alias="documentType")
    sections: list[GeneratedSection]
    review: ReviewResponse

    model_config = {"populate_by_name": True}


class ReviewRequest(BaseModel):
    document_type: str = Field(alias="documentType")
    content: str

    model_config = {"populate_by_name": True}


class KnowledgeAssetSummary(BaseModel):
    category: str
    count: int
    description: str


class KnowledgeSummaryResponse(BaseModel):
    assets: list[KnowledgeAssetSummary]
    hot_terms: list[str] = Field(alias="hotTerms")

    model_config = {"populate_by_name": True}


class ModelProviderResponse(BaseModel):
    provider: str
    endpoint: str
    model: str
    status: str
    default: bool


class ManualDraftRequest(BaseModel):
    screenshots: list[str]
    target_audience: str = Field(alias="targetAudience")
    target_module: str = Field(alias="targetModule")

    model_config = {"populate_by_name": True}


class ManualDraftResponse(BaseModel):
    title: str
    paragraphs: list[str]
