# TODO-003: SSO Integration

**Status**: PENDING
**Priority**: HIGH
**Estimated Effort**: 5 days (Week 3)
**Phase**: 1 - Foundation
**Pillar**: GOVERN

---

## Objective

Implement SSO integration supporting Azure AD, Okta, Google Workspace, and generic SAML 2.0/OIDC providers with JIT provisioning.

---

## Acceptance Criteria

### Backend
- [ ] SSOConfiguration DataFlow model
- [ ] Azure AD integration (OIDC)
- [ ] Okta integration (OIDC)
- [ ] Google Workspace integration
- [ ] SAML 2.0 generic handler
- [ ] OIDC generic handler
- [ ] JIT (Just-In-Time) provisioning
- [ ] Role mapping from IdP groups

### Frontend
- [ ] SSO configuration wizard
- [ ] SSO login flow
- [ ] Domain verification UI
- [ ] Provider test connection

---

## Technical Approach

### DataFlow Models
```python
@db.model
class SSOConfiguration:
    id: str
    organization_id: str
    provider_type: str  # azure_ad, okta, google, saml, oidc
    name: str
    is_enabled: bool
    config_encrypted: str  # JSON blob (encrypted)
    jit_enabled: bool
    default_role: str
    role_mappings: dict  # {"Azure-Admins": "admin"}
    allowed_domains: dict  # ["acme.com"]
```

### Libraries
- `python-saml` for SAML 2.0
- `authlib` for OIDC
- `msal` for Azure AD (optional, can use OIDC)

### Flow
1. Admin configures SSO in wizard
2. User clicks "Sign in with SSO"
3. Redirect to IdP
4. IdP callback with assertion/token
5. Validate and extract user info
6. JIT provision if new user
7. Map roles from IdP groups
8. Create session

---

## Dependencies

- TODO-002: User & Organization Management (User model, invitation system)

---

## Risk Assessment

- **HIGH**: SSO provider complexity - Mitigation: Start with Google OAuth (simplest), add others progressively
- **HIGH**: SAML debugging difficulty - Mitigation: Use detailed logging, test with Okta dev account
- **MEDIUM**: Certificate management - Mitigation: Use Vault for secure storage
- **LOW**: JIT race conditions - Mitigation: Use database transactions

---

## Subtasks

### Day 1: SSO Foundation
- [ ] Implement SSOConfiguration DataFlow model (Est: 2h)
- [ ] Create SSO service base class (Est: 2h)
- [ ] Implement encryption for config storage (Est: 2h)
- [ ] Add SSO configuration API endpoints (Est: 2h)

### Day 2: OIDC Providers
- [ ] Implement Google Workspace OIDC (Est: 3h)
- [ ] Implement Azure AD OIDC (Est: 3h)
- [ ] Implement Okta OIDC (Est: 2h)

### Day 3: SAML 2.0
- [ ] Implement SAML 2.0 handler (Est: 4h)
- [ ] Add SP metadata generation (Est: 2h)
- [ ] Add IdP metadata parsing (Est: 2h)

### Day 4: JIT Provisioning
- [ ] Implement JIT user creation (Est: 2h)
- [ ] Implement role mapping logic (Est: 2h)
- [ ] Add domain restriction checking (Est: 2h)
- [ ] Handle user updates on re-login (Est: 2h)

### Day 5: Frontend
- [ ] Build SSO configuration wizard (Est: 3h)
- [ ] Implement SSO login flow UI (Est: 2h)
- [ ] Build domain verification UI (Est: 2h)
- [ ] Add provider connection testing (Est: 1h)

---

## Testing Requirements

### Tier 1: Unit Tests
- [ ] SSO configuration validation
- [ ] Token/assertion parsing
- [ ] Role mapping logic
- [ ] Domain restriction checks

### Tier 2: Integration Tests
- [ ] Full OIDC flow with mock IdP
- [ ] SAML assertion validation
- [ ] JIT provisioning with database
- [ ] Encrypted config storage/retrieval

### Tier 3: E2E Tests
- [ ] Azure AD login flow (with test tenant)
- [ ] Okta login flow (with dev account)
- [ ] Google login flow
- [ ] JIT provisioning end-to-end

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All tests passing (3-tier strategy)
- [ ] Azure AD integration tested
- [ ] JIT provisioning working
- [ ] SSO wizard complete
- [ ] Code review completed

---

## Related Documentation

- [06-enterprise-saas-product.md](../../docs/implement/06-enterprise-saas-product.md) - SSO requirements
- [07-enterprise-dataflow-models.md](../../docs/implement/07-enterprise-dataflow-models.md) - SSOConfiguration model
- [08-implementation-roadmap.md](../../docs/implement/08-implementation-roadmap.md) - Week 3 tasks
