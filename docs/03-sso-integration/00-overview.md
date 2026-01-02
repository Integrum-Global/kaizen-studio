# SSO Integration

## Overview

Kaizen Studio supports Single Sign-On (SSO) via OAuth 2.0/OIDC for enterprise identity providers.

## Supported Providers

| Provider | Protocol | Features |
|----------|----------|----------|
| Azure AD | OIDC | Tenant isolation, group claims |
| Google Workspace | OIDC | Domain verification |
| Okta | OIDC | Universal Directory |
| Auth0 | OIDC | Social connections |
| Custom | OAuth 2.0 | Any OIDC-compliant provider |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────>│ Kaizen API  │────>│ IdP (Azure) │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │  Database   │
                    │ - SSO Conn  │
                    │ - Identity  │
                    └─────────────┘
```

## Key Concepts

### SSO Connection

Configuration linking an organization to an identity provider.

```python
@db.model
class SSOConnection:
    id: str
    organization_id: str
    provider: str           # azure, google, okta, custom
    client_id: str
    client_secret_encrypted: str
    tenant_id: Optional[str]
    domain: Optional[str]
    is_default: bool
    auto_provision: bool
    default_role: str
    allowed_domains: Optional[str]
    status: str
```

### User Identity

Links a user to their SSO provider identity.

```python
@db.model
class UserIdentity:
    id: str
    user_id: str
    provider: str
    provider_user_id: str
    email: str
```

## Authentication Flow

1. **Initiate**: User clicks "Sign in with Azure"
2. **Redirect**: API redirects to Azure with state parameter
3. **Authenticate**: User signs in at Azure
4. **Callback**: Azure redirects back with authorization code
5. **Exchange**: API exchanges code for tokens
6. **Userinfo**: API fetches user profile from Azure
7. **Provision**: Create or link user account
8. **JWT**: Issue Kaizen JWT tokens

## Configuration

### Azure AD

```json
{
  "provider": "azure",
  "client_id": "your-client-id",
  "client_secret": "your-client-secret",
  "tenant_id": "your-tenant-id",
  "allowed_domains": "company.com"
}
```

### Google Workspace

```json
{
  "provider": "google",
  "client_id": "your-client-id.apps.googleusercontent.com",
  "client_secret": "your-client-secret",
  "allowed_domains": "company.com"
}
```

### Okta

```json
{
  "provider": "okta",
  "client_id": "your-client-id",
  "client_secret": "your-client-secret",
  "domain": "company.okta.com"
}
```

## Security Features

- **Encrypted Secrets**: Client secrets encrypted with Fernet
- **State Validation**: CSRF protection in OAuth flow
- **Domain Restrictions**: Whitelist allowed email domains
- **Organization Isolation**: Connections scoped to org

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/sso/connections` | POST | Create connection |
| `/api/v1/sso/connections` | GET | List connections |
| `/api/v1/sso/connections/{id}` | GET | Get connection |
| `/api/v1/sso/connections/{id}` | PUT | Update connection |
| `/api/v1/sso/connections/{id}` | DELETE | Delete connection |
| `/api/v1/sso/auth/{id}` | GET | Start SSO flow |
| `/api/v1/sso/callback` | GET | OAuth callback |
| `/api/v1/sso/link` | POST | Link account |

## Best Practices

1. **Use auto-provision** for frictionless onboarding
2. **Restrict domains** to your organization's email domain
3. **Set default role** to least-privilege (developer or viewer)
4. **Enable single connection** as default for users
5. **Audit SSO events** for compliance
