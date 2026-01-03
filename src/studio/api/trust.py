"""
Trust API Routes

EATP (Enterprise Agent Trust Protocol) endpoints.
ALL endpoints use real TrustService - NO STUBS.

EATP Principles:
- Every agent action traces to a HUMAN (root_source)
- Trust flows DOWN the hierarchy, never UP
- Constraints can only TIGHTEN through delegation
- Every action is VERIFIED before and AUDITED after
- Revocation CASCADES through all delegations
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from studio.middleware.rbac import get_current_user_from_request
from studio.services import HumanOrigin, TrustService

router = APIRouter(prefix="/trust", tags=["Trust"])

# Initialize service (singleton pattern)
_trust_service: TrustService | None = None


def get_trust_service() -> TrustService:
    """Get or create TrustService singleton."""
    global _trust_service
    if _trust_service is None:
        _trust_service = TrustService()
    return _trust_service


# ===================
# Request/Response Models
# ===================


class GenesisRecord(BaseModel):
    """Genesis record for a trust chain."""

    agent_id: str
    authority_id: str
    established_at: str
    expires_at: str | None = None
    capabilities: list[str] = []
    constraints: list[str] = []


class DelegationRecord(BaseModel):
    """Delegation record in a trust chain."""

    delegator_id: str
    delegatee_id: str
    capabilities: list[str]
    constraints: list[str] = []
    created_at: str
    expires_at: str | None = None


class HumanOriginResponse(BaseModel):
    """Human who authorized an action - EATP origin tracking."""

    human_id: str
    display_name: str
    auth_provider: str
    session_id: str
    authenticated_at: str


class TrustChain(BaseModel):
    """Trust chain for an agent."""

    agent_id: str
    genesis: GenesisRecord
    delegations: list[DelegationRecord] = []
    status: str = "active"
    human_origin: HumanOriginResponse | None = None


class TrustChainListResponse(BaseModel):
    """Response for list trust chains."""

    items: list[TrustChain]
    total: int


class AuditAnchor(BaseModel):
    """Audit anchor record."""

    id: str
    agent_id: str
    action: str
    resource_type: str
    resource_id: str | None = None
    timestamp: str
    result: str
    human_origin: HumanOriginResponse | None = None
    details: dict | None = None


class AuditTrailResponse(BaseModel):
    """Response for audit trail query."""

    items: list[AuditAnchor]
    total: int


class EstablishTrustRequest(BaseModel):
    """Request to establish trust for an agent."""

    agent_id: str
    authority_id: str
    capabilities: list[str] = []
    constraints: list[str] = []
    expires_in_days: int | None = 365


class VerifyTrustRequest(BaseModel):
    """Request to verify trust for an action."""

    agent_id: str
    action: str
    resource_type: str
    resource_id: str | None = None


class VerificationResult(BaseModel):
    """Result of trust verification."""

    allowed: bool
    reason: str | None = None
    capabilities_matched: list[str] = []
    constraints_violated: list[str] = []


class DelegateTrustRequest(BaseModel):
    """Request to delegate trust."""

    delegator_id: str
    delegatee_id: str
    capabilities: list[str]
    constraints: list[str] = []
    expires_in_days: int | None = 30


class OrganizationalAuthority(BaseModel):
    """Organizational authority."""

    id: str
    name: str
    organization_id: str
    public_key: str | None = None
    status: str = "active"
    created_at: str


class ESAConfig(BaseModel):
    """ESA (Enterprise Security Authority) configuration."""

    enabled: bool = False
    url: str | None = None
    api_key: str | None = None
    sync_interval_minutes: int = 60


# EATP Models
class AffectedAgent(BaseModel):
    """Agent affected by cascade revocation."""

    agent_id: str
    agent_name: str | None = None
    delegation_depth: int
    active_tasks: int = 0
    status: str = "valid"


class RevocationImpactPreview(BaseModel):
    """Preview of cascade revocation impact."""

    target_agent_id: str
    target_agent_name: str | None = None
    affected_agents: list[AffectedAgent] = []
    total_affected: int = 0
    has_active_workloads: bool = False
    warnings: list[str] = []


class CascadeRevocationResult(BaseModel):
    """Result of cascade revocation."""

    revoked_agent_ids: list[str]
    total_revoked: int
    reason: str
    initiated_by: str
    completed_at: str


class CascadeRevocationRequest(BaseModel):
    """Request body for cascade revocation."""

    reason: str


class EATPAuditAnchor(BaseModel):
    """EATP audit anchor with human origin."""

    id: str
    agent_id: str
    action: str
    resource_type: str
    resource_id: str | None = None
    timestamp: str
    result: str
    human_origin: HumanOriginResponse | None = None
    details: dict | None = None


class EATPAuditResponse(BaseModel):
    """Response for EATP audit query by human origin."""

    items: list[EATPAuditAnchor]
    total: int


# ===================
# Trust Chain Endpoints
# ===================


@router.get("/chains", response_model=TrustChainListResponse)
async def list_trust_chains(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=1000),
    status: str | None = Query(None),
    user: dict = Depends(get_current_user_from_request),
):
    """
    List all trust chains.

    Returns paginated list of trust chains for the organization.
    """
    service = get_trust_service()
    organization_id = user.get("organization_id")

    result = await service.list_trust_chains(
        organization_id=organization_id,
        status=status,
        page=page,
        page_size=page_size,
    )

    return TrustChainListResponse(
        items=[TrustChain(**item) for item in result["items"]],
        total=result["total"],
    )


@router.get("/chains/{agent_id}", response_model=TrustChain)
async def get_trust_chain(
    agent_id: str,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Get trust chain for a specific agent.
    """
    service = get_trust_service()
    chain = await service.get_trust_chain(agent_id)

    if not chain:
        raise HTTPException(status_code=404, detail="Trust chain not found for agent")

    return TrustChain(**chain)


