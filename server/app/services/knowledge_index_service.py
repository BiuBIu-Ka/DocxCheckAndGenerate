from app.data.demo_assets import KNOWLEDGE_ASSETS
from app.schemas import KnowledgeAssetSummary, KnowledgeSummaryResponse
from app.services.term_service import term_service


class KnowledgeIndexService:
    def summary(self) -> KnowledgeSummaryResponse:
        return KnowledgeSummaryResponse(
            assets=[KnowledgeAssetSummary(**item) for item in KNOWLEDGE_ASSETS],
            hotTerms=term_service.hot_terms(),
        )

    def retrieve_context(self, document_type: str, prompt: str) -> list[str]:
        snippets = {
            "requirements": [
                "需求文档需明确功能边界、输入输出和异常场景。",
                "关键术语应引用统一术语基线，避免项目内多义表达。",
            ],
            "design": [
                "设计文档应包含模块职责、接口约束和异常处理策略。",
                "高可靠场景需补充状态切换与故障降级描述。",
            ],
            "testing": [
                "测试文档应关联需求来源，并给出判定准则与覆盖边界。",
            ],
            "manual": [
                "手册需按操作步骤组织，并辅以截图和注意事项。",
            ],
        }
        return snippets.get(document_type, []) + [prompt]


knowledge_index_service = KnowledgeIndexService()
