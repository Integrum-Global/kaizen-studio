#!/usr/bin/env python
"""
Seed Permissions Script

Seeds default permissions from PERMISSION_MATRIX into the database.
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv

load_dotenv()

from studio.services.rbac_service import RBACService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def seed_permissions():
    """Seed default permissions from PERMISSION_MATRIX."""
    logger.info("Starting permission seeding...")

    rbac = RBACService()
    result = await rbac.seed_default_permissions()

    logger.info(f"Permissions created: {result['permissions_created']}")
    logger.info(f"Role mappings created: {result['mappings_created']}")
    logger.info("Permission seeding completed successfully!")

    return result


def main():
    """Main entry point."""
    try:
        result = asyncio.run(seed_permissions())
        print("\nSeed completed:")
        print(f"  Permissions created: {result['permissions_created']}")
        print(f"  Mappings created: {result['mappings_created']}")
    except Exception as e:
        logger.error(f"Permission seeding failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
