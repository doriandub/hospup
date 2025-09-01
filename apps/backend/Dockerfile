FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy and run AI dependencies installation script
COPY install_ai_deps.sh .
RUN chmod +x install_ai_deps.sh && ./install_ai_deps.sh

# Copy requirements and install remaining dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt --no-cache-dir

# Copy application code
COPY . .

# Set environment variables
ENV PYTHON_PATH=/app
ENV TORCH_COMPILE_DEBUG=0
ENV TOKENIZERS_PARALLELISM=false

# Expose port
EXPOSE 8000

# Start command
CMD ["gunicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--worker-class", "uvicorn.workers.UvicornWorker", "--timeout", "120"]