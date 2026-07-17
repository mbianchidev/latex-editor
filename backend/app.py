"""
LaTeX Editor Backend API
Provides health check, document storage, and project management with SQLite persistence
"""
import base64
import binascii
import io
import os
import json
import re
import shutil
import signal
import sqlite3
import subprocess
import tempfile
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, request, g
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from cryptography.fernet import Fernet, InvalidToken
from pypdf import PdfReader
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

# Configuration
API_VERSION = "1.1.0"
DEBUG = os.environ.get("DEBUG", "false").lower() == "true"
MAX_DOCUMENTS = int(os.environ.get("MAX_DOCUMENTS", "100"))
MAX_CONTENT_LENGTH = int(os.environ.get("MAX_DOC_CONTENT_LENGTH", str(1024 * 1024)))
MAX_TITLE_LENGTH = 256
MAX_PROJECTS = int(os.environ.get("MAX_PROJECTS", "50"))
MAX_PROJECT_NAME_LENGTH = 128
MAX_REQUEST_BYTES = int(os.environ.get("MAX_REQUEST_BYTES", str(35 * 1024 * 1024)))
MAX_COMPILE_BYTES = int(os.environ.get("MAX_COMPILE_BYTES", str(25 * 1024 * 1024)))
MAX_COMPILE_FILES = int(os.environ.get("MAX_COMPILE_FILES", "1000"))
MAX_COMPILED_PDF_BYTES = int(
    os.environ.get("MAX_COMPILED_PDF_BYTES", str(50 * 1024 * 1024))
)
COMPILE_TIMEOUT_SECONDS = int(os.environ.get("COMPILE_TIMEOUT_SECONDS", "60"))
COMPILE_MEMORY_BYTES = int(
    os.environ.get("COMPILE_MEMORY_BYTES", str(1536 * 1024 * 1024))
)
COMPILE_LOG_LIMIT = 12000
DEFAULT_LATEX_ENGINE = "xelatex"
GITHUB_API_BASE = "https://api.github.com"
GITHUB_TOKEN_ENCRYPTION_KEY = os.environ.get("GITHUB_TOKEN_ENCRYPTION_KEY")
GITHUB_TOKEN_KEY_PATH = os.environ.get("GITHUB_TOKEN_KEY_PATH")
MAX_GITHUB_TOKEN_LENGTH = 1024
GITHUB_API_TIMEOUT_SECONDS = 30
LATEX_ENGINES = {
    "pdflatex": {
        "mode": "-pdflatex",
        "command": "-pdflatex=pdflatex -no-shell-escape %O %S",
    },
    "xelatex": {
        "mode": "-xelatex",
        "command": "-xelatex=xelatex -no-shell-escape %O %S",
    },
    "lualatex": {
        "mode": "-lualatex",
        "command": "-lualatex=lualatex -no-shell-escape %O %S",
    },
}

