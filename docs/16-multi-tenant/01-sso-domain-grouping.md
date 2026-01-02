# SSO Domain Grouping

## What It Is

SSO Domain Grouping ensures that users from the same email domain are automatically grouped into the same organization when they sign in via SSO (Microsoft, Google, Okta).

## How It Works

### First User From Domain

When the first user from `company.com` signs in via SSO:

1. System checks if any organization has `company.com` as a verified domain
2. No match found → Creates new organization
3. User becomes `tenant_admin` of the new organization
4. `OrganizationDomain` record created for `company.com` with `auto_join_enabled=true`

### Subsequent Users From Same Domain

When additional users from `company.com` sign in:

1. System checks if any organization has `company.com` as a verified domain
2. Match found → User joins existing organization
3. User gets `default_role` from `OrganizationDomain` (typically `developer`)

## SSO Provisioning Flow

```python
async def _provision_sso_user(sso_user: dict, auth_service: AuthService) -> dict:
    """
    SSO Domain Grouping Logic:
    1. Check if user identity already exists → return existing user
    2. Check if user with same email exists → link SSO identity
    3. Check if organization exists for email domain → join existing org
    4. First user from domain → create new org as tenant_admin
    """
```

### Step 1: Check Existing Identity
```python
# Find by provider + provider_user_id
identity = await find_user_identity(provider, provider_user_id)
if identity:
    return get_user_by_id(identity.user_id)
```

### Step 2: Check Existing Email
```python
# Find user with same email
user = await find_user_by_email(sso_user["email"])
if user:
    # Link SSO identity to existing account
    await create_user_identity(user.id, sso_user)
    return user
```

### Step 3: Check Domain-Based Organization
```python
# Extract domain from email
email_domain = sso_user["email"].split("@")[1]

# Check OrganizationDomain table
org = await find_org_by_domain(email_domain)
if org and org.auto_join_enabled:
    # Create user in existing org with default role
    return await create_user_in_org(sso_user, org, org.default_role)
```

### Step 4: Create New Organization
```python
# First user from domain - create new org
org = await create_organization(
    name=f"{email_domain} Organization",
    sso_domain=email_domain,
    allow_domain_join=True
)

# Create user as tenant_admin
user = await create_user(sso_user, org, role="tenant_admin")

# Create domain record for auto-join
await create_organization_domain(
    org_id=org.id,
    domain=email_domain,
    auto_join_enabled=True,
    default_role="developer"
)
```

## Domain Verification

Domains can be verified through:

| Method | Description |
|--------|-------------|
| `sso` | Auto-verified when first SSO user creates org |
| `dns_txt` | TXT record verification |
| `email` | Email to admin@domain.com |
| `manual` | Super-admin approval |

## Configuration

### Enable/Disable Domain Auto-Join

```python
# Via Organization model
organization.allow_domain_join = True  # Enable
organization.allow_domain_join = False # Disable

# Via OrganizationDomain model
domain.auto_join_enabled = True  # Enable
domain.auto_join_enabled = False # Disable
```

### Set Default Role for New Members

```python
# Default role for users joining via domain match
domain.default_role = "developer"  # or "viewer"
```

## Related Files

- `src/studio/api/sso.py` - SSO provisioning logic
- `src/studio/models/organization_domain.py` - Domain model
- `src/studio/models/user_organization.py` - Junction table
