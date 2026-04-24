from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_root():
    """Test the root endpoint returns 200 and correct app name."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {
        "app": "AarogyaAid AI",
        "status": "ready",
        "docs": "/docs"
    }

def test_admin_policies_unauthorized():
    """Test that admin endpoints are protected by basic auth."""
    response = client.get("/admin/policies")
    assert response.status_code == 401
