"""
Backend API Tests
"""
import os
import sqlite3
import tempfile
import pytest
import app as app_module
from app import app, documents, documents_lock, MAX_DOCUMENTS


@pytest.fixture
def client():
    """Create test client with temp database"""
    app.config["TESTING"] = True
    # Use a temp DB for tests
    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
        test_db = f.name
    
    original_db = app_module.DB_PATH
    app_module.DB_PATH = test_db
    app_module.init_db()
    
    with app.test_client() as client:
        with documents_lock:
            documents.clear()
        yield client
    
    app_module.DB_PATH = original_db
    os.unlink(test_db)


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


class TestSettingsEndpoint:
    """Tests for /api/v1/settings endpoint"""

    def test_settings_returns_200(self, client):
        response = client.get("/api/v1/settings")
        assert response.status_code == 200

    def test_settings_contains_storage_path(self, client):
        response = client.get("/api/v1/settings")
        data = response.get_json()
        assert "storage_path" in data
        assert isinstance(data["storage_path"], str)

    def test_settings_contains_db_size(self, client):
        response = client.get("/api/v1/settings")
        data = response.get_json()
        assert "db_size_bytes" in data
        assert isinstance(data["db_size_bytes"], int)
        assert data["db_size_bytes"] >= 0

    def test_settings_contains_limits(self, client):
        response = client.get("/api/v1/settings")
        data = response.get_json()
        assert "max_projects" in data
        assert "max_documents" in data
        assert "max_content_length" in data


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


