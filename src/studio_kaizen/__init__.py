"""
Studio Kaizen - Trust and Governance Extensions

Enterprise trust and governance components for AI agent systems:
- EATP (Enterprise Agent Trust Protocol) implementation
- Budget enforcement
- Rate limiting
- Policy engine (ABAC)

This module extends the installed kaizen package with local trust/governance components.
"""

__version__ = "0.1.0"

# Local trust/governance module
from studio_kaizen import trust  # noqa: F401
