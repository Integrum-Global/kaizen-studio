# TODO-004: Basic RBAC

**Status**: PENDING
**Priority**: HIGH
**Estimated Effort**: 5 days (Week 4)
**Phase**: 1 - Foundation
**Pillar**: GOVERN

---

## Objective

Implement basic Role-Based Access Control with built-in roles, permission checking middleware, and API key management.

---

## Acceptance Criteria

### Backend
- [ ] Policy DataFlow model and engine
- [ ] Built-in roles: owner, admin, developer, operator, viewer
- [ ] Permission checking middleware
- [ ] API key management with scopes
- [ ] Permission denied error handling

### Frontend
- [ ] Role assignment UI
- [ ] API key management page
- [ ] Permission denied handling in UI

---

## Technical Approach

### Built-in Roles & Permissions

| Role | Permissions |
|------|-------------|
| org_owner | Full organization control, billing |
| org_admin | Manage users, settings, agents |
| developer | Create/edit agents, deploy to dev |
| operator | Deploy/monitor, view all |
| viewer | Read-only access |

### DataFlow Models
```python
@db.model
class Policy:
    id: str
    organization_id: str
    name: str
    description: str
    policy_type: str  # rbac
    rules_yaml: str
    is_system: bool
    is_enabled: bool
    priority: int

@db.model
class APIKey:
    id: str
    organization_id: str
    user_id: Optional[str]
    name: str
    key_hash: str
    key_prefix: str
    scopes: dict
    expires_at: Optional[str]
    is_active: bool
```

### Middleware Pattern
```python
from functools import wraps

def require_permission(resource: str, action: str):
    def decorator(f):
        @wraps(f)
        async def wrapper(*args, **kwargs):
            user = get_current_user()
            if not policy_engine.check(user, resource, action):
                raise HTTPException(403, "Permission denied")
            return await f(*args, **kwargs)
        return wrapper
    return decorator

@app.get("/api/v1/agents")
@require_permission("agent", "read")
async def list_agents():
    ...
```

---

## Dependencies

- TODO-002: User & Organization Management (User model, roles)

---

## Risk Assessment

- **MEDIUM**: Permission caching complexity - Mitigation: Use Redis with short TTL
- **MEDIUM**: API key security - Mitigation: Hash keys, never return full key after creation
- **LOW**: Role hierarchy confusion - Mitigation: Document clearly, keep hierarchy flat

---

## Subtasks

### Day 1: RBAC Foundation
- [ ] Implement Policy DataFlow model (Est: 2h)
- [ ] Create built-in role policies (Est: 2h)
- [ ] Implement permission checking logic (Est: 3h)
- [ ] Add permission caching with Redis (Est: 1h)

### Day 2: Permission Middleware
- [ ] Create permission decorator (Est: 2h)
- [ ] Implement role inheritance (Est: 2h)
- [ ] Add resource-level permissions (Est: 2h)
- [ ] Handle team-level permissions (Est: 2h)

### Day 3: API Key Management
- [ ] Implement APIKey DataFlow model (Est: 2h)
- [ ] Create API key generation endpoint (Est: 2h)
- [ ] Implement API key authentication (Est: 2h)
- [ ] Add scope validation (Est: 2h)

### Day 4: Backend Integration
- [ ] Apply permissions to existing endpoints (Est: 4h)
- [ ] Add permission audit logging (Est: 2h)
- [ ] Implement permission denied responses (Est: 2h)

### Day 5: Frontend
- [ ] Build role assignment UI (Est: 2h)
- [ ] Build API key management page (Est: 3h)
- [ ] Handle 403 errors gracefully (Est: 2h)
- [ ] Add permission indicators in UI (Est: 1h)

---

## Testing Requirements

### Tier 1: Unit Tests
- [ ] Policy evaluation logic
- [ ] Role hierarchy resolution
- [ ] API key hash validation
- [ ] Scope checking

### Tier 2: Integration Tests
- [ ] Permission middleware with real database
- [ ] API key authentication flow
- [ ] Role assignment and propagation
- [ ] Permission caching behavior

### Tier 3: E2E Tests
- [ ] User with different roles accessing endpoints
- [ ] API key creation and usage
- [ ] Permission denied scenarios
- [ ] Role changes affecting access immediately

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All tests passing (3-tier strategy)
- [ ] All endpoints protected by permissions
- [ ] RBAC blocks unauthorized actions
- [ ] API keys can be created and used
- [ ] <100ms API response times maintained
- [ ] Code review completed

---

## Related Documentation

- [06-enterprise-saas-product.md](../../docs/implement/06-enterprise-saas-product.md) - RBAC/ABAC specification
- [07-enterprise-dataflow-models.md](../../docs/implement/07-enterprise-dataflow-models.md) - Policy, APIKey models
- [08-implementation-roadmap.md](../../docs/implement/08-implementation-roadmap.md) - Week 4 tasks
