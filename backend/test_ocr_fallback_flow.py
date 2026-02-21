
import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from case_parser import CaseParser

class TestOCRFallback(unittest.TestCase):
    def setUp(self):
        self.parser = CaseParser()

    @patch("case_parser.pdfplumber.open")
    def test_extract_text_empty(self, mock_pdf_open):
        # Simulate PDF with no text (scanned)
        mock_pdf = MagicMock()
        mock_page = MagicMock()
        mock_page.extract_text.return_value = "" # No text
        mock_pdf.pages = [mock_page]
        
        # Context manager mock
        mock_pdf_open.return_value.__enter__.return_value = mock_pdf
        
        text = self.parser.extract_text_from_pdf("dummy.pdf")
        self.assertEqual(text.strip(), "")

    def test_parse_from_images(self):
        # Mock fitz module
        mock_fitz = MagicMock()
        mock_doc = MagicMock()
        mock_doc.__len__.return_value = 1
        mock_page = MagicMock()
        mock_page.get_pixmap.return_value.tobytes.return_value = b"fake_image_data"
        mock_doc.load_page.return_value = mock_page
        mock_fitz.open.return_value = mock_doc
        
        # Mock search module and client
        mock_search = MagicMock()
        mock_client = MagicMock()
        mock_search.client = mock_client
        
        # OpenAI response mock
        mock_response = MagicMock()
        mock_response.choices[0].message.content = """
        {
            "case_number": "2024가단12345",
            "court": "서울중앙지방법원",
            "facts": "Scanned facts extracted via Vision",
            "issues": "Scanned issue",
            "reasoning": "Scanned reasoning",
            "conclusion": "Plaintiff Wins",
            "client_story": "Vision story",
            "ai_tags": "Vision, OCR"
        }
        """
        mock_client.chat.completions.create.return_value = mock_response

        # Patch sys.modules to mock 'search' AND 'fitz'
        with patch.dict(sys.modules, {"search": mock_search, "fitz": mock_fitz}):
            # Execute
            result = self.parser.parse_from_images("dummy.pdf")
        
        # Verify
        self.assertEqual(result["case_number"], "2024가단12345")
        self.assertEqual(result["facts"], "Scanned facts extracted via Vision")
        self.assertIn("Vision", result["full_text"])

if __name__ == "__main__":
    unittest.main()
