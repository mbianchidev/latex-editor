"""
LaTeX Editor Backend API
Provides health check, document storage, and project management with SQLite persistence
"""
import os
import uuid
import json
import sqlite3
import threading
from datetime import datetime, timezone
from flask import Flask, jsonify, request, g
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__)

# Trust proxy headers (nginx sits in front)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

# Restrict CORS to same-origin via nginx proxy only
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "CORS_ORIGINS", "http://localhost,http://localhost:80"
    ).split(",")
    if origin.strip()
]
CORS(app, origins=ALLOWED_ORIGINS)

# Reject request bodies larger than 10 MB (projects can include fonts/images)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

# Configuration
API_VERSION = "1.0.0"
DEBUG = os.environ.get("DEBUG", "false").lower() == "true"
MAX_DOCUMENTS = int(os.environ.get("MAX_DOCUMENTS", "100"))
MAX_CONTENT_LENGTH = int(os.environ.get("MAX_DOC_CONTENT_LENGTH", str(1024 * 1024)))
MAX_TITLE_LENGTH = 256
MAX_PROJECTS = int(os.environ.get("MAX_PROJECTS", "50"))
MAX_PROJECT_NAME_LENGTH = 128

# DB_PATH: use /data in Docker, environment variable, or OS-appropriate location
def _resolve_db_path():
    """Resolve the database path using OS-appropriate defaults."""
    # Explicit env var takes priority
    env_path = os.environ.get("DB_PATH")
    if env_path:
        return env_path
    # Docker volume
    if os.path.isdir("/data"):
        return "/data/projects.db"
    # OS-appropriate user data directory
    import sys
    if sys.platform == "darwin":
        base = os.path.expanduser("~/Library/Application Support/seclaw")
    elif sys.platform == "win32":
        base = os.path.join(os.environ.get("APPDATA", os.path.expanduser("~")), "seclaw")
    else:
        base = os.path.join(os.environ.get("XDG_CONFIG_HOME", os.path.expanduser("~/.config")), "seclaw")
    return os.path.join(base, "seclaw.db")

DB_PATH = _resolve_db_path()

# Rate limiter
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per minute"],
    storage_uri="memory://",
)

# In-memory document storage with thread-safe access
documents = {}
documents_lock = threading.Lock()


# ============================================
# SQLite Database
# ============================================

def get_db():
    """Get a database connection for the current request."""
    if 'db' not in g:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db


@app.teardown_appcontext
def close_db(exception):
    """Close database connection at end of request."""
    db = g.pop('db', None)
    if db is not None:
        db.close()


def init_db():
    """Initialize database schema."""
    db_dir = os.path.dirname(DB_PATH)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            main_file TEXT NOT NULL DEFAULT 'main.tex',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS project_files (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            path TEXT NOT NULL,
            content TEXT NOT NULL DEFAULT '',
            is_binary INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            UNIQUE(project_id, path)
        );
        CREATE INDEX IF NOT EXISTS idx_project_files_project ON project_files(project_id);
    """)
    conn.commit()
    conn.close()


# Initialize DB on startup
init_db()


def _utcnow():
    """Return current UTC time as ISO string."""
    return datetime.now(timezone.utc).isoformat()


def _project_to_dict(row, include_files=False, db=None):
    """Convert a project row to a dict."""
    d = {
        "id": row["id"],
        "name": row["name"],
        "main_file": row["main_file"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }
    if include_files and db:
        files_rows = db.execute(
            "SELECT path, content, is_binary FROM project_files WHERE project_id = ? ORDER BY path",
            (row["id"],)
        ).fetchall()
        files = {}
        for f in files_rows:
            if f["is_binary"]:
                files[f["path"]] = {"type": "binary", "content": f["content"]}
            else:
                files[f["path"]] = f["content"]
        d["files"] = files
        d["file_count"] = len(files)
    else:
        if db:
            count = db.execute(
                "SELECT COUNT(*) as cnt FROM project_files WHERE project_id = ?",
                (row["id"],)
            ).fetchone()["cnt"]
            d["file_count"] = count
    return d


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint for container orchestration"""
    return jsonify({
        "status": "healthy",
        "version": API_VERSION,
        "service": "latex-editor-api"
    })


