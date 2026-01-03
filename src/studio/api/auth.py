"""
Authentication API Endpoints

Handles user registration, login, token refresh, and logout.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from kailash.runtime import AsyncLocalRuntime
from pydantic import BaseModel, EmailStr, Field

from studio.services.auth_service import AuthService
from studio.services.rbac_service import RBACService

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Security scheme for protected endpoints
security = HTTPBearer()


# Dependency factory functions
def get_runtime() -> AsyncLocalRuntime:
    """Get AsyncLocalRuntime for dependency injection."""
    return AsyncLocalRuntime()


def get_auth_service(runtime: AsyncLocalRuntime = Depends(get_runtime)) -> AuthService:
    """Get AuthService with injected runtime."""
    return AuthService(runtime=runtime)


def get_rbac_service(runtime: AsyncLocalRuntime = Depends(get_runtime)) -> RBACService:
    """Get RBACService with injected runtime."""
    return RBACService(runtime=runtime)


# Request/Response Models
class RegisterRequest(BaseModel):
    """User registration request."""

    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    name: str = Field(..., min_length=1, max_length=100)
    organization_name: str = Field(..., min_length=1, max_length=100)


class LoginRequest(BaseModel):
    """User login request."""

    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    """Token refresh request."""

    refresh_token: str


class LogoutRequest(BaseModel):
    """Logout request."""

    refresh_token: str = None


class TokenResponse(BaseModel):
    """Token response with access and refresh tokens."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    """User information response."""

    id: str
    email: str
    name: str
    organization_id: str
    role: str
    status: str = None
    mfa_enabled: bool = None
    last_login_at: str = None
    created_at: str = None


class RegisterResponse(BaseModel):
    """Registration response with user and tokens."""

    user: UserResponse
    tokens: TokenResponse


class LoginResponse(BaseModel):
    """Login response with user and tokens."""

    user: UserResponse
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str


# Helper to get current user from token
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
) -> dict:
    """
    Dependency to get the current authenticated user.

    Args:
        credentials: HTTP Bearer credentials
        auth_service: Injected AuthService

    Returns:
        Current user data

    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials
    payload = auth_service.verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await auth_service.get_user_by_id(payload.get("sub"))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_permission(permission: str):
    """
    Dependency factory that checks if user has a specific permission.

    Args:
        permission: Permission string (e.g., "agents:create")

    Returns:
        Dependency function that returns current user if authorized

    Example:
        @router.get("/protected")
        async def protected_route(user: dict = Depends(require_permission("agents:read"))):
            pass
    """

    async def permission_checker(
        current_user: dict = Depends(get_current_user),
        rbac_service: RBACService = Depends(get_rbac_service),
    ) -> dict:
        # Check permission using RBAC service
        has_permission = await rbac_service.check_permission(
            user_id=current_user["id"],
            permission=permission,
        )

        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission}",
            )

        return current_user

    return permission_checker


