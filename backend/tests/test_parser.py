from app.services.parser import parse_pdf
from unittest.mock import MagicMock, patch
from io import BytesIO

@patch("app.services.parser.PdfReader")
def test_parse_pdf(mock_pdf_reader):
    """Test PDF parsing by mocking PdfReader."""
    # Setup mock
    mock_page = MagicMock()
    mock_page.extract_text.return_value = "Hello World"
    
    mock_reader_instance = MagicMock()
    mock_reader_instance.pages = [mock_page]
    mock_pdf_reader.return_value = mock_reader_instance
    
    # Execute
    result = parse_pdf(b"dummy pdf content")
    
    # Assert
    assert "Hello World" in result
    mock_pdf_reader.assert_called_once()
