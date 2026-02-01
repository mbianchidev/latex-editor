"""
LaTeX Editor Backend API
Provides health check and future API endpoints for LaTeX compilation
"""
import os
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Configuration
API_VERSION = "1.0.0"
DEBUG = os.environ.get("DEBUG", "false").lower() == "true"


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
            {"path": "/api/v1/compile", "method": "POST", "description": "Compile LaTeX (future)"}
        ]
    })


@app.route("/api/v1/compile", methods=["POST"])
def compile_latex():
    """
    Compile LaTeX endpoint (placeholder for future server-side compilation)
    Currently, compilation is handled client-side
    """
    data = request.get_json()
    
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
