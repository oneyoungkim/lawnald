
import sys
import os
import unittest
from unittest.mock import MagicMock, patch

# Add current directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from case_parser import CaseParser
from search import SearchEngine

class TestPDFPipeline(unittest.TestCase):
    def setUp(self):
        self.parser = CaseParser()
        self.search_engine = SearchEngine()

    def test_parse_structure(self):
        # Mock text that looks like a judgment
        mock_text = """
        2023가단12345
        서울중앙지방법원
        
        주 문
        1. 피고는 원고에게 1,000,000원을 지급하라.
        
        청 구 취 지
        피고는 원고에게 1,000,000원을 지급하라.
        
        이 유
        1. 인정사실
        원고와 피고는 2020. 1. 1. 계약을 체결하였다.
        """
        
        structured = self.parser.parse_structure(mock_text)
        self.assertEqual(structured['case_number'], "2023가단12345")
        self.assertIn("서울중앙", structured['court'])
        self.assertEqual(structured['full_text'], mock_text)

    def test_anonymize(self):
        text = "원고 김철수(800101-1234567)는 피고 이영희(010-1234-5678)에게..."
        anonymized = self.parser.anonymize_additional(text)
        
        # Check if RRN is masked
        self.assertNotIn("800101-1234567", anonymized)
        # Check if phone is masked
        self.assertNotIn("010-1234-5678", anonymized)

    def test_add_case_to_index(self):
        # Verify method exists and runs without error (mocking OpenAI)
        with patch.object(self.search_engine, '_get_embedding') as mock_embed:
            mock_embed.return_value = [0.1] * 1536
            
            case_data = {
                "title": "Test Case",
                "summary": "This is a summary."
            }
            
            # Use a dummy lawyer ID that exists in mock DB or just a random one
            # The function prints error if lawyer not found but shouldn't crash
            try:
                self.search_engine.add_case_to_index("lawyer1", case_data)
            except Exception as e:
                self.fail(f"add_case_to_index raised exception: {e}")
                
            # Check if embedding was called
            mock_embed.assert_called_once()
            
            # Check if corpus size increased (or initialized)
            self.assertGreater(len(self.search_engine.corpus_embeddings), 0)

if __name__ == '__main__':
    unittest.main()
