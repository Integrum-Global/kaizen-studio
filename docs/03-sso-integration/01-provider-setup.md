# Provider Setup

## Azure AD

### 1. Register Application

1. Go to Azure Portal > Azure Active Directory > App registrations
2. Click "New registration"
3. Configure:
   - Name: "Kaizen Studio"
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: `https://your-api.com/api/v1/sso/callback`

### 2. Configure Application

1. Go to "Certificates & secrets"
2. Create new client secret
3. Copy the secret value immediately

### 3. API Permissions

Add permissions:
- `openid` (delegated)
- `email` (delegated)
- `profile` (delegated)

### 4. Configure in Kaizen Studio

```bash
curl -X POST https://api.kaizen-studio.com/api/v1/sso/connections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "azure",
    "client_id": "your-application-id",
    "client_secret": "your-client-secret",
    "tenant_id": "your-tenant-id",
    "is_default": true,
    "auto_provision": true,
    "default_role": "developer",
    "allowed_domains": "yourcompany.com"
  }'
```

## Google Workspace

### 1. Create OAuth Client

1. Go to Google Cloud Console > APIs & Services > Credentials
2. Click "Create Credentials" > "OAuth client ID"
3. Configure:
   - Application type: "Web application"
   - Name: "Kaizen Studio"
   - Authorized redirect URIs: `https://your-api.com/api/v1/sso/callback`

### 2. Configure Consent Screen

1. Go to "OAuth consent screen"
2. Select "Internal" for Workspace
3. Add scopes: `email`, `profile`, `openid`

### 3. Configure in Kaizen Studio

```bash
curl -X POST https://api.kaizen-studio.com/api/v1/sso/connections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "client_id": "your-client-id.apps.googleusercontent.com",
    "client_secret": "your-client-secret",
    "is_default": true,
    "auto_provision": true,
    "default_role": "developer",
    "allowed_domains": "yourcompany.com"
  }'
```

## Okta

### 1. Create Application

1. Go to Okta Admin > Applications > Create App Integration
2. Select "OIDC - OpenID Connect" and "Web Application"
3. Configure:
   - App name: "Kaizen Studio"
   - Sign-in redirect URIs: `https://your-api.com/api/v1/sso/callback`
   - Sign-out redirect URIs: `https://your-app.com/logout`

### 2. Assign Users

1. Go to Assignments tab
2. Assign users or groups

### 3. Configure in Kaizen Studio

```bash
curl -X POST https://api.kaizen-studio.com/api/v1/sso/connections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "okta",
    "client_id": "your-client-id",
    "client_secret": "your-client-secret",
    "domain": "yourcompany.okta.com",
    "is_default": true,
    "auto_provision": true,
    "default_role": "developer"
  }'
```

## Auth0

### 1. Create Application

1. Go to Auth0 Dashboard > Applications > Create Application
2. Select "Regular Web Applications"
3. Configure:
   - Name: "Kaizen Studio"
   - Allowed Callback URLs: `https://your-api.com/api/v1/sso/callback`

### 2. Configure in Kaizen Studio

```bash
curl -X POST https://api.kaizen-studio.com/api/v1/sso/connections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "auth0",
    "client_id": "your-client-id",
    "client_secret": "your-client-secret",
    "domain": "yourcompany.auth0.com",
    "is_default": true,
    "auto_provision": true,
    "default_role": "developer"
  }'
```

## Custom OIDC Provider

For any OIDC-compliant provider:

```bash
curl -X POST https://api.kaizen-studio.com/api/v1/sso/connections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "custom",
    "client_id": "your-client-id",
    "client_secret": "your-client-secret",
    "custom_authorize_url": "https://idp.example.com/authorize",
    "custom_token_url": "https://idp.example.com/token",
    "custom_userinfo_url": "https://idp.example.com/userinfo",
    "is_default": true,
    "auto_provision": true,
    "default_role": "developer"
  }'
```

## Testing SSO

### Initiate Flow

```bash
# Get authorization URL
curl https://api.kaizen-studio.com/api/v1/sso/auth/{connection_id}

# Browser redirects to IdP, then back to callback
```

### Link Existing Account

```bash
curl -X POST https://api.kaizen-studio.com/api/v1/sso/link \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "connection_id": "conn-123",
    "code": "oauth-code-from-callback"
  }'
```

## Troubleshooting

### Invalid Redirect URI

Ensure the callback URL exactly matches what's configured in your IdP.

### Token Exchange Failed

Check client secret is correct and not expired.

### User Not Provisioned

Verify `auto_provision: true` and user's email domain is in `allowed_domains`.

### CORS Errors

The SSO flow uses redirects, not AJAX. Ensure browser handles redirects.
