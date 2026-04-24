from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import patch, MagicMock
from app.models.policy import RecommendationResponse

client = TestClient(app)

@patch("app.services.rag_service.rag_service.list_documents")
@patch("app.services.rag_service.rag_service.query_documents")
@patch("app.services.ai_agent.ai_agent.generate_recommendation")
def test_recommendation_endpoint(mock_gen, mock_query, mock_list):
    """Test the recommendation flow with mocked RAG and AI."""
    # Setup mocks
    mock_list.return_value = [{"filename": "test.pdf", "insurer": "TestInsurer"}]
    mock_query.return_value = ["Policy chunk 1", "Policy chunk 2"]
    
    mock_gen.return_value = RecommendationResponse(
        comparison_table=[{
            "policy_name": "Test Policy",
            "insurer": "TestInsurer",
            "premium": "5000",
            "cover_amount": "5L",
            "waiting_period": "2 years",
            "key_benefit": "OPD Cover",
            "suitability_score": 90
        }],
        coverage_details={
            "inclusions": "Everything",
            "exclusions": "Nothing",
            "sub_limits": "None",
            "copay": "0%",
            "claim_type": "Cashless"
        },
        why_this_policy="Because it is a test."
    )

    # Execute
    payload = {
        "full_name": "Test User",
        "age": 30,
        "lifestyle": "Active",
        "conditions": ["None"],
        "income": "3-8L",
        "city": "Metro"
    }
    response = client.post("/recommend", json=payload)
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "comparison_table" in data
    assert data["comparison_table"][0]["policy_name"] == "Test Policy"
    
    # Verify RAG was called
    mock_list.assert_called_once()
    mock_query.assert_called()
    mock_gen.assert_called_once()
