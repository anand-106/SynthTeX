import io
import pdfplumber
from docx import Document

def extract_text_from_pdf_bytes(data:bytes)->str:

    text_pages =[]

    with pdfplumber.open(io.BytesIO(data)) as pdf:

        for page in pdf.pages:
            text = page.extract_text()
            if text:
                text_pages.append(text)
        
    return "\n\n".join(text_pages)



def extract_text_from_docx_bytes(docx_bytes: bytes) -> str:
    doc = Document(io.BytesIO(docx_bytes))

    paragraphs = []
    for para in doc.paragraphs:
        text = para.text.strip()
        if text:
            paragraphs.append(text)

    return "\n\n".join(paragraphs)
