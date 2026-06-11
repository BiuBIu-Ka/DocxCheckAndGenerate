import re
from dataclasses import dataclass


@dataclass
class ParsedSection:
    title: str
    body: str


class DocumentParser:
    def parse(self, content: str) -> list[ParsedSection]:
        chunks = [chunk.strip() for chunk in re.split(r"\n(?=\d+\.|#)", content) if chunk.strip()]
        sections: list[ParsedSection] = []
        for chunk in chunks:
            lines = chunk.splitlines()
            title = lines[0].strip()
            body = "\n".join(lines[1:]).strip() if len(lines) > 1 else ""
            sections.append(ParsedSection(title=title, body=body))
        if not sections:
            sections.append(ParsedSection(title="正文", body=content.strip()))
        return sections


document_parser = DocumentParser()