@app.route("/api/v1/status", methods=["GET"])
def api_status():
    """API status endpoint"""
    return jsonify({
        "api_version": API_VERSION,
        "endpoints": [
            {"path": "/health", "method": "GET", "description": "Health check"},
            {"path": "/api/v1/status", "method": "GET", "description": "API status"},
            {"path": "/api/v1/settings", "method": "GET", "description": "Server settings"},
            {"path": "/api/v1/compile", "method": "POST", "description": "Compile LaTeX (future)"},
            {"path": "/api/v1/documents", "method": "GET", "description": "List all documents"},
            {"path": "/api/v1/documents", "method": "POST", "description": "Create a document"},
            {"path": "/api/v1/documents/:id", "method": "GET", "description": "Get a document"},
            {"path": "/api/v1/documents/:id", "method": "PUT", "description": "Update a document"},
            {"path": "/api/v1/documents/:id", "method": "DELETE", "description": "Delete a document"},
            {"path": "/api/v1/projects", "method": "GET", "description": "List all projects"},
            {"path": "/api/v1/projects", "method": "POST", "description": "Create a project"},
            {"path": "/api/v1/projects/:id", "method": "GET", "description": "Get a project with files"},
            {"path": "/api/v1/projects/:id", "method": "PUT", "description": "Update a project"},
            {"path": "/api/v1/projects/:id", "method": "DELETE", "description": "Delete a project"},
            {"path": "/api/v1/projects/:id/name", "method": "PUT", "description": "Rename a project"}
        ]
    })


@app.route("/api/v1/settings", methods=["GET"])
def get_settings():
    """Return server settings so the frontend can display storage info."""
    db_size = 0
    try:
        db_size = os.path.getsize(DB_PATH)
    except OSError:
        pass
    return jsonify({
        "storage_path": DB_PATH,
        "db_size_bytes": db_size,
        "max_projects": MAX_PROJECTS,
        "max_documents": MAX_DOCUMENTS,
        "max_content_length": MAX_CONTENT_LENGTH,
    })


@app.route("/api/v1/compile", methods=["POST"])
@limiter.limit("30 per minute")
def compile_latex():
    """
    Compile LaTeX endpoint (placeholder for future server-side compilation)
    Currently, compilation is handled client-side
    """
    data = request.get_json(silent=True)
    
    if not data or not isinstance(data, dict):
        return jsonify({"error": "Request body must be a JSON object"}), 400

    if "latex" not in data:
        return jsonify({"error": "Missing 'latex' field in request body"}), 400
    
    latex_content = data.get("latex", "")

    if not isinstance(latex_content, str):
        return jsonify({"error": "'latex' field must be a string"}), 400

    if len(latex_content) > MAX_CONTENT_LENGTH:
        return jsonify({"error": "LaTeX content exceeds maximum allowed size"}), 413
    
    # For now, return a placeholder response
    # Future: integrate with latexmk or pdflatex for server-side compilation
    return jsonify({
        "status": "success",
        "message": "Server-side compilation is planned for future releases. Currently using client-side compilation.",
        "input_length": len(latex_content)
    })


@app.route("/api/v1/documents", methods=["GET", "POST"])
@limiter.limit("60 per minute")
def documents_endpoint():
    """
    List or create LaTeX documents
    """
    if request.method == "GET":
        with documents_lock:
            docs_list = list(documents.values())
        return jsonify({"documents": docs_list})
    
    # POST - Create new document
    data = request.get_json(silent=True)
    
    if data is None:
        return jsonify({"error": "Request body must be valid JSON"}), 400
    
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be a JSON object"}), 400
    
    if not data:
        return jsonify({"error": "Request body cannot be empty"}), 400
    
    if "content" not in data:
        return jsonify({"error": "Missing 'content' field in request body"}), 400

    title = data.get("title", "Untitled")
    content = data["content"]

    if not isinstance(title, str) or not isinstance(content, str):
        return jsonify({"error": "'title' and 'content' must be strings"}), 400

    if len(title) > MAX_TITLE_LENGTH:
        return jsonify({"error": f"Title exceeds maximum length of {MAX_TITLE_LENGTH} characters"}), 400

    if len(content) > MAX_CONTENT_LENGTH:
        return jsonify({"error": "Content exceeds maximum allowed size"}), 413

    with documents_lock:
        if len(documents) >= MAX_DOCUMENTS:
            return jsonify({"error": f"Maximum document limit ({MAX_DOCUMENTS}) reached"}), 409

        doc_id = str(uuid.uuid4())
        documents[doc_id] = {
            "id": doc_id,
            "title": title,
            "content": content
        }
        doc = documents[doc_id].copy()
    return jsonify(doc), 201


