from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "database" in data

def test_feature_flags():
    response = client.get("/feature-flags")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    flags = {f["flag"] for f in data}
    assert "chat_ia" in flags
    assert "timeline" in flags
