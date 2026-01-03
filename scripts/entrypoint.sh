#!/bin/bash
# ==============================================
# Kaizen Studio Backend Entrypoint
# ==============================================
# This script runs database table creation before starting the application.
# Table creation uses raw SQL via psycopg2 to avoid DataFlow's complex
# migration system which has async/sync event loop conflicts.

set -e

echo "=== Kaizen Studio Backend Starting ==="
echo "Environment: ${ENVIRONMENT:-development}"

# Wait a moment for database to be fully ready (healthcheck passed but give it a buffer)
sleep 2

# Run table creation script using raw SQL
# This bypasses DataFlow's migration system which has event loop conflicts.
echo "=== Creating Database Tables (SQL) ==="
python /app/scripts/create_tables_sql.py

if [ $? -eq 0 ]; then
    echo "=== Database Tables Ready ==="
else
    echo "WARNING: Some tables may not have been created."
fi

# Start the application
echo "=== Starting Uvicorn ==="
exec uvicorn studio.main:app --host 0.0.0.0 --port 8000
