"""
LaTeX Editor Backend API
Provides health check and future API endpoints for LaTeX compilation
"""
import os
import uuid
import threading
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Configuration
API_VERSION = "1.0.0"
DEBUG = os.environ.get("DEBUG", "false").lower() == "true"

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
def compile_latex():
    """
    Compile LaTeX endpoint (placeholder for future server-side compilation)
    Currently, compilation is handled client-side
    """
    data = request.get_json(silent=True)
    
    if not data or "latex" not in data:
        return jsonify({"error": "Missing 'latex' field in request body"}), 400
    
    latex_content = data.get("latex", "")
    
    # For now, return a placeholder response
    # Future: integrate with latexmk or pdflatex for server-side compilation
    return jsonify({
        "status": "success",
        "message": "Server-side compilation is planned for future releases. Currently using client-side compilation.",
        "input_length": len(latex_content)
    })


@app.route("/api/v1/documents", methods=["GET", "POST"])
def documents_endpoint():
    """
    List or create LaTeX documents
    """
    if request.method == "GET":
        with documents_lock:
            return jsonify({
                "documents": list(documents.values())
            })
    
    # POST - Create new document
    data = request.get_json(silent=True)
    
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400
    
    if "content" not in data:
        return jsonify({"error": "Missing 'content' field in request body"}), 400
    
    title = data.get("title", "Untitled")
    content = data["content"]
    
    doc_id = str(uuid.uuid4())
    with documents_lock:
        documents[doc_id] = {
            "id": doc_id,
            "title": title,
            "content": content
        }
        return jsonify(documents[doc_id]), 201


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


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=DEBUG)