# Projects can contain embedded fonts and images, whose Base64 JSON representation is larger.
app.config["MAX_CONTENT_LENGTH"] = MAX_REQUEST_BYTES

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
github_token_key_lock = threading.Lock()


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
            engine TEXT NOT NULL DEFAULT 'xelatex',
            github_repo TEXT,
            github_path TEXT,
            github_branch TEXT,
            github_sha TEXT,
            github_manifest TEXT,
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
        CREATE TABLE IF NOT EXISTS app_secrets (
            key TEXT PRIMARY KEY,
            encrypted_value TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
    """)

    existing_columns = {
        row[1] for row in conn.execute("PRAGMA table_info(projects)").fetchall()
    }
    if "engine" not in existing_columns:
        conn.execute(
            "ALTER TABLE projects ADD COLUMN engine TEXT NOT NULL DEFAULT 'xelatex'"
        )

    github_columns = {
        "github_repo": "TEXT",
        "github_path": "TEXT",
        "github_branch": "TEXT",
        "github_sha": "TEXT",
        "github_manifest": "TEXT",
    }
    for column, column_type in github_columns.items():
        if column not in existing_columns:
            conn.execute(f"ALTER TABLE projects ADD COLUMN {column} {column_type}")

    conn.commit()
    conn.close()


# Initialize DB on startup
init_db()


def _utcnow():
    """Return current UTC time as ISO string."""
    return datetime.now(timezone.utc).isoformat()


class GithubTokenKeyError(Exception):
    """Raised when the GitHub PAT encryption key is unavailable or invalid."""


class GithubApiUnavailable(Exception):
    """Raised when GitHub cannot be reached safely."""


class _NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Keep Authorization headers from being forwarded across redirects."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def _github_token_key_source():
    return "environment" if GITHUB_TOKEN_ENCRYPTION_KEY else "generated-file"


def _github_token_key_path():
    if GITHUB_TOKEN_KEY_PATH:
        return Path(GITHUB_TOKEN_KEY_PATH).expanduser()
    return Path(DB_PATH).with_suffix(".github-token.key")


def _validate_fernet_key(key):
    try:
        Fernet(key)
    except (TypeError, ValueError) as error:
        raise GithubTokenKeyError("GitHub token encryption key is invalid") from error
    return key


def _read_github_token_key(path):
    try:
        key = path.read_bytes().strip()
    except OSError as error:
        raise GithubTokenKeyError("GitHub token encryption key cannot be read") from error
    _validate_fernet_key(key)
    try:
        path.chmod(0o600)
    except OSError as error:
        raise GithubTokenKeyError(
            "GitHub token encryption key permissions cannot be secured"
        ) from error
    return key


def _create_github_token_key(path):
    path.parent.mkdir(parents=True, exist_ok=True)
    key = Fernet.generate_key()
    file_descriptor, temp_name = tempfile.mkstemp(
        prefix=f".{path.name}.",
        dir=path.parent,
    )
    temp_path = Path(temp_name)
    try:
        with os.fdopen(file_descriptor, "wb") as key_file:
            os.fchmod(key_file.fileno(), 0o600)
            key_file.write(key)
            key_file.flush()
            os.fsync(key_file.fileno())
        try:
            os.link(temp_path, path)
        except FileExistsError:
            pass
        try:
            directory_fd = os.open(path.parent, os.O_RDONLY)
        except OSError:
            directory_fd = None
        if directory_fd is not None:
            try:
                os.fsync(directory_fd)
            finally:
                os.close(directory_fd)
    finally:
        try:
            temp_path.unlink()
        except FileNotFoundError:
            pass


def _github_token_cipher():
    if GITHUB_TOKEN_ENCRYPTION_KEY:
        try:
            key = GITHUB_TOKEN_ENCRYPTION_KEY.encode("ascii")
        except UnicodeEncodeError as error:
            raise GithubTokenKeyError(
                "GitHub token encryption key is invalid"
            ) from error
        return Fernet(_validate_fernet_key(key))

    key_path = _github_token_key_path()
    with github_token_key_lock:
        if not key_path.exists():
            try:
                _create_github_token_key(key_path)
            except OSError as error:
                raise GithubTokenKeyError(
                    "GitHub token encryption key cannot be created"
                ) from error
        return Fernet(_read_github_token_key(key_path))


def _validate_github_token(token):
    if not isinstance(token, str):
        raise ValueError("GitHub PAT must be a string")
    if (
        len(token) < 20
        or len(token) > MAX_GITHUB_TOKEN_LENGTH
        or token != token.strip()
        or any(ord(char) < 33 or ord(char) == 127 for char in token)
    ):
        raise ValueError("GitHub PAT format is invalid")
    return token


def _stored_github_token(db):
    row = db.execute(
        "SELECT encrypted_value FROM app_secrets WHERE key = ?",
        ("github_pat",),
    ).fetchone()
    if not row:
        return None, False

    try:
        token = _github_token_cipher().decrypt(
            row["encrypted_value"].encode("ascii")
        ).decode("utf-8")
        return _validate_github_token(token), False
    except (InvalidToken, UnicodeError, ValueError):
        app.logger.warning(
            "Stored GitHub PAT cannot be decrypted; reconnect GitHub to replace it"
        )
        return None, True


def _store_github_token(db, token):
    encrypted = _github_token_cipher().encrypt(token.encode("utf-8")).decode("ascii")
    db.execute(
        """
        INSERT INTO app_secrets (key, encrypted_value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
            encrypted_value = excluded.encrypted_value,
            updated_at = excluded.updated_at
        """,
        ("github_pat", encrypted, _utcnow()),
    )
    db.commit()


def _delete_github_token(db):
    db.execute("DELETE FROM app_secrets WHERE key = ?", ("github_pat",))
    db.commit()


def _validate_github_proxy_request(data):
    if not isinstance(data, dict):
        raise ValueError("Request body must be a JSON object")

    path = data.get("path")
    method = data.get("method", "GET")
    body = data.get("body")
    if not isinstance(path, str) or len(path) > 2048:
        raise ValueError("GitHub API path is invalid")
    if not isinstance(method, str):
        raise ValueError("GitHub API method is invalid")
    method = method.upper()
    if method not in {"GET", "POST", "PATCH"}:
        raise ValueError("GitHub API method is not allowed")

    parsed = urllib.parse.urlsplit(path)
    decoded_path = urllib.parse.unquote(parsed.path)
    if (
        parsed.scheme
        or parsed.netloc
        or not parsed.path.startswith("/")
        or any(segment in {".", ".."} for segment in decoded_path.split("/"))
        or any(ord(char) < 32 or ord(char) == 127 for char in path)
    ):
        raise ValueError("GitHub API path is invalid")
    if parsed.query and parsed.query != "recursive=1":
        raise ValueError("GitHub API query is not allowed")

    if parsed.path == "/user":
        if method != "GET":
            raise ValueError("GitHub API method is not allowed")
        return path, method, None

    match = re.match(
        r"^/repos/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(?P<suffix>.*)$",
        parsed.path,
    )
    if not match:
        raise ValueError("GitHub API path is not allowed")
    suffix = match.group("suffix")

    allowed = False
    if method == "GET":
        allowed = (
            suffix == ""
            or re.fullmatch(r"/git/ref/heads/.+", suffix) is not None
            or re.fullmatch(r"/git/commits/[0-9a-fA-F]{40}", suffix) is not None
            or re.fullmatch(r"/git/trees/[0-9a-fA-F]{40}", suffix) is not None
            or re.fullmatch(r"/git/blobs/[0-9a-fA-F]{40}", suffix) is not None
        )
    elif method == "POST":
        allowed = suffix in {"/git/blobs", "/git/trees", "/git/commits"}
    elif method == "PATCH":
        allowed = re.fullmatch(r"/git/refs/heads/.+", suffix) is not None
    if not allowed:
        raise ValueError("GitHub API path is not allowed")
    if method == "GET" and body is not None:
        raise ValueError("GitHub GET requests cannot contain a body")
    if method != "GET" and not isinstance(body, (dict, list)):
        raise ValueError("GitHub API body must be JSON")
    return path, method, body


def _github_http_request(token, path, method="GET", body=None):
    data = None if body is None else json.dumps(body).encode("utf-8")
    request_headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "User-Agent": "latex-editor",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if data is not None:
        request_headers["Content-Type"] = "application/json"

    github_request = urllib.request.Request(
        f"{GITHUB_API_BASE}{path}",
        data=data,
        headers=request_headers,
        method=method,
    )
    opener = urllib.request.build_opener(_NoRedirectHandler())
    try:
        with opener.open(
            github_request,
            timeout=GITHUB_API_TIMEOUT_SECONDS,
        ) as response:
            return response.status, response.read(), dict(response.headers)
    except urllib.error.HTTPError as error:
        return error.code, error.read(), dict(error.headers)
    except (urllib.error.URLError, TimeoutError) as error:
        raise GithubApiUnavailable("GitHub API request failed") from error


GITHUB_REPO_PATTERN = re.compile(
    r"^[A-Za-z0-9](?:[A-Za-z0-9_.-]{0,38})/"
    r"[A-Za-z0-9_.-]{1,100}$"
)
GITHUB_SHA_PATTERN = re.compile(r"^[0-9a-fA-F]{40}$")
GITHUB_FILE_MODES = {"100644", "100755", "120000"}
GITHUB_BRANCH_FORBIDDEN = re.compile(r"[\x00-\x20\x7f~^:?*\[\\]")
COMPILE_REQUEST_DETAILS = {
    "invalid_body": "The request body must be a non-empty JSON object.",
    "invalid_files": "'files' must map project paths to file contents.",
    "invalid_latex": "'latex' must be a string.",
    "missing_source": "Provide either a 'files' project or a 'latex' source string.",
    "invalid_path": "Project file paths must be safe normalized relative paths.",
    "unsupported_engine": "Choose pdflatex, xelatex, or lualatex.",
    "empty_project": "At least one project file is required.",
    "too_many_files": f"Projects may contain at most {MAX_COMPILE_FILES} files.",
    "duplicate_path": "Project file paths must be unique.",
    "invalid_binary": "Binary project files must contain valid Base64 text.",
    "unsupported_content": "Project files must contain text or Base64 binary content.",
    "missing_main": "The selected main file is not present in the project.",
    "invalid_main_extension": "The selected main file must use the .tex extension.",
    "binary_main": "The selected main file must be a text file.",
    "path_conflict": "A project path conflicts with another file or directory.",
}


class CompileRequestError(ValueError):
    """Raised for client-correctable compile request validation failures."""

    def __init__(self, code):
        super().__init__(code)
        self.code = code


def _validate_relative_path(path, allow_empty=False):
    """Validate a repository-relative path without changing its meaning."""
    if not isinstance(path, str):
        raise ValueError("GitHub paths must be strings")
    if path == "" and allow_empty:
        return ""
    if not path or path.startswith("/") or path.endswith("/") or "\\" in path:
        raise ValueError("GitHub paths must be relative and normalized")
    if len(path) > 1024:
        raise ValueError("GitHub path exceeds 1024 characters")

    segments = path.split("/")
    if any(
        not segment
        or segment in {".", ".."}
        or any(ord(char) < 32 or ord(char) == 127 for char in segment)
        for segment in segments
    ):
        raise ValueError("GitHub path contains an unsafe segment")
    return path


def _validate_compile_path(path):
    """Validate a normalized POSIX path inside an isolated compile directory."""
    if not isinstance(path, str):
        raise CompileRequestError("invalid_path")
    if (
        not path
        or len(path) > 1024
        or path.startswith("/")
        or path.endswith("/")
        or "\\" in path
    ):
        raise CompileRequestError("invalid_path")

    segments = path.split("/")
    if any(
        not segment
        or segment in {".", ".."}
        or any(ord(char) < 32 or ord(char) == 127 for char in segment)
        for segment in segments
    ):
        raise CompileRequestError("invalid_path")
    return path


def _validate_latex_engine(engine):
    """Return a supported LaTeX engine name."""
    if engine is None:
        return DEFAULT_LATEX_ENGINE
    if not isinstance(engine, str):
        raise ValueError("LaTeX engine must be a string")
    engine = engine.strip().lower()
    if engine not in LATEX_ENGINES:
        supported = ", ".join(LATEX_ENGINES)
        raise ValueError(f"Unsupported LaTeX engine. Choose one of: {supported}")
    return engine


def _pdf_download_name(main_file):
    """Return a conservative ASCII filename for the compiled PDF header."""
    stem = re.sub(r"[^A-Za-z0-9._-]+", "-", Path(main_file).stem)
    stem = stem.strip("._-")[:100] or "document"
    return f"{stem}.pdf"


def _validate_github_branch(branch):
    """Validate the subset of Git reference rules needed for branch names."""
    if not isinstance(branch, str):
        raise ValueError("GitHub branch must be a string")
    branch = branch.strip()
    if (
        not branch
        or len(branch) > 255
        or branch.startswith("/")
        or branch.endswith("/")
        or branch.endswith(".")
        or branch.endswith(".lock")
        or ".." in branch
        or "//" in branch
        or "@{" in branch
        or GITHUB_BRANCH_FORBIDDEN.search(branch)
    ):
        raise ValueError("GitHub branch is invalid")
    return branch


def _validate_github_link(value):
    """Validate and normalize the all-or-none GitHub project link."""
    if value is None:
        return None
    if not isinstance(value, dict):
        raise ValueError("'github' must be an object or null")

    required = {"repo", "path", "branch", "sha", "manifest"}
    if not required.issubset(value):
        raise ValueError(
            "'github' requires repo, path, branch, sha, and manifest"
        )

    repo = value["repo"]
    if not isinstance(repo, str) or not GITHUB_REPO_PATTERN.fullmatch(repo.strip()):
        raise ValueError("GitHub repository must use the owner/repo format")
    repo = repo.strip()

    path = _validate_relative_path(value["path"], allow_empty=True)
    branch = _validate_github_branch(value["branch"])

    sha = value["sha"]
    if not isinstance(sha, str) or not GITHUB_SHA_PATTERN.fullmatch(sha):
        raise ValueError("GitHub commit SHA must be a 40-character hexadecimal value")
    sha = sha.lower()

    manifest = value["manifest"]
    if not isinstance(manifest, dict):
        raise ValueError("GitHub manifest must be an object")
    if len(manifest) > 1000:
        raise ValueError("GitHub manifest exceeds 1000 files")

    normalized_manifest = {}
    for file_path, entry in manifest.items():
        safe_path = _validate_relative_path(file_path)
        if not isinstance(entry, dict):
            raise ValueError("GitHub manifest entries must be objects")
        file_sha = entry.get("sha")
        mode = entry.get("mode")
        if not isinstance(file_sha, str) or not GITHUB_SHA_PATTERN.fullmatch(file_sha):
            raise ValueError("GitHub manifest contains an invalid blob SHA")
        if mode not in GITHUB_FILE_MODES:
            raise ValueError("GitHub manifest contains an unsupported file mode")
        normalized_manifest[safe_path] = {
            "sha": file_sha.lower(),
            "mode": mode,
        }

    return {
        "repo": repo,
        "path": path,
        "branch": branch,
        "sha": sha,
        "manifest": normalized_manifest,
    }


def _github_db_values(github):
    """Convert a validated GitHub link to project column values."""
    if github is None:
        return None, None, None, None, None
    return (
        github["repo"],
        github["path"],
        github["branch"],
        github["sha"],
        json.dumps(github["manifest"], separators=(",", ":"), sort_keys=True),
    )


def _github_from_row(row, include_manifest=True):
    """Convert persisted GitHub columns to the public API shape."""
    if not row["github_repo"]:
        return None
    github = {
        "repo": row["github_repo"],
        "path": row["github_path"] or "",
        "branch": row["github_branch"],
        "sha": row["github_sha"],
    }
    if include_manifest:
        github["manifest"] = json.loads(row["github_manifest"] or "{}")
    return github


def _project_to_dict(row, include_files=False, db=None):
    """Convert a project row to a dict."""
    d = {
        "id": row["id"],
        "name": row["name"],
        "main_file": row["main_file"],
        "engine": row["engine"],
        "github": _github_from_row(row, include_manifest=include_files),
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
                files[f["path"]] = {
                    "isBinary": True,
                    "type": "binary",
                    "content": f["content"],
                }
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


class LatexCompilerUnavailable(Exception):
    """Raised when the configured TeX toolchain is not installed."""


class LatexCompilationFailed(Exception):
    """Raised when latexmk reports a document error."""

    def __init__(self, log):
        super().__init__("LaTeX compilation failed")
        self.log = log


class LatexCompilationTimedOut(Exception):
    """Raised when a compile exceeds the configured wall-clock limit."""


def _normalize_compile_request(data):
    """Validate a compile payload and return decoded project files."""
    if not isinstance(data, dict) or not data:
        raise CompileRequestError("invalid_body")

    if "files" in data:
        files = data["files"]
        if not isinstance(files, dict):
            raise CompileRequestError("invalid_files")
        main_file = data.get("main_file", "main.tex")
    elif "latex" in data:
        latex = data["latex"]
        if not isinstance(latex, str):
            raise CompileRequestError("invalid_latex")
        main_file = data.get("main_file", "document.tex")
        files = {main_file: latex}
    else:
        raise CompileRequestError("missing_source")

    main_file = _validate_compile_path(main_file)
    try:
        engine = _validate_latex_engine(data.get("engine"))
    except ValueError as error:
        raise CompileRequestError("unsupported_engine") from error
    if not files:
        raise CompileRequestError("empty_project")
    if len(files) > MAX_COMPILE_FILES:
        raise CompileRequestError("too_many_files")

    decoded_files = {}
    total_bytes = 0
    for raw_path, value in files.items():
        path = _validate_compile_path(raw_path)
        if path in decoded_files:
            raise CompileRequestError("duplicate_path")

        if isinstance(value, str):
            content = value.encode("utf-8")
        elif isinstance(value, dict) and (
            value.get("isBinary") is True or value.get("type") == "binary"
        ):
            encoded = value.get("content", "")
            if not isinstance(encoded, str):
                raise CompileRequestError("invalid_binary")
            try:
                content = base64.b64decode(
                    "".join(encoded.split()),
                    validate=True,
                )
            except (binascii.Error, ValueError) as error:
                raise CompileRequestError("invalid_binary") from error
        else:
            raise CompileRequestError("unsupported_content")

        total_bytes += len(content)
        if total_bytes > MAX_COMPILE_BYTES:
            raise OverflowError(
                f"Project exceeds the {MAX_COMPILE_BYTES}-byte compile limit"
            )
        decoded_files[path] = content

    if main_file not in decoded_files:
        raise CompileRequestError("missing_main")
    if not main_file.lower().endswith(".tex"):
        raise CompileRequestError("invalid_main_extension")
    if not isinstance(files[main_file], str):
        raise CompileRequestError("binary_main")
    return decoded_files, main_file, engine


def _write_compile_files(root, files):
    """Write validated project files into an empty compile directory."""
    for path, content in files.items():
        destination = root.joinpath(*path.split("/"))
        for parent in destination.parents:
            if parent == root:
                break
            if parent.exists() and not parent.is_dir():
                raise CompileRequestError("path_conflict")
        destination.parent.mkdir(parents=True, exist_ok=True)
        if destination.exists() and destination.is_dir():
            raise CompileRequestError("path_conflict")
        destination.write_bytes(content)


def _build_latexmk_command(engine, main_filename):
    """Build a latexmk invocation with project configuration disabled."""
    latexmk = shutil.which("latexmk")
    if not latexmk:
        raise LatexCompilerUnavailable("latexmk is not installed")

    engine_config = LATEX_ENGINES[engine]
    command = [
        latexmk,
        "-norc",
        engine_config["mode"],
        engine_config["command"],
        "-interaction=nonstopmode",
        "-halt-on-error",
        "-file-line-error",
        "-synctex=0",
        main_filename,
    ]

    prlimit = shutil.which("prlimit")
    if prlimit:
        command = [
            prlimit,
            f"--as={COMPILE_MEMORY_BYTES}",
            f"--cpu={COMPILE_TIMEOUT_SECONDS + 5}",
            "--nofile=256",
            "--",
            *command,
        ]
    return command


def _sanitize_compile_log(log, compile_root):
    """Remove temporary paths and bound compiler output returned to clients."""
    sanitized = log.replace(str(compile_root), ".")
    if len(sanitized) > COMPILE_LOG_LIMIT:
        sanitized = sanitized[-COMPILE_LOG_LIMIT:]
        sanitized = f"[earlier compiler output omitted]\n{sanitized}"
    return sanitized


def _compile_error_entries(log):
    """Extract useful file and line diagnostics from latexmk output."""
    entries = []
    seen = set()
    for line in log.splitlines():
        match = re.match(r"^(?:\./)?(.+?\.tex):(\d+):\s*(.+)$", line)
        if match:
            key = match.groups()
            if key not in seen:
                entries.append({
                    "file": match.group(1),
                    "line": int(match.group(2)),
                    "message": match.group(3).strip(),
                })
                seen.add(key)
        elif line.startswith("! "):
            message = line[2:].strip()
            key = ("", 0, message)
            if message and key not in seen:
                entries.append({"file": "", "line": "?", "message": message})
                seen.add(key)
        if len(entries) >= 20:
            break
    return entries


def _terminate_process_group(process):
    """Stop latexmk and any TeX child processes."""
    if process.poll() is not None:
        return
    try:
        os.killpg(process.pid, signal.SIGKILL)
    except ProcessLookupError:
        return


def _compile_latex_project(files, main_file, engine):
    """Compile an isolated project and return PDF bytes, pages, duration, and log."""
    started_at = time.monotonic()
    with tempfile.TemporaryDirectory(prefix="latex-editor-") as temp_dir:
        compile_root = Path(temp_dir)
        _write_compile_files(compile_root, files)

        main_path = compile_root.joinpath(*main_file.split("/"))
        work_dir = main_path.parent
        home_dir = compile_root / ".home"
        cache_dir = compile_root / ".cache"
        home_dir.mkdir()
        cache_dir.mkdir()

        command = _build_latexmk_command(engine, main_path.name)
        environment = os.environ.copy()
        environment.update({
            "HOME": str(home_dir),
            "XDG_CACHE_HOME": str(cache_dir),
            "openin_any": "p",
            "openout_any": "p",
            "shell_escape": "f",
        })

        try:
            process = subprocess.Popen(
                command,
                cwd=work_dir,
                env=environment,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding="utf-8",
                errors="replace",
                start_new_session=True,
            )
        except OSError as error:
            raise LatexCompilerUnavailable(
                f"Could not start the LaTeX compiler: {error}"
            ) from error

        try:
            output, _ = process.communicate(timeout=COMPILE_TIMEOUT_SECONDS)
        except subprocess.TimeoutExpired as error:
            _terminate_process_group(process)
            output, _ = process.communicate()
            app.logger.warning(
                "LaTeX compilation timed out after %ss", COMPILE_TIMEOUT_SECONDS
            )
            raise LatexCompilationTimedOut() from error

        log = _sanitize_compile_log(output or "", compile_root)
        if process.returncode != 0:
            raise LatexCompilationFailed(log)

        pdf_path = main_path.with_suffix(".pdf")
        if not pdf_path.is_file():
            raise LatexCompilationFailed(
                f"{log}\nThe compiler completed without producing a PDF."
            )
        if pdf_path.stat().st_size > MAX_COMPILED_PDF_BYTES:
            raise LatexCompilationFailed(
                f"{log}\nThe compiled PDF exceeds the configured size limit."
            )

        pdf_bytes = pdf_path.read_bytes()
        try:
            page_count = len(PdfReader(io.BytesIO(pdf_bytes), strict=False).pages)
        except Exception as error:
            app.logger.error("Compiler produced an unreadable PDF: %s", error)
            raise LatexCompilationFailed(
                f"{log}\nThe compiler produced an unreadable PDF."
            ) from error

        elapsed_ms = round((time.monotonic() - started_at) * 1000)
        return pdf_bytes, page_count, elapsed_ms, log


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
            {"path": "/api/v1/compile", "method": "POST", "description": "Compile a LaTeX project to PDF"},
            {"path": "/api/v1/github-token", "method": "GET", "description": "GitHub PAT status"},
            {"path": "/api/v1/github-token", "method": "PUT", "description": "Validate and store GitHub PAT"},
            {"path": "/api/v1/github-token", "method": "DELETE", "description": "Delete stored GitHub PAT"},
            {"path": "/api/v1/github", "method": "POST", "description": "Proxy an allowed GitHub API request"},
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
    try:
        github_token, github_token_needs_reconnect = _stored_github_token(get_db())
    except GithubTokenKeyError as error:
        app.logger.error("GitHub token key unavailable: %s", error)
        github_token = None
        github_token_needs_reconnect = True

    return jsonify({
        "storage_path": DB_PATH,
        "db_size_bytes": db_size,
        "max_projects": MAX_PROJECTS,
        "max_documents": MAX_DOCUMENTS,
        "max_content_length": MAX_CONTENT_LENGTH,
        "max_compile_bytes": MAX_COMPILE_BYTES,
        "max_compile_files": MAX_COMPILE_FILES,
        "compile_timeout_seconds": COMPILE_TIMEOUT_SECONDS,
        "latex_engines": list(LATEX_ENGINES),
        "github_token_configured": github_token is not None,
        "github_token_needs_reconnect": github_token_needs_reconnect,
        "github_token_key_source": _github_token_key_source(),
    })


@app.route("/api/v1/github-token", methods=["GET", "PUT", "DELETE"])
@limiter.limit("30 per minute")
def github_token_endpoint():
    """Manage the encrypted GitHub PAT without returning plaintext to clients."""
    db = get_db()
    if request.method == "GET":
        try:
            token, needs_reconnect = _stored_github_token(db)
        except GithubTokenKeyError as error:
            app.logger.error("GitHub token key unavailable: %s", error)
            return jsonify({"error": "GitHub credential storage is unavailable"}), 500
        response = jsonify({
            "configured": token is not None,
            "needs_reconnect": needs_reconnect,
            "key_source": _github_token_key_source(),
        })
        response.headers["Cache-Control"] = "no-store"
        return response

    if request.method == "DELETE":
        _delete_github_token(db)
        return "", 204

    data = request.get_json(silent=True)
    try:
        token = _validate_github_token(data.get("token") if isinstance(data, dict) else None)
    except ValueError:
        return jsonify({"error": "A valid GitHub PAT is required"}), 400

    try:
        status, body, _ = _github_http_request(token, "/user")
    except GithubApiUnavailable:
        return jsonify({"error": "GitHub is unavailable"}), 502
    if status != 200:
        return jsonify({"error": "GitHub rejected the PAT"}), 401
    try:
        github_user = json.loads(body)
        login = github_user["login"]
    except (json.JSONDecodeError, KeyError, TypeError):
        return jsonify({"error": "GitHub returned an invalid authentication response"}), 502

    try:
        _store_github_token(db, token)
    except GithubTokenKeyError as error:
        app.logger.error("GitHub token key unavailable: %s", error)
        return jsonify({"error": "GitHub credential storage is unavailable"}), 500

    response = jsonify({
        "configured": True,
        "login": login,
        "key_source": _github_token_key_source(),
    })
    response.headers["Cache-Control"] = "no-store"
    return response


@app.route("/api/v1/github", methods=["POST"])
@limiter.limit("120 per minute")
def github_proxy():
    """Proxy the limited GitHub API surface used by folder synchronization."""
    try:
        path, method, body = _validate_github_proxy_request(
            request.get_json(silent=True)
        )
    except ValueError:
        return jsonify({"error": "GitHub API request is not allowed"}), 400

    try:
        token, needs_reconnect = _stored_github_token(get_db())
    except GithubTokenKeyError as error:
        app.logger.error("GitHub token key unavailable: %s", error)
        return jsonify({"error": "GitHub credential storage is unavailable"}), 500
    if not token:
        return jsonify({
            "error": "Connect GitHub before using repository sync",
            "needs_reconnect": needs_reconnect,
        }), 401

    try:
        status, response_body, github_headers = _github_http_request(
            token,
            path,
            method,
            body,
        )
    except GithubApiUnavailable:
        return jsonify({"error": "GitHub is unavailable"}), 502

    response = app.response_class(
        response_body,
        status=status,
        mimetype="application/json",
    )
    response.headers["Cache-Control"] = "no-store"
    for header in ("X-RateLimit-Remaining", "X-RateLimit-Reset", "Retry-After"):
        value = github_headers.get(header)
        if value is not None:
            response.headers[header] = value
    return response


@app.route("/api/v1/compile", methods=["POST"])
@limiter.limit("30 per minute")
def compile_latex():
    """Compile a complete LaTeX project and return the generated PDF."""
    data = request.get_json(silent=True)

    try:
        files, main_file, engine = _normalize_compile_request(data)
        pdf_bytes, page_count, elapsed_ms, _ = _compile_latex_project(
            files,
            main_file,
            engine,
        )
    except OverflowError:
        return jsonify({"error": "LaTeX project exceeds the compile size limit"}), 413
    except CompileRequestError as error:
        details = COMPILE_REQUEST_DETAILS.get(
            error.code,
            "Review the project files and compile settings.",
        )
        return jsonify({
            "error": "Invalid LaTeX compile request",
            "details": details,
        }), 400
    except LatexCompilerUnavailable as error:
        app.logger.error("LaTeX compiler unavailable: %s", error)
        return jsonify({"error": "LaTeX compiler is unavailable"}), 503
    except LatexCompilationTimedOut:
        return jsonify({
            "error": (
                f"LaTeX compilation exceeded the {COMPILE_TIMEOUT_SECONDS}-second limit"
            )
        }), 504
    except LatexCompilationFailed as error:
        app.logger.info("LaTeX compilation failed for %s", main_file)
        return jsonify({
            "error": "LaTeX compilation failed",
            "errors": _compile_error_entries(error.log),
            "log": error.log,
        }), 422

    response = app.response_class(pdf_bytes, mimetype="application/pdf")
    response.headers["Cache-Control"] = "no-store"
    response.headers["Content-Disposition"] = (
        f'inline; filename="{_pdf_download_name(main_file)}"'
    )
    response.headers["X-Compile-Time-Ms"] = str(elapsed_ms)
    response.headers["X-LaTeX-Engine"] = engine
    response.headers["X-Page-Count"] = str(page_count)
    return response


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

    try:
        engine = _validate_latex_engine(data.get("engine"))
    except ValueError:
        return jsonify({"error": "Unsupported LaTeX engine"}), 400

    try:
        github = _validate_github_link(data.get("github"))
    except ValueError as error:
        app.logger.warning("Invalid GitHub project metadata: %s", error)
        return jsonify({"error": "Invalid GitHub project metadata"}), 400

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
    github_values = _github_db_values(github)

    try:
        db.execute(
            """
            INSERT INTO projects (
                id, name, main_file, engine, github_repo, github_path,
                github_branch, github_sha, github_manifest, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                project_id,
                name,
                main_file,
                engine,
                *github_values,
                now,
                now,
            )
        )

        for path, content in files.items():
            file_id = str(uuid.uuid4())
            is_binary = 0
            file_content = content

            if isinstance(content, dict) and (
                content.get("isBinary") is True
                or content.get("type") == "binary"
            ):
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
    """Update a project (files, main_file, engine)."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    db = get_db()
    row = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not row:
        return jsonify({"error": "Project not found"}), 404

    github_provided = "github" in data
    if "engine" in data:
        try:
            engine = _validate_latex_engine(data["engine"])
        except ValueError:
            return jsonify({"error": "Unsupported LaTeX engine"}), 400

    if github_provided:
        try:
            github = _validate_github_link(data["github"])
        except ValueError as error:
            app.logger.warning("Invalid GitHub project metadata: %s", error)
            return jsonify({"error": "Invalid GitHub project metadata"}), 400

    now = _utcnow()

    try:
        if "main_file" in data:
            db.execute("UPDATE projects SET main_file = ?, updated_at = ? WHERE id = ?",
                       (data["main_file"], now, project_id))

        if "engine" in data:
            db.execute(
                "UPDATE projects SET engine = ?, updated_at = ? WHERE id = ?",
                (engine, now, project_id),
            )

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

        if github_provided:
            db.execute(
                """
                UPDATE projects
                SET github_repo = ?, github_path = ?, github_branch = ?,
                    github_sha = ?, github_manifest = ?, updated_at = ?
                WHERE id = ?
                """,
                (*_github_db_values(github), now, project_id),
            )

        if "files" in data and isinstance(data["files"], dict):
            # Replace all files
            db.execute("DELETE FROM project_files WHERE project_id = ?", (project_id,))
            for path, content in data["files"].items():
                file_id = str(uuid.uuid4())
                is_binary = 0
                file_content = content
                if isinstance(content, dict) and (
                    content.get("isBinary") is True
                    or content.get("type") == "binary"
                ):
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
