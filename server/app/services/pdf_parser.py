
import fitz  # PyMuPDF
from typing import List, Dict, Any

class PdfParser:
    def parse_text(self, file_path: str) -> str:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        return text

pdf_parser = PdfParser()
