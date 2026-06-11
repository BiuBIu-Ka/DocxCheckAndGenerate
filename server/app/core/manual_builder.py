from pathlib import Path

from app.schemas import ManualDraftRequest, ManualDraftResponse


class ManualBuilder:
    def build(self, payload: ManualDraftRequest) -> ManualDraftResponse:
        paragraphs = []
        for index, screenshot in enumerate(payload.screenshots, start=1):
            name = Path(screenshot).name
            paragraphs.append(
                f"步骤 {index}：在“{payload.target_module}”界面中定位与 {name} 对应的操作区域，由 {payload.target_audience} 完成关键动作并核对界面反馈。"
            )
        return ManualDraftResponse(
            title=f"{payload.target_module} 操作说明草稿",
            paragraphs=paragraphs,
        )


manual_builder = ManualBuilder()