@router.post(
    "/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED
)
async def register(
    request: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Register a new user and organization.

    Creates a new organization with the user as the owner.
    Also creates a default development workspace.

    EATP Integration:
    - Creates a PseudoAgent trust chain for the new user
    - Establishes the user as a human origin in the trust system
    """
    try:
        result = await auth_service.register_user(
            email=request.email,
            password=request.password,
            name=request.name,
            organization_name=request.organization_name,
        )

        user = result["user"]
        tokens = auth_service.create_tokens(user)

        # EATP: Create PseudoAgent for the newly registered user
        import jwt
        decoded = jwt.decode(tokens["access_token"], options={"verify_signature": False})
        session_id = decoded.get("jti", "")

        try:
            await auth_service.create_pseudo_agent_for_user(
                user=user,
                session_id=session_id,
                auth_provider="registration",
            )
        except Exception:
            # Log but don't fail registration if PseudoAgent creation fails
            import logging
            logging.getLogger(__name__).warning(
                f"Failed to create PseudoAgent for new user {user.get('email')}"
            )

        return RegisterResponse(
            user=UserResponse(**user),
            tokens=TokenResponse(**tokens),
        )
    except Exception as e:
        # Check for duplicate email (DataFlow will raise an error)
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}",
        )


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Authenticate user and return tokens with user info.

    Returns access and refresh tokens along with user data on successful authentication.

    EATP Integration:
    - Creates a PseudoAgent trust chain for the user
    - Stores session-to-human mapping for traceability
    - All subsequent actions can be traced back to this human
    """
    user = await auth_service.authenticate_user(request.email, request.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    tokens = auth_service.create_tokens(user)

    # EATP: Create PseudoAgent for the authenticated user
    # Extract session ID from the access token for mapping
    import jwt
    decoded = jwt.decode(tokens["access_token"], options={"verify_signature": False})
    session_id = decoded.get("jti", "")

    try:
        await auth_service.create_pseudo_agent_for_user(
            user=user,
            session_id=session_id,
            auth_provider="password",
        )
    except Exception:
        # Log but don't fail login if PseudoAgent creation fails
        # This ensures backwards compatibility
        import logging
        logging.getLogger(__name__).warning(
            f"Failed to create PseudoAgent for user {user.get('email')}"
        )

    return LoginResponse(
        user=UserResponse(**user),
        **tokens,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: RefreshRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Refresh access token using refresh token.

    The old refresh token will be blacklisted.
    """
    tokens = await auth_service.refresh_access_token(request.refresh_token)

    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenResponse(**tokens)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    request: LogoutRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Logout and blacklist tokens.

    Both access and refresh tokens will be blacklisted.
    """
    access_token = credentials.credentials
    auth_service.logout(access_token, request.refresh_token)

    return MessageResponse(message="Successfully logged out")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Get current authenticated user information.

    Requires a valid access token.
    """
    return UserResponse(**current_user)


class PermissionsResponse(BaseModel):
    """User permissions response."""

    permissions: list[str]


@router.get("/permissions", response_model=PermissionsResponse)
async def get_permissions(
    current_user: dict = Depends(get_current_user),
    rbac_service: RBACService = Depends(get_rbac_service),
):
    """
    Get current user's permissions.

    Returns a list of permission strings based on the user's role.
    """
    permissions = await rbac_service.get_user_permissions(current_user["id"])
    return PermissionsResponse(permissions=permissions)


# =============================================================================
# Multi-Organization Support Endpoints
# =============================================================================


class OrganizationMembership(BaseModel):
    """Organization membership information."""

    id: str
    name: str
    slug: str
    role: str
    is_primary: bool
    joined_at: str
    joined_via: str


class OrganizationsResponse(BaseModel):
    """User's organizations response."""

    organizations: list[OrganizationMembership]


class SwitchOrganizationRequest(BaseModel):
    """Request to switch active organization."""

    organization_id: str


class SwitchOrganizationResponse(BaseModel):
    """Response after switching organization."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    active_organization: OrganizationMembership


@router.get("/me/organizations", response_model=OrganizationsResponse)
async def get_my_organizations(
    current_user: dict = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Get all organizations the current user belongs to.

    Returns a list of organizations with role and membership information.
    """
    organizations = await auth_service.get_user_organizations(current_user["id"])
    return OrganizationsResponse(
        organizations=[OrganizationMembership(**org) for org in organizations]
    )


@router.post("/me/switch-org", response_model=SwitchOrganizationResponse)
async def switch_organization(
    request: SwitchOrganizationRequest,
    current_user: dict = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Switch the user's active organization.

    Returns new access and refresh tokens with the updated organization context.
    The old tokens remain valid until their expiration.
    """
    try:
        result = await auth_service.switch_organization(
            user_id=current_user["id"],
            target_org_id=request.organization_id,
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot switch to this organization",
            )

        return SwitchOrganizationResponse(
            access_token=result["access_token"],
            refresh_token=result["refresh_token"],
            token_type=result["token_type"],
            expires_in=result["expires_in"],
            active_organization=OrganizationMembership(**result["active_organization"]),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )
