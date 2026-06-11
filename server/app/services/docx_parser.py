
from docx import Document
from typing import List, Dict, Any

class DocxParser:
    def parse_structure(self, file_path: str) -> List[Dict[str, Any]]:
        doc = Document(file_path)
        structure = []
        current_section = None
        
        for para in doc.paragraphs:
            # Detect headings based on style or outline level (simplified)
            if para.style.name.startswith('Heading'):
                level = int(para.style.name.split(' ')[-1]) if ' ' in para.style.name else 1
                section = {
                    "title": para.text.strip(),
                    "level": level,
                    "content": "",
                    "children": []
                }
                if level == 1:
                    structure.append(section)
                    current_section = section
                elif current_section:
                    # Very simple nesting logic for demo/MVP
                    current_section["children"].append(section)
            elif current_section:
                current_section["content"] += para.text + "\n"
                
        return structure

docx_parser = DocxParser()
