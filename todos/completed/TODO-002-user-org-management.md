# TODO-002: User & Organization Management

**Status**: PENDING
**Priority**: HIGH
**Estimated Effort**: 5 days (Week 2)
**Phase**: 1 - Foundation

---

## Objective

Implement complete user and organization management including CRUD operations, team management, invitation system, and email services.

---

## Acceptance Criteria

### Backend
- [ ] User CRUD operations with DataFlow
- [ ] Organization CRUD operations
- [ ] Team management endpoints
- [ ] Invitation system with email tokens
- [ ] Email service (password reset, invites)

### Frontend
- [ ] Organization settings page
- [ ] User management page
- [ ] Team management page
- [ ] Invite user flow
- [ ] Profile settings page

---

## Technical Approach

### New DataFlow Models
- Team: id, organization_id, name, description, budget_limit_usd
- TeamMembership: id, team_id, user_id, role
- Invitation: id, organization_id, email, token, role, status, expires_at

### API Endpoints
```
# Organizations
GET    /api/v1/organizations/{id}
PUT    /api/v1/organizations/{id}
DELETE /api/v1/organizations/{id}

# Users
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/{id}
PUT    /api/v1/users/{id}
DELETE /api/v1/users/{id}

# Teams
GET    /api/v1/teams
POST   /api/v1/teams
GET    /api/v1/teams/{id}
PUT    /api/v1/teams/{id}
DELETE /api/v1/teams/{id}
POST   /api/v1/teams/{id}/members

# Invitations
POST   /api/v1/invitations
POST   /api/v1/invitations/{token}/accept
DELETE /api/v1/invitations/{id}
```

---

## Dependencies

- TODO-001: Platform Infrastructure (DataFlow, auth)

---

## Risk Assessment

- **MEDIUM**: Email delivery reliability - Mitigation: Use SendGrid/SES with retry logic
- **MEDIUM**: Invitation token security - Mitigation: Use secure random tokens, short expiry
- **LOW**: Team hierarchy complexity - Mitigation: Start with flat team structure

---

## Subtasks

### Day 1: User Management Backend
- [ ] Implement User CRUD with DataFlow (Est: 3h)
- [ ] Add user search and filtering (Est: 2h)
- [ ] Implement user status transitions (Est: 2h)
- [ ] Add user validation and error handling (Est: 1h)

### Day 2: Organization & Team Backend
- [ ] Implement Organization update/delete (Est: 2h)
- [ ] Implement Team model and CRUD (Est: 3h)
- [ ] Implement TeamMembership operations (Est: 2h)
- [ ] Add team budget tracking (Est: 1h)

### Day 3: Invitation System
- [ ] Implement Invitation model (Est: 2h)
- [ ] Create invitation endpoints (Est: 2h)
- [ ] Implement token generation and validation (Est: 2h)
- [ ] Add invitation expiry handling (Est: 2h)

### Day 4: Email Service
- [ ] Set up email service (SendGrid/SES) (Est: 2h)
- [ ] Create email templates (invite, password reset) (Est: 3h)
- [ ] Implement email sending logic (Est: 2h)
- [ ] Add email retry and logging (Est: 1h)

### Day 5: Frontend Implementation
- [ ] Build organization settings page (Est: 2h)
- [ ] Build user management page with table (Est: 2h)
- [ ] Build team management page (Est: 2h)
- [ ] Implement invite user flow (Est: 2h)
- [ ] Build profile settings page (Est: 1h)

---

## Testing Requirements

### Tier 1: Unit Tests
- [ ] User service tests
- [ ] Team service tests
- [ ] Invitation token validation tests
- [ ] Email template tests

### Tier 2: Integration Tests
- [ ] User CRUD with real database
- [ ] Team membership operations
- [ ] Invitation flow end-to-end
- [ ] Email sending (with test mode)

### Tier 3: E2E Tests
- [ ] Complete invitation flow (invite -> email -> accept)
- [ ] Team creation and member assignment
- [ ] User profile update

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All tests passing (3-tier strategy)
- [ ] Users can be invited and onboarded
- [ ] Teams can be created and members assigned
- [ ] Emails sent successfully
- [ ] Code review completed

---

## Related Documentation

- [07-enterprise-dataflow-models.md](../../docs/implement/07-enterprise-dataflow-models.md) - User, Team models
- [08-implementation-roadmap.md](../../docs/implement/08-implementation-roadmap.md) - Week 2 tasks
