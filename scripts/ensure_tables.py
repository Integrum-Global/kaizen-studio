#!/usr/bin/env python3
"""
Ensure all DataFlow tables exist.

This script runs outside of the FastAPI context to avoid event loop conflicts.
Run this before starting the backend to ensure all tables are created.
"""

import asyncio
import logging
import os
import sys

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def ensure_tables():
    """Ensure all DataFlow model tables exist."""
    # Import after path is set
    from studio.models import db

    # Get all registered model names
    model_names = list(db._models.keys())
    logger.info(f"Found {len(model_names)} registered models")

    success_count = 0
    for model_name in model_names:
        try:
            await db.ensure_table_exists(model_name)
            logger.info(f"✓ Ensured table exists for {model_name}")
            success_count += 1
        except Exception as e:
            logger.error(f"✗ Failed to ensure table for {model_name}: {e}")

    logger.info(f"Completed: {success_count}/{len(model_names)} tables ensured")
    return success_count == len(model_names)


if __name__ == "__main__":
    success = asyncio.run(ensure_tables())
    sys.exit(0 if success else 1)
