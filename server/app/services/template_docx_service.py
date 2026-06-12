from __future__ import annotations

from pathlib import Path
import re
from typing import Any

from docx import Document as DocxDocument
from docx.oxml import OxmlElement
from docx.text.paragraph import Paragraph
import markdown
from htmldocx import HtmlToDocx


class TemplateDocxService:
    def _normalize(self, text: str) -> str:
        return re.sub(r"[\s\u3000]+", "", (text or "")).lower()

    def _is_heading_text(self, text: str) -> bool:
        text = (text or "").strip()
        if not text:
            return False
        if re.match(r"^\d+(\.\d+)*[\s、.．]+.+", text):
            return True
        return len(text) <= 40 and not text.endswith(("。", "；", ";", ":", "："))

    def _is_heading_paragraph(self, paragraph: Paragraph) -> bool:
        style_name = paragraph.style.name if paragraph.style else ""
        return style_name.startswith("Heading") or self._is_heading_text(paragraph.text)

    def _section_ranges(self, doc: DocxDocument) -> list[dict[str, Any]]:
        sections: list[dict[str, Any]] = []
        paragraphs = list(doc.paragraphs)
        current: dict[str, Any] | None = None
        for index, paragraph in enumerate(paragraphs):
            text = (paragraph.text or "").strip()
            if not text:
                continue
            if self._is_heading_paragraph(paragraph):
                if current is not None:
                    current["end"] = index
                    sections.append(current)
                current = {
                    "title": text,
                    "normalized": self._normalize(text),
                    "start": index,
                    "end": len(paragraphs),
                    "body_style": None,
                }
                continue
            if current is not None and current["body_style"] is None:
                current["body_style"] = paragraph.style.name if paragraph.style else None

        if current is not None:
            sections.append(current)
        return sections

    def _remove_paragraph(self, paragraph: Paragraph) -> None:
        element = paragraph._element
        parent = element.getparent()
        if parent is not None:
            parent.remove(element)

    def _insert_markdown_after(self, anchor: Paragraph, text: str) -> Paragraph:
        temp_doc = DocxDocument()
        html = markdown.markdown(
            text,
            extensions=["tables", "fenced_code", "sane_lists", "nl2br"]
        )
        parser = HtmlToDocx()
        parser.add_html_to_document(html, temp_doc)

        current_anchor_el = anchor._p
        for child in list(temp_doc.element.body):
            if child.tag.endswith('sectPr'):
                continue
            current_anchor_el.addnext(child)
            current_anchor_el = child

        # Find the last inserted element as a paragraph (if we need to return something, 
        # though returning the last paragraph might be complex if it's a table, 
        # but we don't strictly need to return it).
        return anchor

    def _replace_section_body(
        self,
        doc: DocxDocument,
        section: dict[str, Any],
        body: str,
    ) -> None:
        paragraphs = list(doc.paragraphs)
        start = section["start"]
        end = section["end"]
        for paragraph in paragraphs[start + 1:end]:
            if self._is_heading_paragraph(paragraph):
                continue
            self._remove_paragraph(paragraph)

        anchor = list(doc.paragraphs)[start]
        self._insert_markdown_after(anchor, str(body))

    def _infer_heading_style(self, title: str) -> str:
        if re.match(r"^\d+\.\d+\.\d+", title):
            return "Heading 3"
        if re.match(r"^\d+\.\d+", title):
            return "Heading 2"
        return "Heading 1"

    def export_with_template(
        self,
        template_path: str,
        output_path: str,
        content_map: dict[str, Any],
        structure: list[dict[str, Any]] | None = None,
    ) -> None:
        doc = DocxDocument(template_path)
        sections = self._section_ranges(doc)
        section_map = {section["normalized"]: section for section in sections}

        for title, body in content_map.items():
            section = section_map.get(self._normalize(str(title)))
            if section:
                self._replace_section_body(doc, section, str(body))
                continue

            heading = doc.add_paragraph(style=self._infer_heading_style(str(title)))
            heading.add_run(str(title))
            self._insert_markdown_after(heading, str(body))

        doc.save(output_path)


template_docx_service = TemplateDocxService()
