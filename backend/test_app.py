"""
Backend API Tests
"""
import pytest
from app import app


@pytest.fixture
def client():
    """Create test client"""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


class TestHealthEndpoint:
    """Tests for /health endpoint"""
    
    def test_health_returns_200(self, client):
        """Health endpoint should return 200 OK"""
        response = client.get("/health")
        assert response.status_code == 200
    
    def test_health_returns_json(self, client):
        """Health endpoint should return JSON"""
        response = client.get("/health")
        assert response.content_type == "application/json"
    
    def test_health_contains_status(self, client):
        """Health response should contain status field"""
        response = client.get("/health")
        data = response.get_json()
        assert "status" in data
        assert data["status"] == "healthy"
    
    def test_health_contains_version(self, client):
        """Health response should contain version field"""
        response = client.get("/health")
        data = response.get_json()
        assert "version" in data


class TestStatusEndpoint:
    """Tests for /api/v1/status endpoint"""
    
    def test_status_returns_200(self, client):
        """Status endpoint should return 200 OK"""
        response = client.get("/api/v1/status")
        assert response.status_code == 200
    
    def test_status_contains_endpoints(self, client):
        """Status response should list available endpoints"""
        response = client.get("/api/v1/status")
        data = response.get_json()
        assert "endpoints" in data
        assert len(data["endpoints"]) > 0


class TestCompileEndpoint:
    """Tests for /api/v1/compile endpoint"""
    
    def test_compile_requires_post(self, client):
        """Compile endpoint should only accept POST"""
        response = client.get("/api/v1/compile")
        assert response.status_code == 405
    
    def test_compile_requires_json(self, client):
        """Compile endpoint should require JSON body"""
        response = client.post("/api/v1/compile", data="not json")
        assert response.status_code == 400
    
    def test_compile_requires_latex_field(self, client):
        """Compile endpoint should require latex field"""
        response = client.post("/api/v1/compile", json={"other": "data"})
        assert response.status_code == 400
    
    def test_compile_accepts_latex(self, client):
        """Compile endpoint should accept valid latex"""
        response = client.post("/api/v1/compile", json={"latex": "\\documentclass{article}"})
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "success"


class TestErrorHandling:
    """Tests for error handling"""
    
    def test_404_returns_json(self, client):
        """404 errors should return JSON"""
        response = client.get("/nonexistent")
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data