@app.route("/api/v1/documents/<doc_id>", methods=["GET", "PUT", "DELETE"])
def document_operations(doc_id):
    """
    Operations on a specific document by ID
    """
    if request.method == "GET":
        with documents_lock:
            if doc_id not in documents:
                return jsonify({"error": "Document not found"}), 404
            doc = documents[doc_id].copy()
        return jsonify(doc)
    
    if request.method == "PUT":
        data = request.get_json(silent=True)
        if data is None:
            return jsonify({"error": "Request body must be JSON"}), 400
        
        if not isinstance(data, dict):
            return jsonify({"error": "Request body must be a JSON object"}), 400
        
        if "title" not in data and "content" not in data:
            return jsonify({"error": "At least one of 'title' or 'content' must be provided"}), 400

        if "title" in data:
            if not isinstance(data["title"], str) or len(data["title"]) > MAX_TITLE_LENGTH:
                return jsonify({"error": f"Title must be a string of at most {MAX_TITLE_LENGTH} characters"}), 400

        if "content" in data:
            if not isinstance(data["content"], str) or len(data["content"]) > MAX_CONTENT_LENGTH:
                return jsonify({"error": "Content exceeds maximum allowed size"}), 413
        
        with documents_lock:
            if doc_id not in documents:
                return jsonify({"error": "Document not found"}), 404
            if "title" in data:
                documents[doc_id]["title"] = data["title"]
            if "content" in data:
                documents[doc_id]["content"] = data["content"]
            doc = documents[doc_id].copy()
        return jsonify(doc)
    
    # DELETE - returns 204 No Content per REST conventions
    with documents_lock:
        if doc_id not in documents:
            return jsonify({"error": "Document not found"}), 404
        del documents[doc_id]
    return "", 204


# ============================================
# Project Management API (SQLite-backed)
# ============================================

@app.route("/api/v1/projects", methods=["GET"])
@limiter.limit("60 per minute")
def list_projects():
    """List all projects (without file contents)."""
    db = get_db()
    rows = db.execute(
        "SELECT * FROM projects ORDER BY updated_at DESC"
    ).fetchall()
    projects = [_project_to_dict(r, db=db) for r in rows]
    return jsonify({"projects": projects})


