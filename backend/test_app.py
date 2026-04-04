"""
Backend API Tests
"""
import pytest
from app import app, documents, documents_lock, MAX_DOCUMENTS


@pytest.fixture
def client():
    """Create test client"""
    app.config["TESTING"] = True
    with app.test_client() as client:
        # Clear documents between tests
        with documents_lock:
            documents.clear()
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


class TestDocumentsEndpoint:
    """Tests for /api/v1/documents endpoint - Document Storage API"""
    
    def test_create_document_returns_201(self, client):
        """POST /api/v1/documents should create a document and return 201"""
        response = client.post("/api/v1/documents", json={
            "title": "My Document",
            "content": "\\documentclass{article}\n\\begin{document}\nHello\n\\end{document}"
        })
        assert response.status_code == 201
        data = response.get_json()
        assert "id" in data
        assert data["title"] == "My Document"
    
    def test_create_document_requires_content(self, client):
        """POST /api/v1/documents should require content field"""
        response = client.post("/api/v1/documents", json={
            "title": "My Document"
        })
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
    
    def test_create_document_rejects_invalid_json(self, client):
        """POST /api/v1/documents should reject invalid JSON"""
        response = client.post("/api/v1/documents", 
                               data="not valid json",
                               content_type="application/json")
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "JSON" in data["error"]
    
    def test_create_document_rejects_empty_json_object(self, client):
        """POST /api/v1/documents should reject empty JSON object"""
        response = client.post("/api/v1/documents", json={})
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "empty" in data["error"]
    
    def test_list_documents_returns_200(self, client):
        """GET /api/v1/documents should return 200 with list of documents"""
        response = client.get("/api/v1/documents")
        assert response.status_code == 200
        data = response.get_json()
        assert "documents" in data
        assert isinstance(data["documents"], list)
    
    def test_get_document_by_id(self, client):
        """GET /api/v1/documents/:id should return the document"""
        # First create a document
        create_response = client.post("/api/v1/documents", json={
            "title": "Test Doc",
            "content": "\\documentclass{article}"
        })
        doc_id = create_response.get_json()["id"]
        
        # Then get it
        response = client.get(f"/api/v1/documents/{doc_id}")
        assert response.status_code == 200
        data = response.get_json()
        assert data["id"] == doc_id
        assert data["title"] == "Test Doc"
    
    def test_get_nonexistent_document_returns_404(self, client):
        """GET /api/v1/documents/:id should return 404 for non-existent document"""
        response = client.get("/api/v1/documents/nonexistent-id")
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data
    
    def test_update_document(self, client):
        """PUT /api/v1/documents/:id should update the document"""
        # First create a document
        create_response = client.post("/api/v1/documents", json={
            "title": "Original Title",
            "content": "Original Content"
        })
        doc_id = create_response.get_json()["id"]
        
        # Update it
        response = client.put(f"/api/v1/documents/{doc_id}", json={
            "title": "Updated Title",
            "content": "Updated Content"
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data["title"] == "Updated Title"
        assert data["content"] == "Updated Content"
    
    def test_update_nonexistent_document_returns_404(self, client):
        """PUT /api/v1/documents/:id should return 404 for non-existent document"""
        response = client.put("/api/v1/documents/nonexistent-id", json={
            "title": "New Title",
            "content": "New Content"
        })
        assert response.status_code == 404
    
    def test_update_document_requires_field(self, client):
        """PUT /api/v1/documents/:id should require at least one field to update"""
        # First create a document
        create_response = client.post("/api/v1/documents", json={
            "title": "Original Title",
            "content": "Original Content"
        })
        doc_id = create_response.get_json()["id"]
        
        # Try to update with empty body
        response = client.put(f"/api/v1/documents/{doc_id}", json={})
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
    
    def test_update_document_rejects_invalid_json(self, client):
        """PUT /api/v1/documents/:id should reject invalid JSON"""
        # First create a document
        create_response = client.post("/api/v1/documents", json={
            "title": "Original Title",
            "content": "Original Content"
        })
        doc_id = create_response.get_json()["id"]
        
        # Try to update with invalid JSON
        response = client.put(f"/api/v1/documents/{doc_id}", 
                              data="not valid json",
                              content_type="application/json")
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
    
    def test_delete_document(self, client):
        """DELETE /api/v1/documents/:id should delete the document"""
        # First create a document
        create_response = client.post("/api/v1/documents", json={
            "title": "To Be Deleted",
            "content": "Goodbye"
        })
        doc_id = create_response.get_json()["id"]
        
        # Delete it
        response = client.delete(f"/api/v1/documents/{doc_id}")
        assert response.status_code == 204
        
        # Verify it's gone
        get_response = client.get(f"/api/v1/documents/{doc_id}")
        assert get_response.status_code == 404
    
    def test_delete_nonexistent_document_returns_404(self, client):
        """DELETE /api/v1/documents/:id should return 404 for non-existent document"""
        response = client.delete("/api/v1/documents/nonexistent-id")
        assert response.status_code == 404


class TestInputValidation:
    """Tests for input validation and size limits"""

    def test_create_document_rejects_non_string_title(self, client):
        """POST /api/v1/documents should reject non-string title"""
        response = client.post("/api/v1/documents", json={
            "title": 12345,
            "content": "valid content"
        })
        assert response.status_code == 400

    def test_create_document_rejects_non_string_content(self, client):
        """POST /api/v1/documents should reject non-string content"""
        response = client.post("/api/v1/documents", json={
            "title": "valid title",
            "content": ["not", "a", "string"]
        })
        assert response.status_code == 400

    def test_create_document_rejects_oversized_title(self, client):
        """POST /api/v1/documents should reject titles exceeding max length"""
        response = client.post("/api/v1/documents", json={
            "title": "x" * 300,
            "content": "valid content"
        })
        assert response.status_code == 400

    def test_create_document_rejects_oversized_content(self, client):
        """POST /api/v1/documents should reject content exceeding max size"""
        response = client.post("/api/v1/documents", json={
            "title": "Test",
            "content": "x" * (1024 * 1024 + 1)
        })
        assert response.status_code == 413

    def test_document_count_limit(self, client):
        """POST /api/v1/documents should reject when max documents reached"""
        # Fill up to the limit
        with documents_lock:
            for i in range(MAX_DOCUMENTS):
                documents[f"doc-{i}"] = {
                    "id": f"doc-{i}",
                    "title": f"Doc {i}",
                    "content": "content"
                }

        response = client.post("/api/v1/documents", json={
            "title": "One Too Many",
            "content": "content"
        })
        assert response.status_code == 409

    def test_update_document_rejects_oversized_title(self, client):
        """PUT /api/v1/documents/:id should reject oversized titles"""
        create_resp = client.post("/api/v1/documents", json={
            "title": "Original",
            "content": "content"
        })
        doc_id = create_resp.get_json()["id"]

        response = client.put(f"/api/v1/documents/{doc_id}", json={
            "title": "x" * 300
        })
        assert response.status_code == 400

    def test_update_document_rejects_oversized_content(self, client):
        """PUT /api/v1/documents/:id should reject oversized content"""
        create_resp = client.post("/api/v1/documents", json={
            "title": "Original",
            "content": "content"
        })
        doc_id = create_resp.get_json()["id"]

        response = client.put(f"/api/v1/documents/{doc_id}", json={
            "content": "x" * (1024 * 1024 + 1)
        })
        assert response.status_code == 413

    def test_compile_rejects_oversized_latex(self, client):
        """POST /api/v1/compile should reject oversized LaTeX content"""
        response = client.post("/api/v1/compile", json={
            "latex": "x" * (1024 * 1024 + 1)
        })
        assert response.status_code == 413


class TestErrorHandlers:
    """Tests for custom error handlers"""

    def test_404_returns_json(self, client):
        """404 errors should return JSON"""
        response = client.get("/nonexistent")
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data
