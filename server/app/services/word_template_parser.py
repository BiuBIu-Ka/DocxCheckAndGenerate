from __future__ import annotations

from html import escape
from pathlib import Path
import re
from typing import Any

import unword

from app.services.docx_parser import docx_parser


class WordTemplateParser:
    def _extract_doc_markdown(self, file_path: str) -> str:
        with open(file_path, "rb") as source:
            parsed = unword.parse_doc(source.read())
        body_text = getattr(parsed, "body_text", "") or ""
        textboxes = getattr(parsed, "textboxes", []) or []
        extra = "\n\n".join(item for item in textboxes if item)
        return "\n\n".join(part for part in [body_text, extra] if part).strip()

    def _markdown_to_html(self, markdown_text: str) -> str:
        blocks = [
            "<div class=\"template-doc legacy-doc\" style=\"font-family:'Microsoft YaHei', Arial, sans-serif;line-height:1.7;color:#1f2937;\">"
        ]
        for raw_line in markdown_text.splitlines():
            line = raw_line.strip()
            if not line:
                continue
            heading_match = re.match(r"^(#{1,6})\s+(.*)$", line)
            if heading_match:
                level = len(heading_match.group(1))
                blocks.append(f"<h{level}>{escape(heading_match.group(2))}</h{level}>")
            else:
                blocks.append(f"<p>{escape(line)}</p>")
        if len(blocks) == 1:
            blocks.append("<p>未提取到可展示内容。</p>")
        blocks.append("</div>")
        return "".join(blocks)

    def _structure_from_markdown(self, markdown_text: str) -> list[dict[str, Any]]:
        structure: list[dict[str, Any]] = []
        current_section: dict[str, Any] | None = None
        for raw_line in markdown_text.splitlines():
            line = raw_line.strip()
            if not line:
                continue
            heading_match = re.match(r"^(#{1,6})\s+(.*)$", line)
            numbered_title = re.match(r"^\d+(\.\d+)*[\s、.．]+.+", line)
            short_title = len(line) <= 40 and not line.endswith(("。", "；", ";", ":", "："))
            if heading_match or numbered_title or short_title:
                title = heading_match.group(2) if heading_match else line
                level = len(heading_match.group(1)) if heading_match else 1
                section = {
                    "title": title,
                    "level": min(max(level, 1), 6),
                    "content": "",
                    "children": [],
                }
                structure.append(section)
                current_section = section
                continue
            if current_section is not None:
                current_section["content"] += f"{line}\n"

        if structure:
            return structure
        fallback = markdown_text.strip().splitlines()
        title = fallback[0][:40] if fallback else "模板正文"
        return [{"title": title or "模板正文", "level": 1, "content": markdown_text.strip(), "children": []}]

    def parse_template(self, file_path: str, filename: str) -> dict[str, Any]:
        suffix = Path(filename).suffix.lower()
        if suffix == ".docx":
            parsed = docx_parser.parse_template(file_path)
            parsed["parserKind"] = "docx"
            parsed["fidelity"] = "high"
            return parsed
        if suffix == ".doc":
            markdown_text = self._extract_doc_markdown(file_path)
            return {
                "structure": self._structure_from_markdown(markdown_text),
                "html": self._markdown_to_html(markdown_text),
                "parserKind": "doc",
                "fidelity": "medium",
            }
        raise ValueError("模板解析仅支持 .doc 或 .docx 文件。")

    def extract_text(self, file_path: str, filename: str) -> str:
        suffix = Path(filename).suffix.lower()
        if suffix == ".docx":
            parsed = docx_parser.parse_template(file_path)
            return re.sub(r"<[^>]+>", "", parsed["html"])
        if suffix == ".doc":
            return self._extract_doc_markdown(file_path)
        raise ValueError("不支持的 Word 文件类型。")


word_template_parser = WordTemplateParser()
