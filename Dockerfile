# Multi-stage build to reduce Railway timeout issues
FROM python:3.11-slim as dependencies

# Install system dependencies for AI/ML
RUN apt-get update && apt-get install -y \
    ffmpeg \
    gcc \
    g++ \
    pkg-config \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install in stages to use Docker cache
COPY apps/backend/requirements.txt /tmp/requirements.txt

# Install core dependencies first (these cache well)
RUN pip install --upgrade pip setuptools wheel

# Install lightweight dependencies (no PyTorch/transformers - using OpenAI Vision API)
RUN pip install --no-cache-dir opencv-python-headless==4.8.1.78

# Install remaining dependencies
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Final lightweight stage
FROM python:3.11-slim

# Install minimal runtime deps
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from dependencies stage
COPY --from=dependencies /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Copy application code and startup script
COPY apps/backend /app/
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose port
EXPOSE 8000

# Health check disabled for debugging
# HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
#     CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Start command using startup script
CMD ["/app/start.sh"]