@app.route("/api/v1/projects", methods=["POST"])
@limiter.limit("30 per minute")
def create_project():
    """Create a new project with files."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Project name is required"}), 400
    if len(name) > MAX_PROJECT_NAME_LENGTH:
        return jsonify({"error": f"Name exceeds {MAX_PROJECT_NAME_LENGTH} characters"}), 400

    files = data.get("files", {})
    if not isinstance(files, dict):
        return jsonify({"error": "'files' must be an object mapping paths to contents"}), 400

    main_file = data.get("main_file", "main.tex")
    if not isinstance(main_file, str):
        return jsonify({"error": "'main_file' must be a string"}), 400

    db = get_db()

    # Check project count limit
    count = db.execute("SELECT COUNT(*) as cnt FROM projects").fetchone()["cnt"]
    if count >= MAX_PROJECTS:
        return jsonify({"error": f"Maximum project limit ({MAX_PROJECTS}) reached"}), 409

    # Check unique name
    existing = db.execute("SELECT id FROM projects WHERE name = ?", (name,)).fetchone()
    if existing:
        return jsonify({"error": f"A project named '{name}' already exists"}), 409

    project_id = str(uuid.uuid4())
    now = _utcnow()

    try:
        db.execute(
            "INSERT INTO projects (id, name, main_file, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (project_id, name, main_file, now, now)
        )

        for path, content in files.items():
            file_id = str(uuid.uuid4())
            is_binary = 0
            file_content = content

            if isinstance(content, dict) and content.get("type") == "binary":
                is_binary = 1
                file_content = content.get("content", "")
            elif not isinstance(content, str):
                file_content = str(content)

            db.execute(
                "INSERT INTO project_files (id, project_id, path, content, is_binary) VALUES (?, ?, ?, ?, ?)",
                (file_id, project_id, path, file_content, is_binary)
            )

        db.commit()
    except sqlite3.IntegrityError as e:
        db.rollback()
        app.logger.error("Database constraint violation: %s", e)
        return jsonify({"error": "Database constraint violation"}), 409
    except Exception as e:
        db.rollback()
        app.logger.error("Failed to create project: %s", e)
        return jsonify({"error": "Failed to create project"}), 500

    row = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    return jsonify(_project_to_dict(row, include_files=True, db=db)), 201


@app.route("/api/v1/projects/<project_id>", methods=["GET"])
@limiter.limit("60 per minute")
def get_project(project_id):
    """Get a project with all its files."""
    db = get_db()
    row = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not row:
        return jsonify({"error": "Project not found"}), 404
    return jsonify(_project_to_dict(row, include_files=True, db=db))


@app.route("/api/v1/projects/<project_id>", methods=["PUT"])
@limiter.limit("30 per minute")
def update_project(project_id):
    """Update a project (files, main_file)."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    db = get_db()
    row = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not row:
        return jsonify({"error": "Project not found"}), 404

    now = _utcnow()

    try:
        if "main_file" in data:
            db.execute("UPDATE projects SET main_file = ?, updated_at = ? WHERE id = ?",
                       (data["main_file"], now, project_id))

        if "name" in data:
            new_name = data["name"].strip()
            if not new_name:
                return jsonify({"error": "Project name cannot be empty"}), 400
            if len(new_name) > MAX_PROJECT_NAME_LENGTH:
                return jsonify({"error": f"Name exceeds {MAX_PROJECT_NAME_LENGTH} characters"}), 400
            dup = db.execute("SELECT id FROM projects WHERE name = ? AND id != ?",
                             (new_name, project_id)).fetchone()
            if dup:
                return jsonify({"error": f"A project named '{new_name}' already exists"}), 409
            db.execute("UPDATE projects SET name = ?, updated_at = ? WHERE id = ?",
                       (new_name, now, project_id))

        if "files" in data and isinstance(data["files"], dict):
            # Replace all files
            db.execute("DELETE FROM project_files WHERE project_id = ?", (project_id,))
            for path, content in data["files"].items():
                file_id = str(uuid.uuid4())
                is_binary = 0
                file_content = content
                if isinstance(content, dict) and content.get("type") == "binary":
                    is_binary = 1
                    file_content = content.get("content", "")
                elif not isinstance(content, str):
                    file_content = str(content)
                db.execute(
                    "INSERT INTO project_files (id, project_id, path, content, is_binary) VALUES (?, ?, ?, ?, ?)",
                    (file_id, project_id, path, file_content, is_binary)
                )

            db.execute("UPDATE projects SET updated_at = ? WHERE id = ?", (now, project_id))

        db.commit()
    except sqlite3.IntegrityError as e:
        db.rollback()
        app.logger.error("Database constraint violation: %s", e)
        return jsonify({"error": "Database constraint violation"}), 409
    except Exception as e:
        db.rollback()
        app.logger.error("Failed to update project: %s", e)
        return jsonify({"error": "Failed to update project"}), 500

    row = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    return jsonify(_project_to_dict(row, include_files=True, db=db))


@app.route("/api/v1/projects/<project_id>", methods=["DELETE"])
@limiter.limit("30 per minute")
def delete_project(project_id):
    """Delete a project and all its files."""
    db = get_db()
    row = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not row:
        return jsonify({"error": "Project not found"}), 404
    db.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    db.commit()
    return "", 204


@app.route("/api/v1/projects/<project_id>/name", methods=["PUT"])
@limiter.limit("30 per minute")
def rename_project(project_id):
    """Rename a project."""
    data = request.get_json(silent=True)
    if not data or "name" not in data:
        return jsonify({"error": "Missing 'name' field"}), 400

    new_name = data["name"].strip()
    if not new_name:
        return jsonify({"error": "Project name cannot be empty"}), 400
    if len(new_name) > MAX_PROJECT_NAME_LENGTH:
        return jsonify({"error": f"Name exceeds {MAX_PROJECT_NAME_LENGTH} characters"}), 400

    db = get_db()
    row = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not row:
        return jsonify({"error": "Project not found"}), 404

    dup = db.execute("SELECT id FROM projects WHERE name = ? AND id != ?",
                     (new_name, project_id)).fetchone()
    if dup:
        return jsonify({"error": f"A project named '{new_name}' already exists"}), 409

    now = _utcnow()
    db.execute("UPDATE projects SET name = ?, updated_at = ? WHERE id = ?",
               (new_name, now, project_id))
    db.commit()

    row = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    return jsonify(_project_to_dict(row, db=db))


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle 413 errors - payload too large"""
    return jsonify({"error": "Request body too large"}), 413


@app.errorhandler(429)
def rate_limit_exceeded(error):
    """Handle 429 errors - rate limit exceeded"""
    return jsonify({"error": "Rate limit exceeded. Please try again later."}), 429


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=DEBUG)
