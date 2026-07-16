FROM python:3.11-slim

WORKDIR /app

# Install the real TeX engines used by preview and PDF export.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        fontconfig \
        fonts-adobe-sourcesans3 \
        fonts-roboto \
        fonts-roboto-slab \
        biber \
        latexmk \
        texlive-bibtex-extra \
        texlive-fonts-extra \
        texlive-fonts-recommended \
        texlive-latex-extra \
        texlive-luatex \
        texlive-xetex \
        tini && \
    fc-cache -f && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN python -m pip install --no-cache-dir --upgrade pip==26.1.2 && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user and data directory
RUN useradd --create-home appuser && \
    mkdir -p /data && \
    chown -R appuser:appuser /app /data

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')" || exit 1

# Entrypoint ensures /data is writable, then drops to appuser
ENTRYPOINT ["/usr/bin/tini", "--", "/entrypoint.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "1", "--threads", "4", "--timeout", "90", "app:app"]
