# ─── AgriProof AI Backend ────────────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies needed by rasterio, geopandas, scikit-image
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        gdal-bin \
        libgdal-dev \
        libgeos-dev \
        libproj-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir asyncpg psycopg2-binary

# Copy application code
COPY . .

# Create directories for user uploads and pipeline artifacts
RUN mkdir -p /app/storage/uploads \
             /app/storage/results \
             /app/storage/zk_proofs \
             /app/static/results

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
