"""
Billing API Endpoints

Handles usage tracking, quotas, and billing periods.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from studio.api.auth import get_current_user
from studio.services.billing_service import PLAN_QUOTAS, PRICING, BillingService

router = APIRouter(prefix="/billing", tags=["Billing"])

# Initialize service
billing_service = BillingService()


# Request/Response Models
class UsageRecordResponse(BaseModel):
    """Usage record response."""

    id: str
    organization_id: str
    resource_type: str
    quantity: float
    unit: str
    unit_cost: float
    total_cost: float
    metadata: str | None
    recorded_at: str
    created_at: str


class UsageRecordListResponse(BaseModel):
    """Usage record list response."""

    records: list[UsageRecordResponse]
    total: int


class ResourceSummary(BaseModel):
    """Resource usage summary."""

    quantity: float
    cost: float
    unit: str


class UsageSummaryResponse(BaseModel):
    """Usage summary response."""

    organization_id: str
    start_date: str
    end_date: str
    by_resource: dict[str, ResourceSummary]
    total_cost: float
    record_count: int


class QuotaResponse(BaseModel):
    """Quota response."""

    id: str
    organization_id: str
    resource_type: str
    limit_value: float
    current_usage: float
    reset_period: str
    last_reset_at: str
    created_at: str
    updated_at: str


class QuotaListResponse(BaseModel):
    """Quota list response."""

    quotas: list[QuotaResponse]


class UpdateQuotaRequest(BaseModel):
    """Update quota request."""

    limit_value: float = Field(..., ge=-1, description="Quota limit (-1 for unlimited)")


class BillingPeriodResponse(BaseModel):
    """Billing period response."""

    id: str
    organization_id: str
    start_date: str
    end_date: str
    status: str
    total_usage: float
    total_cost: float
    invoice_id: str | None
    created_at: str


class BillingPeriodListResponse(BaseModel):
    """Billing period list response."""

    records: list[BillingPeriodResponse]
    total: int


class CostEstimateRequest(BaseModel):
    """Cost estimate request."""

    resource_type: str = Field(
        ..., pattern=r"^(agent_execution|token|storage|api_call)$"
    )
    quantity: float = Field(..., gt=0)


class CostEstimateResponse(BaseModel):
    """Cost estimate response."""

    resource_type: str
    quantity: float
    unit: str
    unit_cost: float
    total_cost: float


class PricingResponse(BaseModel):
    """Pricing information response."""

    pricing: dict


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str


# Usage endpoints
@router.get("/usage", response_model=UsageSummaryResponse)
async def get_usage_summary(
    start_date: str = Query(..., description="Start date (ISO 8601)"),
    end_date: str = Query(..., description="End date (ISO 8601)"),
    current_user: dict = Depends(get_current_user),
):
    """
    Get usage summary for the current organization.

    Returns aggregated usage by resource type within the date range.
    """
    org_id = current_user["organization_id"]
    summary = await billing_service.get_usage_summary(org_id, start_date, end_date)

    return UsageSummaryResponse(**summary)


@router.get("/usage/details", response_model=UsageRecordListResponse)
async def get_usage_details(
    resource_type: str | None = Query(
        None, pattern=r"^(agent_execution|token|storage|api_call)$"
    ),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    """
    Get detailed usage records for the current organization.

    Returns individual usage records with optional filtering.
    """
    org_id = current_user["organization_id"]
    result = await billing_service.get_usage_details(
        org_id, resource_type, limit, offset
    )

    return UsageRecordListResponse(
        records=[UsageRecordResponse(**r) for r in result["records"]],
        total=result["total"],
    )


# Quota endpoints
@router.get("/quotas", response_model=QuotaListResponse)
async def get_quotas(
    current_user: dict = Depends(get_current_user),
):
    """
    Get all quotas for the current organization.

    Returns quota limits and current usage for each resource type.
    """
    org_id = current_user["organization_id"]
    quotas = await billing_service.get_quotas(org_id)

    return QuotaListResponse(quotas=[QuotaResponse(**q) for q in quotas])


@router.put("/quotas/{resource_type}", response_model=QuotaResponse)
async def update_quota(
    resource_type: str,
    request: UpdateQuotaRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Update quota limit for a resource type.

    Only org_owner or org_admin can update quotas.
    """
    if current_user["role"] not in ["org_owner", "org_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update quotas",
        )

    if resource_type not in PRICING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid resource type: {resource_type}",
        )

    org_id = current_user["organization_id"]
    quota = await billing_service.update_quota(
        org_id, resource_type, request.limit_value
    )

    if not quota:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update quota",
        )

    return QuotaResponse(**quota)


# Billing period endpoints
@router.get("/periods", response_model=BillingPeriodListResponse)
async def list_periods(
    limit: int = Query(12, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    """
    List billing periods for the current organization.

    Returns billing periods ordered by date.
    """
    org_id = current_user["organization_id"]
    result = await billing_service.list_periods(org_id, limit, offset)

    return BillingPeriodListResponse(
        records=[BillingPeriodResponse(**r) for r in result["records"]],
        total=result["total"],
    )


@router.get("/periods/current", response_model=BillingPeriodResponse)
async def get_current_period(
    current_user: dict = Depends(get_current_user),
):
    """
    Get the current active billing period.

    Creates a new period if none exists.
    """
    org_id = current_user["organization_id"]
    period = await billing_service.get_current_period(org_id)

    if not period:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get or create billing period",
        )

    return BillingPeriodResponse(**period)


@router.get("/periods/{period_id}", response_model=BillingPeriodResponse)
async def get_period(
    period_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Get a specific billing period by ID.
    """
    org_id = current_user["organization_id"]

    # List periods and find the one with matching ID
    result = await billing_service.list_periods(org_id, limit=100)
    period = next((p for p in result["records"] if p["id"] == period_id), None)

    if not period:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Billing period not found",
        )

    return BillingPeriodResponse(**period)


@router.post("/periods/{period_id}/close", response_model=BillingPeriodResponse)
async def close_period(
    period_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Close a billing period.

    Only org_owner or org_admin can close periods.
    """
    if current_user["role"] not in ["org_owner", "org_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to close billing periods",
        )

    try:
        period = await billing_service.close_period(period_id)
    except Exception as e:
        # DataFlow throws exception when record not found
        if "not found" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Billing period not found",
            )
        raise

    if not period:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Billing period not found",
        )

    return BillingPeriodResponse(**period)


# Cost estimation endpoints
@router.post("/estimate", response_model=CostEstimateResponse)
async def estimate_cost(
    request: CostEstimateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Estimate cost for a given resource usage.

    Returns estimated cost based on current pricing.
    """
    estimate = await billing_service.estimate_cost(
        request.resource_type, request.quantity
    )

    return CostEstimateResponse(**estimate)


@router.get("/pricing", response_model=PricingResponse)
async def get_pricing(
    current_user: dict = Depends(get_current_user),
):
    """
    Get current pricing information.

    Returns pricing for all resource types.
    """
    pricing = await billing_service.get_pricing()

    return PricingResponse(pricing=pricing)


@router.get("/plans", response_model=dict)
async def get_plan_quotas(
    current_user: dict = Depends(get_current_user),
):
    """
    Get quota limits for all plan tiers.

    Returns default quotas for free, pro, and enterprise plans.
    """
    return {"plans": PLAN_QUOTAS}