class TestProjectsCRUD:
    """Tests for /api/v1/projects CRUD endpoints"""

    def test_list_projects_empty(self, client):
        """GET /api/v1/projects returns empty list initially"""
        response = client.get("/api/v1/projects")
        assert response.status_code == 200
        data = response.get_json()
        assert data["projects"] == []

    def test_create_project(self, client):
        """POST /api/v1/projects creates a project with files"""
        response = client.post("/api/v1/projects", json={
            "name": "My Resume",
            "main_file": "main.tex",
            "files": {
                "main.tex": "\\documentclass{article}\\begin{document}Hello\\end{document}",
                "cv/skills.tex": "\\cvskill{Cloud}{AWS}"
            }
        })
        assert response.status_code == 201
        data = response.get_json()
        assert data["name"] == "My Resume"
        assert data["main_file"] == "main.tex"
        assert data["file_count"] == 2
        assert "main.tex" in data["files"]

    def test_unique_project_name(self, client):
        """POST /api/v1/projects rejects duplicate names"""
        client.post("/api/v1/projects", json={
            "name": "UniqueTest",
            "files": {"main.tex": "hello"}
        })
        response = client.post("/api/v1/projects", json={
            "name": "UniqueTest",
            "files": {"main.tex": "hello"}
        })
        assert response.status_code == 409
        assert "already exists" in response.get_json()["error"]

    def test_get_project(self, client):
        """GET /api/v1/projects/:id returns project with files"""
        create = client.post("/api/v1/projects", json={
            "name": "GetTest",
            "files": {"main.tex": "content"}
        })
        pid = create.get_json()["id"]
        response = client.get(f"/api/v1/projects/{pid}")
        assert response.status_code == 200
        data = response.get_json()
        assert data["name"] == "GetTest"
        assert "files" in data

    def test_get_project_not_found(self, client):
        """GET /api/v1/projects/:id returns 404 for missing project"""
        response = client.get("/api/v1/projects/nonexistent")
        assert response.status_code == 404

    def test_update_project_files(self, client):
        """PUT /api/v1/projects/:id updates files"""
        create = client.post("/api/v1/projects", json={
            "name": "UpdateTest",
            "files": {"main.tex": "old content"}
        })
        pid = create.get_json()["id"]
        response = client.put(f"/api/v1/projects/{pid}", json={
            "files": {"main.tex": "new content", "extra.tex": "extra"}
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data["file_count"] == 2
        assert data["files"]["main.tex"] == "new content"

    def test_rename_project(self, client):
        """PUT /api/v1/projects/:id/name renames project"""
        create = client.post("/api/v1/projects", json={
            "name": "OldName",
            "files": {"main.tex": "content"}
        })
        pid = create.get_json()["id"]
        response = client.put(f"/api/v1/projects/{pid}/name", json={
            "name": "NewName"
        })
        assert response.status_code == 200
        assert response.get_json()["name"] == "NewName"

    def test_rename_project_duplicate(self, client):
        """PUT /api/v1/projects/:id/name rejects duplicate name"""
        client.post("/api/v1/projects", json={
            "name": "ProjectA",
            "files": {"main.tex": "a"}
        })
        create_b = client.post("/api/v1/projects", json={
            "name": "ProjectB",
            "files": {"main.tex": "b"}
        })
        pid_b = create_b.get_json()["id"]
        response = client.put(f"/api/v1/projects/{pid_b}/name", json={
            "name": "ProjectA"
        })
        assert response.status_code == 409

    def test_delete_project(self, client):
        """DELETE /api/v1/projects/:id removes project"""
        create = client.post("/api/v1/projects", json={
            "name": "DeleteMe",
            "files": {"main.tex": "content"}
        })
        pid = create.get_json()["id"]
        response = client.delete(f"/api/v1/projects/{pid}")
        assert response.status_code == 204
        # Verify it's gone
        get_resp = client.get(f"/api/v1/projects/{pid}")
        assert get_resp.status_code == 404

    def test_create_project_missing_name(self, client):
        """POST /api/v1/projects rejects missing name"""
        response = client.post("/api/v1/projects", json={
            "files": {"main.tex": "content"}
        })
        assert response.status_code == 400

    def test_create_project_binary_files(self, client):
        """POST /api/v1/projects handles binary files"""
        response = client.post("/api/v1/projects", json={
            "name": "BinaryTest",
            "files": {
                "main.tex": "content",
                "font.ttf": {"type": "binary", "content": "base64data=="}
            }
        })
        assert response.status_code == 201
        data = response.get_json()
        assert data["file_count"] == 2
        assert data["files"]["font.ttf"] == {
            "isBinary": True,
            "type": "binary",
            "content": "base64data=="
        }


class TestProjectGithubLink:
    """Tests for persisted GitHub folder synchronization metadata."""

    def test_create_project_with_github_link(self, client):
        github = {
            "repo": "mbianchidev/my-curriculum",
            "path": "resume",
            "branch": "main",
            "sha": "a" * 40,
            "manifest": {
                "resume.tex": {
                    "sha": "b" * 40,
                    "mode": "100644"
                }
            }
        }
        response = client.post("/api/v1/projects", json={
            "name": "Imported Resume",
            "main_file": "resume.tex",
            "files": {"resume.tex": "\\documentclass{article}"},
            "github": github
        })

        assert response.status_code == 201
        project = response.get_json()
        assert project["github"] == github

        get_response = client.get(f"/api/v1/projects/{project['id']}")
        assert get_response.get_json()["github"] == github

        list_response = client.get("/api/v1/projects")
        listed_github = list_response.get_json()["projects"][0]["github"]
        assert listed_github == {
            "repo": github["repo"],
            "path": github["path"],
            "branch": github["branch"],
            "sha": github["sha"]
        }

    def test_update_and_clear_project_github_link(self, client):
        create = client.post("/api/v1/projects", json={
            "name": "Link Later",
            "files": {"main.tex": "content"}
        })
        project_id = create.get_json()["id"]
        github = {
            "repo": "mbianchidev/my-curriculum",
            "path": "",
            "branch": "feature/resume",
            "sha": "c" * 40,
            "manifest": {}
        }

        update = client.put(f"/api/v1/projects/{project_id}", json={
            "github": github
        })
        assert update.status_code == 200
        assert update.get_json()["github"] == github

        clear = client.put(f"/api/v1/projects/{project_id}", json={
            "github": None
        })
        assert clear.status_code == 200
        assert clear.get_json()["github"] is None

    @pytest.mark.parametrize("github", [
        {
            "path": "resume",
            "branch": "main",
            "sha": "a" * 40,
            "manifest": {}
        },
        {
            "repo": "mbianchidev/my-curriculum",
            "path": "../resume",
            "branch": "main",
            "sha": "a" * 40,
            "manifest": {}
        },
        {
            "repo": "mbianchidev/my-curriculum",
            "path": "resume",
            "branch": "main",
            "sha": "not-a-sha",
            "manifest": {}
        },
        {
            "repo": "mbianchidev/my-curriculum",
            "path": "resume",
            "branch": "main",
            "sha": "a" * 40,
            "manifest": {
                "../outside.tex": {
                    "sha": "b" * 40,
                    "mode": "100644"
                }
            }
        }
    ])
    def test_rejects_invalid_github_link(self, client, github):
        response = client.post("/api/v1/projects", json={
            "name": "Invalid Link",
            "files": {"main.tex": "content"},
            "github": github
        })

        assert response.status_code == 400
        assert "error" in response.get_json()

    def test_init_db_migrates_existing_projects_table(self):
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as db_file:
            db_path = db_file.name

        conn = sqlite3.connect(db_path)
        conn.executescript("""
            CREATE TABLE projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                main_file TEXT NOT NULL DEFAULT 'main.tex',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE project_files (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                path TEXT NOT NULL,
                content TEXT NOT NULL DEFAULT '',
                is_binary INTEGER NOT NULL DEFAULT 0
            );
        """)
        conn.commit()
        conn.close()

        original_db = app_module.DB_PATH
        app_module.DB_PATH = db_path
        try:
            app_module.init_db()
            migrated = sqlite3.connect(db_path)
            columns = {
                row[1]
                for row in migrated.execute("PRAGMA table_info(projects)").fetchall()
            }
            migrated.close()
        finally:
            app_module.DB_PATH = original_db
            os.unlink(db_path)

        assert {
            "github_repo",
            "github_path",
            "github_branch",
            "github_sha",
            "github_manifest"
        }.issubset(columns)
