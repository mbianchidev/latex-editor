"""
LaTeX Editor Backend API
Provides health check and future API endpoints for LaTeX compilation
"""
import os
import uuid
import threading
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__)

# Trust proxy headers (nginx sits in front)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

# Restrict CORS to same-origin via nginx proxy only
ALLOWED_ORIGINS = os.environ.get(
    "CORS_ORIGINS", "http://localhost,http://localhost:80"
).split(",")
CORS(app, origins=ALLOWED_ORIGINS)

# Reject request bodies larger than 2 MB
app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024

# Configuration
API_VERSION = "1.0.0"
DEBUG = os.environ.get("DEBUG", "false").lower() == "true"
MAX_DOCUMENTS = int(os.environ.get("MAX_DOCUMENTS", "100"))
MAX_CONTENT_LENGTH = int(os.environ.get("MAX_DOC_CONTENT_LENGTH", str(1024 * 1024)))
MAX_TITLE_LENGTH = 256

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
            {"path": "/api/v1/compile", "method": "POST", "description": "Compile LaTeX (future)"},
            {"path": "/api/v1/documents", "method": "GET", "description": "List all documents"},
            {"path": "/api/v1/documents", "method": "POST", "description": "Create a document"},
            {"path": "/api/v1/documents/:id", "method": "GET", "description": "Get a document"},
            {"path": "/api/v1/documents/:id", "method": "PUT", "description": "Update a document"},
            {"path": "/api/v1/documents/:id", "method": "DELETE", "description": "Delete a document"}
        ]
    })


@app.route("/api/v1/compile", methods=["POST"])
@limiter.limit("30 per minute")
def compile_latex():
    """
    Compile LaTeX endpoint (placeholder for future server-side compilation)
    Currently, compilation is handled client-side
    """
    data = request.get_json(silent=True)
    
    if not data or "latex" not in data:
        return jsonify({"error": "Missing 'latex' field in request body"}), 400
    
    latex_content = data.get("latex", "")

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
