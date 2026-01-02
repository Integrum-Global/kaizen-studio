# Multi-Tenant Architecture Overview

Kaizen Studio supports enterprise multi-tenant SaaS with:
- **SSO Domain Grouping**: Users from the same email domain automatically join the same organization
- **Multi-Organization Support**: Users can belong to multiple organizations and switch between them
- **Role Hierarchy**: Platform-level (super_admin) and organization-level roles

## Architecture

```
Platform Level
├── super_admin (platform-wide access)
│
Organization Level
├── tenant_admin (full org control)
├── org_admin (manage users, teams, resources)
├── developer (create/edit agents, pipelines)
└── viewer (read-only access)
```

## Database Models

### UserOrganization (Junction Table)
Enables users to belong to multiple organizations:

```python
@db.model
class UserOrganization:
    id: str
    user_id: str
    organization_id: str
    role: str           # tenant_admin, org_admin, developer, viewer
    is_primary: bool
    joined_via: str     # invitation, sso, domain_match, created
    joined_at: str
    created_at: str
    updated_at: str
```

### OrganizationDomain
Enables SSO domain-based auto-join:

```python
@db.model
class OrganizationDomain:
    id: str
    organization_id: str
    domain: str              # e.g., "company.com"
    is_verified: bool
    verification_method: str # dns_txt, email, manual, sso
    auto_join_enabled: bool
    default_role: str        # developer, viewer
    created_at: str
    verified_at: str | None
```

### User Model Extensions

```python
# Multi-tenant support fields
is_super_admin: bool = False
primary_organization_id: str | None = None
```

### Organization Model Extensions

```python
# SSO domain grouping fields
sso_domain: str | None = None
allow_domain_join: bool = False
settings: str | None = None  # JSON for org settings
```

## Related Documentation

- [01-sso-domain-grouping.md](./01-sso-domain-grouping.md) - SSO domain-based organization grouping
- [02-multi-organization.md](./02-multi-organization.md) - Multi-organization API and switching
- [03-frontend-integration.md](./03-frontend-integration.md) - Frontend organization switcher
