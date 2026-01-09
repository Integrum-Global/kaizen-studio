"""
Kaizen Studio Main Application

FastAPI application entry point with all routes and middleware configured.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# CRITICAL: Import models to register DataFlow nodes before any API endpoint uses them
# This must happen at module load time, not in create_app() or lifespan
import studio.models  # noqa: F401, E402
from studio.api import (
    agent_execute_router,
    agents_router,
    api_keys_router,
    audit_router,
    auth_router,
    billing_router,
    connectors_router,
    deployments_router,
    executions_router,
    external_agents_router,
    gateways_router,
    invitations_router,
    lineage_router,
    metrics_router,
    organizations_router,
    pipelines_router,
    policies_router,
    promotions_router,
    rbac_router,
    scaling_router,
    settings_router,
    sso_router,
    teams_router,
    test_router,
    trust_router,
    users_router,
    webhooks_router,
    work_units_router,
    workspaces_router,
    activity_router,
    runs_router,
)
from studio.config import get_settings
from studio.middleware.audit_middleware import AuditMiddleware
from studio.middleware.auth import AuthMiddleware
from studio.middleware.csrf import CSRFMiddleware
from studio.middleware.error_handler import register_exception_handlers
from studio.middleware.lineage import LineageMiddleware
from studio.middleware.prometheus import PrometheusMiddleware, get_metrics_endpoint
from studio.middleware.rate_limit import RateLimitMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.

    Handles startup and shutdown events.
    Uses create_tables_async() because auto_migrate=True still has race condition
    issues in Docker/FastAPI despite claimed fixes in DataFlow 0.10.6+.
    """
    # Startup
    settings = get_settings()
    logger.info(f"Starting {settings.app_name} v{settings.version}")
    logger.info(f"Environment: {settings.environment}")

    # Create database tables using DataFlow's async method
    # This is required because auto_migrate=True causes DF-501 and event loop errors
    from studio.models import db

    logger.info("Creating database tables via DataFlow...")
    try:
        await db.create_tables_async()
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise

    yield

    # Shutdown
    logger.info(f"Shutting down {settings.app_name}")

    # Close DataFlow connections for proper cleanup
    try:
        await db.close_async()
        logger.info("DataFlow connections closed")
    except Exception as e:
        logger.warning(f"Error closing DataFlow connections: {e}")


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.

    Returns:
        Configured FastAPI application
    """
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description="AI Agent Platform Backend API",
        version=settings.version,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Register standardized exception handlers
    register_exception_handlers(app)

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Auth middleware
    app.add_middleware(AuthMiddleware)

    # Lineage middleware (extracts external identity headers)
    app.add_middleware(LineageMiddleware)

    # Rate limit middleware (must be after auth to access api_key state)
    app.add_middleware(RateLimitMiddleware)

    # CSRF protection middleware (validates Origin/Referer for state-changing requests)
    app.add_middleware(CSRFMiddleware)

    # Audit middleware (logs POST/PUT/PATCH/DELETE requests)
    app.add_middleware(AuditMiddleware, audit_enabled=settings.audit_enabled)

    # Prometheus middleware (if enabled)
    if settings.prometheus_enabled:
        app.add_middleware(PrometheusMiddleware)

    # Health check endpoint
    @app.get("/health", tags=["Health"])
    async def health_check():
        """
        Health check endpoint for load balancers and monitoring.

        Checks database and Redis connectivity to ensure the service is fully operational.
        """
        import redis
        from kailash.runtime import AsyncLocalRuntime
        from kailash.workflow.builder import WorkflowBuilder

        from studio.config import get_redis_url

        health_status = {
            "status": "healthy",
            "version": settings.version,
            "environment": settings.environment,
            "checks": {},
        }

        # Check database connectivity
        try:
            runtime = AsyncLocalRuntime()
            workflow = WorkflowBuilder()
            workflow.add_node(
                "OrganizationListNode",
                "db_check",
                {"limit": 1},
            )
            await runtime.execute_workflow_async(workflow.build(), inputs={})
            health_status["checks"]["database"] = "healthy"
        except Exception as e:
            health_status["status"] = "degraded"
            health_status["checks"]["database"] = f"unhealthy: {str(e)}"

        # Check Redis connectivity
        try:
            redis_client = redis.from_url(get_redis_url())
            redis_client.ping()
            health_status["checks"]["redis"] = "healthy"
            redis_client.close()
        except Exception as e:
            health_status["status"] = "degraded"
            health_status["checks"]["redis"] = f"unhealthy: {str(e)}"

        return health_status

    @app.get("/", tags=["Root"])
    async def root():
        """Root endpoint with API information."""
        return {
            "name": settings.app_name,
            "version": settings.version,
            "docs": "/docs",
        }

    # Prometheus metrics endpoint (if enabled)
    if settings.prometheus_enabled:

        @app.get("/metrics", tags=["Monitoring"])
        async def metrics():
            """Prometheus metrics endpoint for scraping."""
            return get_metrics_endpoint()

    # Include API routers
    app.include_router(auth_router, prefix=settings.api_prefix)
    app.include_router(organizations_router, prefix=settings.api_prefix)
    app.include_router(users_router, prefix=settings.api_prefix)
    app.include_router(teams_router, prefix=settings.api_prefix)
    app.include_router(invitations_router, prefix=settings.api_prefix)
    app.include_router(sso_router, prefix=settings.api_prefix)
    app.include_router(rbac_router, prefix=settings.api_prefix)
    app.include_router(agents_router, prefix=settings.api_prefix)
    app.include_router(agent_execute_router, prefix=settings.api_prefix)
    app.include_router(gateways_router, prefix=settings.api_prefix)
    app.include_router(deployments_router, prefix=settings.api_prefix)
    app.include_router(pipelines_router, prefix=settings.api_prefix)
    app.include_router(policies_router, prefix=settings.api_prefix)
    app.include_router(audit_router, prefix=settings.api_prefix)
    app.include_router(metrics_router, prefix=settings.api_prefix)
    app.include_router(test_router, prefix=settings.api_prefix)
    app.include_router(api_keys_router, prefix=settings.api_prefix)
    app.include_router(webhooks_router, prefix=settings.api_prefix)
    app.include_router(billing_router, prefix=settings.api_prefix)
    app.include_router(connectors_router, prefix=settings.api_prefix)
    app.include_router(promotions_router, prefix=settings.api_prefix)
    app.include_router(scaling_router, prefix=settings.api_prefix)
    app.include_router(external_agents_router, prefix=settings.api_prefix)
    app.include_router(lineage_router, prefix=settings.api_prefix)
    app.include_router(settings_router, prefix=settings.api_prefix)
    app.include_router(executions_router, prefix=settings.api_prefix)
    app.include_router(trust_router, prefix=settings.api_prefix)
    app.include_router(work_units_router, prefix=settings.api_prefix)
    app.include_router(workspaces_router, prefix=settings.api_prefix)
    app.include_router(activity_router, prefix=settings.api_prefix)
    app.include_router(runs_router, prefix=settings.api_prefix)

    return app


# Create the application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "studio.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
