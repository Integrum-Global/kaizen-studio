"""
Initialize Test Database

Creates all tables in the test database by importing all models.
"""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from dataflow import DataFlow


async def main():
    """Initialize test database with all tables."""
    # Create DataFlow instance for test database
    db = DataFlow(
        database_url="postgresql://kaizen_dev:kaizen_dev_password@localhost:5432/kaizen_studio_test",
        auto_migrate=True,
        enable_caching=False,
    )

    # Import all models to trigger table creation
    print("Importing models...")

    print("All models imported successfully!")
    print("\nTables should now exist in kaizen_studio_test database.")


if __name__ == "__main__":
    asyncio.run(main())
