from app.data.demo_assets import TERMS


class TermService:
    def hot_terms(self) -> list[str]:
        return TERMS


term_service = TermService()
