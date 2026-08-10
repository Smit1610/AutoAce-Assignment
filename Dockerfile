# =========================================================================
# AutoAce AI Voice Tone & Background Noise System — Production Dockerfile
# =========================================================================

# Stage 1: Build the React Web Dashboard
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Backend & Integrated Static Server
FROM python:3.12-slim
WORKDIR /app

# Install system audio libraries (libsndfile for audio decoding)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source code
COPY backend/ ./backend/
COPY sample_data/ ./sample_data/

# Copy built frontend assets to dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose production port
EXPOSE 8000

ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Run high-performance ASGI server
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
