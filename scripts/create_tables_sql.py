#!/usr/bin/env python3
"""
[DEPRECATED] Create DataFlow tables using raw SQL.

This script is NO LONGER NEEDED as of DataFlow 0.10.10.

DataFlow 0.10.10+ supports auto_migrate=False with create_tables_async() in FastAPI lifespan,
which properly handles async/sync event loop conflicts.

See src/studio/main.py lifespan() for the modern pattern:
    await db.create_tables_async()

This script is kept for backwards compatibility only. Do not use for new deployments.

Old description:
This script bypasses DataFlow's complex migration system which has async/sync
event loop conflicts. It generates DDL from model definitions and executes
directly via psycopg2.
"""

import logging
import os
import sys

import psycopg2

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def get_database_url():
    """Get database URL from environment."""
    return os.environ.get(
        "DATABASE_URL",
        "postgresql://kaizen_dev:kaizen_dev_password@postgres:5432/kaizen_studio",
    )


def parse_database_url(url: str) -> dict:
    """Parse PostgreSQL URL into connection params."""
    # postgresql://user:password@host:port/database
    url = url.replace("postgresql://", "")
    auth, rest = url.split("@")
    user, password = auth.split(":")
    host_port, database = rest.split("/")
    host, port = host_port.split(":")
    return {
        "host": host,
        "port": int(port),
        "user": user,
        "password": password,
        "database": database,
    }


def get_field_sql_type(field_type, field_info: dict) -> str:
    """Map Python type to PostgreSQL type."""
    from datetime import date, datetime
    from typing import get_args, get_origin

    # Handle class types directly
    if field_type is str:
        return "TEXT"
    elif field_type is int:
        return "INTEGER"
    elif field_type is float:
        return "REAL"
    elif field_type is bool:
        return "BOOLEAN"
    elif field_type is datetime:
        return "TIMESTAMP WITH TIME ZONE"
    elif field_type is date:
        return "DATE"
    elif field_type is dict:
        return "JSONB"
    elif field_type is list:
        return "JSONB"

    # Handle Optional types (Union[X, None])
    origin = get_origin(field_type)
    if origin is not None:
        args = get_args(field_type)
        # Filter out NoneType
        non_none_args = [a for a in args if a is not type(None)]
        if non_none_args:
            return get_field_sql_type(non_none_args[0], field_info)

    # Handle string representations (fallback)
    field_type_str = str(field_type)
    if "str" in field_type_str:
        return "TEXT"
    elif "int" in field_type_str:
        return "INTEGER"
    elif "float" in field_type_str:
        return "REAL"
    elif "bool" in field_type_str:
        return "BOOLEAN"
    elif "datetime" in field_type_str:
        return "TIMESTAMP WITH TIME ZONE"
    elif "date" in field_type_str:
        return "DATE"
    elif "dict" in field_type_str:
        return "JSONB"
    elif "list" in field_type_str:
        return "JSONB"

    return "TEXT"


def pluralize(word: str) -> str:
    """Properly pluralize English words for table names."""
    if not word:
        return word

    # Already plural
    if word.endswith("s"):
        return word

    # Words ending in consonant + y → ies (identity → identities, policy → policies)
    if word.endswith("y") and len(word) > 1 and word[-2] not in "aeiou":
        return word[:-1] + "ies"

    # Words ending in s, x, z, ch, sh → es
    if word.endswith(("s", "x", "z", "ch", "sh")):
        return word + "es"

    # Default: just add s
    return word + "s"


def generate_create_table_sql(model_name: str, fields: dict) -> str:
    """Generate CREATE TABLE SQL for a model."""
    # Convert model name to table name (snake_case, plural)
    table_name = "".join(
        ["_" + c.lower() if c.isupper() else c for c in model_name]
    ).lstrip("_")
    table_name = pluralize(table_name)

    columns = []
    for field_name, field_info in fields.items():
        field_type = field_info.get("type", str)  # Default to str class, not "str" string
        sql_type = get_field_sql_type(field_type, field_info)

        if field_name == "id":
            columns.append(f"    {field_name} TEXT PRIMARY KEY")
        else:
            null_clause = "" if field_info.get("required", False) else ""
            columns.append(f"    {field_name} {sql_type}{null_clause}")

    columns_sql = ",\n".join(columns)
    return f"CREATE TABLE IF NOT EXISTS {table_name} (\n{columns_sql}\n);"


def create_tables():
    """Create all DataFlow model tables."""
    # Import models to register them
    from studio.models import db

    db_url = get_database_url()
    conn_params = parse_database_url(db_url)

    logger.info(f"Connecting to database: {conn_params['host']}:{conn_params['port']}/{conn_params['database']}")

    try:
        conn = psycopg2.connect(**conn_params)
        conn.autocommit = True
        cursor = conn.cursor()

        model_names = list(db._models.keys())
        logger.info(f"Found {len(model_names)} registered models")

        created = 0
        failed = 0

        for model_name in model_names:
            model_info = db._models.get(model_name)
            if not model_info:
                logger.warning(f"Model {model_name} not found in registry")
                failed += 1
                continue

            fields = model_info.get("fields", {})
            try:
                sql = generate_create_table_sql(model_name, fields)
                cursor.execute(sql)
                logger.info(f"✓ Created table for {model_name}")
                created += 1
            except Exception as e:
                if "already exists" in str(e):
                    logger.info(f"✓ Table for {model_name} already exists")
                    created += 1
                else:
                    logger.error(f"✗ Failed to create table for {model_name}: {e}")
                    failed += 1

        cursor.close()
        conn.close()

        logger.info(f"Completed: {created}/{len(model_names)} tables created, {failed} failed")
        return failed == 0

    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False


if __name__ == "__main__":
    success = create_tables()
    sys.exit(0 if success else 1)
