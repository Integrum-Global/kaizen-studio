#!/bin/bash
# ==============================================
# Kaizen Studio Backend Entrypoint
# ==============================================
# DataFlow 0.10.10+ handles table creation via create_tables_async() in FastAPI lifespan.
# This script now just waits for the database and starts the application.

set -e

echo "=== Kaizen Studio Backend Starting ==="
echo "Environment: ${ENVIRONMENT:-development}"

# Wait a moment for database to be fully ready (healthcheck passed but give it a buffer)
sleep 2

# Start the application
# Database tables are created in FastAPI lifespan via db.create_tables_async()
echo "=== Starting Uvicorn ==="
exec uvicorn studio.main:app --host 0.0.0.0 --port 8000
