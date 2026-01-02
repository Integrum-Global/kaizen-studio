# Teams & Invitations

## Teams

### Overview

Teams group users within an organization for collaboration and access control.

### Model

```python
@db.model
class Team:
    id: str
    organization_id: str
    name: str
    description: Optional[str]
    created_at: str
    updated_at: str

@db.model
class TeamMembership:
    id: str
    team_id: str
    user_id: str
    role: str  # team_lead, member
    created_at: str
```

### API Endpoints

#### Create Team

```bash
POST /api/v1/teams
```

```json
{
  "name": "AI Platform Team",
  "description": "Core platform development"
}
```

#### Get Team with Members

```bash
GET /api/v1/teams/{id}
```

Returns team with nested members array.

#### Add Member

```bash
POST /api/v1/teams/{id}/members
```

```json
{
  "user_id": "user-123",
  "role": "member"
}
```

#### Remove Member

```bash
DELETE /api/v1/teams/{id}/members/{user_id}
```

#### Update Member Role

```bash
PUT /api/v1/teams/{id}/members/{user_id}
```

```json
{
  "role": "team_lead"
}
```

### Service Operations

```python
from studio.services.team_service import TeamService

service = TeamService()

# Create team
team = await service.create(
    name="AI Platform Team",
    organization_id=org.id,
    description="Core platform development"
)

# Add member
membership = await service.add_member(
    team_id=team["id"],
    user_id=user.id,
    role="member"
)

# Get team with members
team = await service.get_with_members(team["id"])
# Returns: {"id": "...", "name": "...", "members": [...]}

# Update member role
await service.update_member_role(
    team_id=team["id"],
    user_id=user.id,
    role="team_lead"
)

# Remove member
await service.remove_member(team["id"], user.id)
```

## Invitations

### Overview

Invitations allow organization admins to invite new users via email.

### Model

```python
@db.model
class Invitation:
    id: str
    organization_id: str
    email: str
    role: str
    invited_by: str
    token: str              # Secure random token
    status: str             # pending, accepted, expired
    expires_at: str         # 7 days from creation
    created_at: str
```

### Invitation Flow

```
1. Admin creates invitation
2. System sends email with token link
3. User clicks link, creates account
4. Invitation marked as accepted
```

### API Endpoints

#### Create Invitation

```bash
POST /api/v1/invitations
```

```json
{
  "email": "newuser@example.com",
  "role": "developer"
}
```

#### List Pending Invitations

```bash
GET /api/v1/invitations?status=pending
```

#### Accept Invitation

```bash
POST /api/v1/invitations/{token}/accept
```

```json
{
  "name": "John Doe",
  "password": "SecurePass123!"
}
```

Creates user account with invited role and organization.

#### Cancel Invitation

```bash
DELETE /api/v1/invitations/{id}
```

### Service Operations

```python
from studio.services.invitation_service import InvitationService

service = InvitationService()

# Create invitation
invitation = await service.create(
    organization_id=org.id,
    email="newuser@example.com",
    role="developer",
    invited_by=current_user.id
)

# Get by token (for accept flow)
invitation = await service.get_by_token(token)

# Accept invitation
user = await service.accept(
    token=token,
    name="John Doe",
    password="SecurePass123!"
)

# Cancel invitation
await service.cancel(invitation["id"])

# Cleanup expired
count = await service.cleanup_expired()
```

### Token Generation

```python
import secrets

def generate_invitation_token() -> str:
    return secrets.token_urlsafe(32)
```

### Expiration Handling

Invitations expire after 7 days:

```python
from datetime import datetime, timedelta

expires_at = (datetime.utcnow() + timedelta(days=7)).isoformat()

# Check expiration
def is_expired(invitation: dict) -> bool:
    expires_at = datetime.fromisoformat(invitation["expires_at"])
    return datetime.utcnow() > expires_at
```

### Email Integration

```python
async def send_invitation_email(invitation: dict, org_name: str):
    link = f"{settings.FRONTEND_URL}/invite/{invitation['token']}"

    await email_service.send(
        to=invitation["email"],
        subject=f"You're invited to join {org_name}",
        template="invitation",
        context={
            "org_name": org_name,
            "role": invitation["role"],
            "link": link,
            "expires_at": invitation["expires_at"]
        }
    )
```

## Best Practices

### Teams

1. **Limit team size** - 10-15 members for effective collaboration
2. **Clear ownership** - every team has at least one team_lead
3. **Document purpose** - use description field

### Invitations

1. **Verify email domain** - for enterprise, restrict to org domain
2. **Rate limit** - prevent invitation spam
3. **Audit trail** - log who invited whom
4. **Re-invite flow** - allow resending expired invitations