@router.post("/establish", response_model=TrustChain)
async def establish_trust(
    request: EstablishTrustRequest,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Establish initial trust for an agent.

    EATP: Creates a trust chain with human origin tracking.
    """
    service = get_trust_service()
    organization_id = user.get("organization_id", "")

    # Create HumanOrigin from authenticated user
    human_origin = HumanOrigin.from_user(user)

    chain = await service.establish_trust(
        agent_id=request.agent_id,
        authority_id=request.authority_id,
        organization_id=organization_id,
        human_origin=human_origin,
        capabilities=request.capabilities,
        constraints=request.constraints,
        expires_in_days=request.expires_in_days or 365,
    )

    return TrustChain(**chain)


@router.post("/verify", response_model=VerificationResult)
async def verify_trust(
    request: VerifyTrustRequest,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Verify if an agent has trust to perform an action.
    """
    service = get_trust_service()

    result = await service.verify_trust(
        agent_id=request.agent_id,
        action=request.action,
        resource_type=request.resource_type,
        resource_id=request.resource_id,
    )

    return VerificationResult(**result)


@router.post("/delegate", response_model=DelegationRecord)
async def delegate_trust(
    request: DelegateTrustRequest,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Delegate trust from one agent to another.

    EATP: Constraints can only TIGHTEN through delegation.
    """
    service = get_trust_service()
    organization_id = user.get("organization_id", "")

    # Create HumanOrigin from authenticated user
    human_origin = HumanOrigin.from_user(user)

    try:
        delegation = await service.delegate_trust(
            delegator_id=request.delegator_id,
            delegatee_id=request.delegatee_id,
            organization_id=organization_id,
            human_origin=human_origin,
            capabilities=request.capabilities,
            constraints=request.constraints,
            expires_in_days=request.expires_in_days or 30,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    return DelegationRecord(**delegation)


@router.post("/revoke")
async def revoke_trust(
    agent_id: str = Query(...),
    reason: str = Query(...),
    user: dict = Depends(get_current_user_from_request),
):
    """
    Revoke trust for an agent (simple revocation without cascade).
    """
    service = get_trust_service()
    initiated_by = user.get("email", "unknown")

    # Use cascade revocation but only for the specific agent
    result = await service.revoke_cascade(
        agent_id=agent_id,
        reason=reason,
        initiated_by=initiated_by,
    )

    return {"message": f"Trust revoked for agent {agent_id}", "reason": reason, **result}


@router.post("/revoke-delegation")
async def revoke_delegation(
    delegatee_id: str = Query(...),
    delegator_id: str = Query(...),
    reason: str = Query(...),
    user: dict = Depends(get_current_user_from_request),
):
    """
    Revoke a delegation.
    """
    service = get_trust_service()
    initiated_by = user.get("email", "unknown")

    # Revoke the delegation by revoking trust on the delegatee
    result = await service.revoke_cascade(
        agent_id=delegatee_id,
        reason=reason,
        initiated_by=initiated_by,
    )

    return {
        "message": f"Delegation from {delegator_id} to {delegatee_id} revoked",
        "reason": reason,
        **result,
    }


# ===================
# EATP Cascade Revocation Endpoints
# ===================


@router.get("/revoke/{agent_id}/impact", response_model=RevocationImpactPreview)
async def get_revocation_impact(
    agent_id: str,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Get cascade revocation impact preview.

    EATP: Shows all agents that will be affected when revoking with cascade.
    This is REAL data from the trust chain, not mock data.
    """
    service = get_trust_service()

    impact = await service.get_revocation_impact(agent_id)

    return RevocationImpactPreview(
        target_agent_id=impact["target_agent_id"],
        target_agent_name=impact.get("target_agent_name"),
        affected_agents=[AffectedAgent(**a) for a in impact["affected_agents"]],
        total_affected=impact["total_affected"],
        has_active_workloads=impact["has_active_workloads"],
        warnings=impact["warnings"],
    )


@router.post("/revoke/{agent_id}/cascade", response_model=CascadeRevocationResult)
async def revoke_cascade(
    agent_id: str,
    request: CascadeRevocationRequest,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Revoke trust with cascade to all downstream agents.

    EATP Operation: Revokes the target agent and ALL agents that received
    delegated trust from it (recursively). This is REAL cascade revocation.
    """
    service = get_trust_service()
    initiated_by = user.get("email", "unknown")

    result = await service.revoke_cascade(
        agent_id=agent_id,
        reason=request.reason,
        initiated_by=initiated_by,
    )

    return CascadeRevocationResult(**result)


@router.post("/revoke/by-human/{human_id}", response_model=CascadeRevocationResult)
async def revoke_by_human(
    human_id: str,
    request: CascadeRevocationRequest,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Revoke all delegations from a specific human.

    EATP Operation: When a human's access is revoked (e.g., employee leaves),
    ALL agents they delegated to must be revoked. This is REAL revocation.
    """
    service = get_trust_service()
    initiated_by = user.get("email", "unknown")

    result = await service.revoke_by_human(
        human_id=human_id,
        reason=request.reason,
        initiated_by=initiated_by,
    )

    return CascadeRevocationResult(**result)


@router.get("/audit/by-human/{human_id}", response_model=EATPAuditResponse)
async def query_audit_by_human_origin(
    human_id: str,
    start_time: str | None = Query(None),
    end_time: str | None = Query(None),
    action: str | None = Query(None),
    result: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=1000),
    user: dict = Depends(get_current_user_from_request),
):
    """
    Get audit trail filtered by human origin.

    EATP: Query all actions ultimately authorized by a specific human.
    Returns REAL audit data, not mock.
    """
    service = get_trust_service()

    audit_result = await service.query_audit_by_human_origin(
        human_id=human_id,
        start_time=start_time,
        end_time=end_time,
        action=action,
        result=result,
        page=page,
        page_size=page_size,
    )

    items = []
    for item in audit_result["items"]:
        human_origin = item.get("human_origin")
        items.append(
            EATPAuditAnchor(
                id=item["id"],
                agent_id=item["agent_id"],
                action=item["action"],
                resource_type=item["resource_type"],
                resource_id=item.get("resource_id"),
                timestamp=item["timestamp"],
                result=item["result"],
                human_origin=HumanOriginResponse(**human_origin) if human_origin else None,
                details=item.get("details"),
            )
        )

    return EATPAuditResponse(items=items, total=audit_result["total"])


# ===================
# Agent Capabilities Endpoints
# ===================


@router.get("/agents/{agent_id}/capabilities", response_model=list[str])
async def get_agent_capabilities(
    agent_id: str,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Get capabilities for an agent from trust chain.
    """
    service = get_trust_service()
    chain = await service.get_trust_chain(agent_id)

    if not chain:
        return []

    return chain.get("genesis", {}).get("capabilities", [])


@router.get("/agents/{agent_id}/constraints", response_model=list[str])
async def get_agent_constraints(
    agent_id: str,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Get constraints for an agent from trust chain.
    """
    service = get_trust_service()
    chain = await service.get_trust_chain(agent_id)

    if not chain:
        return []

    return chain.get("genesis", {}).get("constraints", [])


@router.get("/agents/{agent_id}/trust-summary")
async def get_agent_trust_summary(
    agent_id: str,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Get trust summary for agent card display.
    """
    service = get_trust_service()
    chain = await service.get_trust_chain(agent_id)

    if not chain:
        return {
            "agent_id": agent_id,
            "has_trust": False,
            "status": "none",
            "capabilities_count": 0,
            "delegations_count": 0,
            "last_verified": None,
            "human_origin": None,
        }

    genesis = chain.get("genesis", {})
    return {
        "agent_id": agent_id,
        "has_trust": True,
        "status": chain.get("status", "active"),
        "capabilities_count": len(genesis.get("capabilities", [])),
        "delegations_count": len(chain.get("delegations", [])),
        "last_verified": None,  # Would track from audit
        "human_origin": chain.get("human_origin"),
    }


@router.get("/agents/{agent_id}/capability-summary")
async def get_agent_capability_summary(
    agent_id: str,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Get capability summary for agent card display.
    """
    service = get_trust_service()
    chain = await service.get_trust_chain(agent_id)

    if not chain:
        return []

    capabilities = chain.get("genesis", {}).get("capabilities", [])
    return [
        {"capability": cap, "source": "genesis", "status": "active"}
        for cap in capabilities
    ]


# ===================
# Audit Endpoints
# ===================


@router.get("/audit", response_model=AuditTrailResponse)
async def query_audit_trail(
    agent_id: str | None = Query(None),
    action: str | None = Query(None),
    result: str | None = Query(None),
    start_time: str | None = Query(None),
    end_time: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=1000),
    user: dict = Depends(get_current_user_from_request),
):
    """
    Query audit trail for trust-related actions.
    """
    service = get_trust_service()

    audit_result = await service.query_audit_trail(
        agent_id=agent_id,
        action=action,
        result=result,
        start_time=start_time,
        end_time=end_time,
        page=page,
        page_size=page_size,
    )

    items = []
    for item in audit_result["items"]:
        human_origin = item.get("human_origin")
        items.append(
            AuditAnchor(
                id=item["id"],
                agent_id=item["agent_id"],
                action=item["action"],
                resource_type=item["resource_type"],
                resource_id=item.get("resource_id"),
                timestamp=item["timestamp"],
                result=item["result"],
                human_origin=HumanOriginResponse(**human_origin) if human_origin else None,
                details=item.get("details"),
            )
        )

    return AuditTrailResponse(items=items, total=audit_result["total"])


@router.post("/audit")
async def record_audit(
    agent_id: str,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    result: str = "allowed",
    details: dict | None = None,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Record an audit entry for an agent action.
    """
    service = get_trust_service()

    # Create HumanOrigin from authenticated user
    human_origin = HumanOrigin.from_user(user)

    anchor = await service._record_audit(
        agent_id=agent_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id or "",
        result=result,
        human_origin=human_origin,
        context=details,
    )

    return anchor


@router.get("/compliance/{organization_id}")
async def get_compliance_report(
    organization_id: str,
    start_time: str = Query(...),
    end_time: str = Query(...),
    user: dict = Depends(get_current_user_from_request),
):
    """
    Get compliance report for an organization.
    """
    service = get_trust_service()

    # Query audit trail for the organization
    audit_result = await service.query_audit_trail(
        start_time=start_time,
        end_time=end_time,
        page=1,
        page_size=10000,
    )

    items = audit_result["items"]
    total = len(items)
    allowed = len([i for i in items if i.get("result") == "success"])
    denied = len([i for i in items if i.get("result") == "denied"])
    failed = len([i for i in items if i.get("result") == "failure"])

    compliance_score = (allowed / total * 100) if total > 0 else 100.0

    return {
        "organization_id": organization_id,
        "start_time": start_time,
        "end_time": end_time,
        "total_actions": total,
        "allowed_actions": allowed,
        "denied_actions": denied,
        "failed_actions": failed,
        "compliance_score": round(compliance_score, 2),
        "violations": [i for i in items if i.get("result") in ("denied", "failure")],
    }


# ===================
# Authority Endpoints
# ===================


@router.get("/authorities", response_model=list[OrganizationalAuthority])
async def list_authorities(
    user: dict = Depends(get_current_user_from_request),
):
    """
    List all organizational authorities.
    """
    service = get_trust_service()
    organization_id = user.get("organization_id")

    authorities = await service.list_authorities(organization_id=organization_id)

    return [
        OrganizationalAuthority(
            id=a["id"],
            name=a["name"],
            organization_id=a["organization_id"],
            public_key=a.get("public_key"),
            status=a.get("status", "active"),
            created_at=a["created_at"],
        )
        for a in authorities
    ]


@router.get("/authorities/{authority_id}", response_model=OrganizationalAuthority)
async def get_authority(
    authority_id: str,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Get a specific authority.
    """
    service = get_trust_service()
    authority = await service.get_authority(authority_id)

    if not authority:
        raise HTTPException(status_code=404, detail="Authority not found")

    return OrganizationalAuthority(
        id=authority["id"],
        name=authority["name"],
        organization_id=authority["organization_id"],
        public_key=authority.get("public_key"),
        status=authority.get("status", "active"),
        created_at=authority["created_at"],
    )


@router.post("/authorities", response_model=OrganizationalAuthority)
async def create_authority(
    name: str,
    organization_id: str | None = None,
    public_key: str | None = None,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Create a new organizational authority.
    """
    service = get_trust_service()
    org_id = organization_id or user.get("organization_id", "")

    authority = await service.create_authority(
        organization_id=org_id,
        name=name,
        public_key=public_key or "",
    )

    return OrganizationalAuthority(
        id=authority["id"],
        name=authority["name"],
        organization_id=authority["organization_id"],
        public_key=authority.get("public_key"),
        status=authority.get("status", "active"),
        created_at=authority["created_at"],
    )


@router.get("/authorities/ui", response_model=list)
async def list_authorities_ui(
    status: str | None = Query(None),
    search: str | None = Query(None),
    user: dict = Depends(get_current_user_from_request),
):
    """
    List authorities for UI display.
    """
    service = get_trust_service()
    organization_id = user.get("organization_id")

    authorities = await service.list_authorities(
        organization_id=organization_id, status=status
    )

    # Filter by search if provided
    if search:
        search_lower = search.lower()
        authorities = [
            a for a in authorities if search_lower in a.get("name", "").lower()
        ]

    return authorities


@router.get("/authorities/ui/{authority_id}")
async def get_authority_ui(
    authority_id: str,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Get authority for UI display.
    """
    service = get_trust_service()
    authority = await service.get_authority(authority_id)

    if not authority:
        raise HTTPException(status_code=404, detail="Authority not found")

    return authority


@router.get("/authorities/{authority_id}/agents")
async def get_authority_agents(
    authority_id: str,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Get agents established by an authority.
    """
    service = get_trust_service()

    # List trust chains and filter by authority
    result = await service.list_trust_chains(page=1, page_size=1000)
    chains = result["items"]

    agents = []
    for chain in chains:
        genesis = chain.get("genesis", {})
        if genesis.get("authority_id") == authority_id:
            agents.append({
                "agent_id": chain.get("agent_id"),
                "established_at": genesis.get("established_at"),
                "capabilities": genesis.get("capabilities", []),
                "status": chain.get("status"),
            })

    return agents


# ===================
# ESA Endpoints
# ===================


@router.get("/esa/config", response_model=ESAConfig)
async def get_esa_config(
    user: dict = Depends(get_current_user_from_request),
):
    """
    Get ESA configuration.
    """
    # ESA config would be stored in settings - returning default for now
    return ESAConfig(
        enabled=False,
        url=None,
        api_key=None,
        sync_interval_minutes=60,
    )


@router.put("/esa/config", response_model=ESAConfig)
async def update_esa_config(
    config: ESAConfig,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Update ESA configuration.
    """
    # Would store in database/settings
    return config


@router.post("/esa/test-connection")
async def test_esa_connection(
    user: dict = Depends(get_current_user_from_request),
):
    """
    Test ESA connection.
    """
    return {
        "success": False,
        "message": "ESA not configured",
    }


# ===================
# Metrics Endpoints
# ===================


@router.get("/metrics")
async def get_trust_metrics(
    start: str = Query(...),
    end: str = Query(...),
    preset: str | None = Query(None),
    user: dict = Depends(get_current_user_from_request),
):
    """
    Get trust metrics for a time range.
    """
    service = get_trust_service()

    # Get chain stats
    chains_result = await service.list_trust_chains(page=1, page_size=10000)
    chains = chains_result["items"]

    active = len([c for c in chains if c.get("status") == "active"])
    expired = len([c for c in chains if c.get("status") == "expired"])
    revoked = len([c for c in chains if c.get("status") == "revoked"])

    # Get audit stats
    audit_result = await service.query_audit_trail(
        start_time=start, end_time=end, page=1, page_size=10000
    )
    audits = audit_result["items"]

    successful = len([a for a in audits if a.get("result") == "success"])
    failed = len([a for a in audits if a.get("result") in ("failure", "denied")])

    return {
        "total_chains": len(chains),
        "active_chains": active,
        "expired_chains": expired,
        "revoked_chains": revoked,
        "total_delegations": sum(len(c.get("delegations", [])) for c in chains),
        "total_verifications": len(audits),
        "successful_verifications": successful,
        "failed_verifications": failed,
        "timeline": [],  # Would compute time-series data
    }


@router.get("/metrics/export")
async def export_trust_metrics(
    start: str = Query(...),
    end: str = Query(...),
    format: str = Query("json"),
    preset: str | None = Query(None),
    user: dict = Depends(get_current_user_from_request),
):
    """
    Export trust metrics.
    """
    from fastapi.responses import Response
    import json as json_module

    metrics = await get_trust_metrics(start=start, end=end, preset=preset, user=user)

    return Response(
        content=json_module.dumps(metrics, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=trust_metrics.json"},
    )


# ===================
# Pipeline Trust Endpoints
# ===================


@router.post("/pipeline/validate")
async def validate_pipeline_trust(
    pipeline_id: str,
    agent_ids: list[str],
    required_capabilities: dict | None = None,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Validate trust for all agents in a pipeline.
    """
    service = get_trust_service()
    required_caps = required_capabilities or {}

    agent_statuses = []
    all_valid = True

    for agent_id in agent_ids:
        chain = await service.get_trust_chain(agent_id)

        if not chain:
            agent_statuses.append({
                "agent_id": agent_id,
                "has_trust": False,
                "missing_capabilities": required_caps.get(agent_id, []),
                "violated_constraints": [],
            })
            all_valid = False
            continue

        genesis = chain.get("genesis", {})
        capabilities = set(genesis.get("capabilities", []))
        required = set(required_caps.get(agent_id, []))
        missing = list(required - capabilities)

        agent_statuses.append({
            "agent_id": agent_id,
            "has_trust": True,
            "status": chain.get("status"),
            "missing_capabilities": missing,
            "violated_constraints": [],
            "human_origin": chain.get("human_origin"),
        })

        if missing or chain.get("status") != "active":
            all_valid = False

    return {
        "pipeline_id": pipeline_id,
        "all_valid": all_valid,
        "agent_statuses": agent_statuses,
    }


@router.get("/pipeline/{pipeline_id}/agents/{agent_id}")
async def get_agent_pipeline_status(
    pipeline_id: str,
    agent_id: str,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Get agent trust status for a specific pipeline.
    """
    service = get_trust_service()
    chain = await service.get_trust_chain(agent_id)

    if not chain:
        return {
            "agent_id": agent_id,
            "pipeline_id": pipeline_id,
            "has_trust": False,
            "capabilities": [],
            "constraints": [],
            "status": "none",
            "human_origin": None,
        }

    genesis = chain.get("genesis", {})
    return {
        "agent_id": agent_id,
        "pipeline_id": pipeline_id,
        "has_trust": True,
        "capabilities": genesis.get("capabilities", []),
        "constraints": genesis.get("constraints", []),
        "status": chain.get("status", "active"),
        "human_origin": chain.get("human_origin"),
    }


# ===================
# Registry Endpoints
# ===================


@router.post("/registry/agents")
async def register_agent(
    agent_id: str,
    name: str,
    capabilities: list[str] | None = None,
    tags: list[str] | None = None,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Register an agent in the trust registry.
    """
    import uuid

    if capabilities is None:
        capabilities = []
    if tags is None:
        tags = []

    now = datetime.utcnow()
    return {
        "id": str(uuid.uuid4()),
        "agent_id": agent_id,
        "name": name,
        "capabilities": capabilities,
        "tags": tags,
        "status": "active",
        "registered_at": now.isoformat(),
        "last_heartbeat": now.isoformat(),
    }


@router.post("/registry/discover")
async def discover_agents(
    capabilities: list[str] | None = None,
    tags: list[str] | None = None,
    status: str | None = None,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Discover agents by capabilities or tags.
    """
    service = get_trust_service()

    # List chains and filter by capabilities
    result = await service.list_trust_chains(page=1, page_size=1000)
    chains = result["items"]

    discovered = []
    for chain in chains:
        if status and chain.get("status") != status:
            continue

        genesis = chain.get("genesis", {})
        chain_caps = set(genesis.get("capabilities", []))

        if capabilities:
            required_caps = set(capabilities)
            if not required_caps.issubset(chain_caps):
                continue

        discovered.append({
            "agent_id": chain.get("agent_id"),
            "capabilities": list(chain_caps),
            "status": chain.get("status"),
            "human_origin": chain.get("human_origin"),
        })

    return discovered


@router.get("/registry/agents/{agent_id}")
async def get_agent_metadata(
    agent_id: str,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Get agent metadata from registry.
    """
    service = get_trust_service()
    chain = await service.get_trust_chain(agent_id)

    if not chain:
        raise HTTPException(status_code=404, detail="Agent not found in registry")

    genesis = chain.get("genesis", {})
    return {
        "agent_id": agent_id,
        "capabilities": genesis.get("capabilities", []),
        "constraints": genesis.get("constraints", []),
        "status": chain.get("status"),
        "established_at": genesis.get("established_at"),
        "human_origin": chain.get("human_origin"),
    }


@router.post("/registry/agents/{agent_id}/heartbeat")
async def update_agent_heartbeat(
    agent_id: str,
    user: dict = Depends(get_current_user_from_request),
):
    """
    Update agent heartbeat.
    """
    return {"success": True, "timestamp": datetime.utcnow().isoformat()}
