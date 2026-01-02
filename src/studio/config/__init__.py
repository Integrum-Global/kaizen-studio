"""Configuration module."""

import importlib.util

# Re-export config functions from parent config.py module
# This handles the naming conflict between config package and config.py file
from pathlib import Path

from studio.config.permissions import (
    ADMIN_ROLES,
    CREATOR_ROLES,
    PERMISSION_DESCRIPTIONS,
    PERMISSION_MATRIX,
    VALID_ACTIONS,
    VALID_RESOURCES,
    VALID_ROLES,
)

config_py_path = Path(__file__).parent.parent / "config.py"
spec = importlib.util.spec_from_file_location("_config_module", config_py_path)
_config_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(_config_module)

get_database_url = _config_module.get_database_url
get_redis_url = _config_module.get_redis_url
get_settings = _config_module.get_settings
Settings = _config_module.Settings
is_production = _config_module.is_production
is_development = _config_module.is_development
is_testing = _config_module.is_testing
