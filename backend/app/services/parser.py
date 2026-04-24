from pypdf import PdfReader
from io import BytesIO

def parse_pdf(file_content: bytes) -> str:
    """Extract text from PDF bytes."""
    reader = PdfReader(BytesIO(file_content))
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text
