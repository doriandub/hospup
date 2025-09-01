# Railway AI-optimized Dockerfile
FROM python:3.11-slim

WORKDIR /app

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

# Copy backend requirements
COPY apps/backend/requirements.txt /app/requirements.txt

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy backend application
COPY apps/backend /app/

# Expose port
EXPOSE 8000

# Start command
CMD ["gunicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--worker-class", "uvicorn.workers.UvicornWorker", "--timeout", "300"]