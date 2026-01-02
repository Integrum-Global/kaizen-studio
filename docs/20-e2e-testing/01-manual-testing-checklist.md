# Kaizen Studio Manual Testing Checklist

## Overview

This manual testing checklist provides step-by-step verification procedures for all user workflows in Kaizen Studio. Each section is organized by user persona and includes the **value proposition context** (user story) before each set of verification steps.

**How to Use This Checklist:**
1. Log in as the appropriate user persona
2. Read the user story to understand the value being delivered
3. Execute each step and verify the expected outcome
4. Mark each checkbox when verified
5. Note any issues in the "Issues Found" section

---

## Prerequisites

Before testing, ensure:
- [ ] Application is running at http://localhost:3000 (frontend)
- [ ] Backend API is running at http://localhost:8000
- [ ] Database is initialized with test data
- [ ] Test users exist for each persona:
  - Developer: `developer@example.com`
  - Org Admin: `admin@example.com`
  - Org Owner: `owner@example.com`

---

## Part 1: Developer Persona Testing

### Test Session Setup
- [ ] Open browser in incognito/private mode
- [ ] Navigate to application URL
- [ ] Prepare to log in as Developer user

---

### 1.1 Authentication and Session Management

**User Story:**
> As a Developer, I want to securely log in to Kaizen Studio so that I can access my development workspace and manage my AI agents without compromising security.

**Value Being Tested:**
- Secure, seamless authentication experience
- Session persistence across browser sessions
- Clear feedback on authentication status

#### Steps to Verify:

**Login Flow:**
- [ ] Navigate to `/login`
- [ ] Verify login page displays clearly with:
  - [ ] Page heading ("Login" or "Sign In")
  - [ ] Email input field
  - [ ] Password input field
  - [ ] Submit button
- [ ] Enter valid credentials
- [ ] Click "Sign In"
- [ ] Verify:
  - [ ] Loading indicator appears during authentication
  - [ ] Redirected to dashboard within 3 seconds
  - [ ] User name/email visible in header or sidebar

**Session Persistence:**
- [ ] While logged in, refresh the browser
- [ ] Verify:
  - [ ] Still on dashboard (not redirected to login)
  - [ ] User context still available

**Invalid Credentials:**
- [ ] Log out (if logged in)
- [ ] Try to log in with invalid email
- [ ] Verify: Clear error message displayed
- [ ] Try to log in with wrong password
- [ ] Verify: Clear error message displayed

**Logout:**
- [ ] Click logout button/link
- [ ] Verify:
  - [ ] Redirected to login page
  - [ ] Cannot access dashboard without re-login

**Issues Found:**
```
(Document any issues here)
```

---

### 1.2 AI Agent Creation and Management

**User Story:**
> As a Developer, I want to create, configure, and manage AI agents so that I can build intelligent automation solutions for my organization's needs.

**Value Being Tested:**
- Visual agent configuration eliminates manual coding
- Template library accelerates development
- Real-time validation prevents configuration errors

#### Steps to Verify:

**Agent List View:**
- [ ] Navigate to `/agents`
- [ ] Verify:
  - [ ] Page heading displays "Agents"
  - [ ] Create Agent button is visible
  - [ ] Agent list or empty state is shown
  - [ ] Search/filter input is available

**Create New Agent:**
- [ ] Click "Create Agent" button
- [ ] Verify wizard/form opens with:
  - [ ] Agent name field
  - [ ] Agent type selection (chat, completion, embedding, custom)
  - [ ] AI provider selection
  - [ ] Model configuration options
- [ ] Enter agent name: "Test Customer Support Agent"
- [ ] Select agent type: "chat"
- [ ] Select provider: (first available)
- [ ] Click Create/Save
- [ ] Verify:
  - [ ] Agent created successfully
  - [ ] Redirected to agent detail or list
  - [ ] New agent appears in list

**View Agent Details:**
- [ ] Click on the created agent
- [ ] Verify:
  - [ ] Agent detail page loads
  - [ ] Agent name displayed
  - [ ] Configuration tabs/sections visible (Settings, Tools, Metrics)
  - [ ] Back navigation available

**Edit Agent:**
- [ ] Click Edit or navigate to Settings tab
- [ ] Change agent description
- [ ] Save changes
- [ ] Verify: Changes saved and reflected

**Delete Agent:**
- [ ] Click delete button/option
- [ ] Verify confirmation dialog appears
- [ ] Confirm deletion
- [ ] Verify: Agent removed from list

**Issues Found:**
```
(Document any issues here)
```

---

### 1.3 Pipeline Design and Orchestration

**User Story:**
> As a Developer, I want to design multi-step AI pipelines using a visual canvas so that I can orchestrate complex workflows without writing deployment code.

**Value Being Tested:**
- Visual workflow design reduces complexity
- Drag-and-drop interface enables rapid prototyping
- Real-time validation ensures pipeline correctness

#### Steps to Verify:

**Pipeline List View:**
- [ ] Navigate to `/pipelines`
- [ ] Verify:
  - [ ] Page heading displays "Pipelines"
  - [ ] Create Pipeline button is visible
  - [ ] Pipeline list or empty state shown

**Create New Pipeline:**
- [ ] Click "Create Pipeline"
- [ ] Verify pipeline canvas/form opens
- [ ] Enter pipeline name: "Test Data Processing Pipeline"
- [ ] Save/create pipeline
- [ ] Verify: Pipeline created and visible in list

**Pipeline Canvas (if available):**
- [ ] Open existing pipeline
- [ ] Verify canvas displays with:
  - [ ] Node palette
  - [ ] Canvas area for workflow design
  - [ ] Zoom/pan controls
- [ ] Add a node (if applicable)
- [ ] Connect nodes (if applicable)
- [ ] Save pipeline
- [ ] Verify: Changes saved successfully

**Issues Found:**
```
(Document any issues here)
```

---

### 1.4 Deployment and Environment Management

**User Story:**
> As a Developer, I want to deploy my agents and pipelines to different environments so that I can safely test changes before production release.

**Value Being Tested:**
- Environment isolation prevents production incidents
- Promotion workflows enable controlled releases
- Rollback capability ensures quick recovery

#### Steps to Verify:

**Deployment Dashboard:**
- [ ] Navigate to `/deployments`
- [ ] Verify:
  - [ ] Deployment list/dashboard displays
  - [ ] Environment indicators visible (dev/staging/production)
  - [ ] Deployment status shown

**Create Deployment (if applicable):**
- [ ] Click Create/Deploy button
- [ ] Select pipeline/agent to deploy
- [ ] Select target environment
- [ ] Configure settings
- [ ] Click Deploy
- [ ] Verify:
  - [ ] Deployment initiated
  - [ ] Progress indicator shown
  - [ ] Completion status displayed

**Issues Found:**
```
(Document any issues here)
```

---

### 1.5 Connector Integration

**User Story:**
> As a Developer, I want to use pre-built connectors for external services so that I can integrate my AI agents with enterprise systems without building custom integrations.

**Value Being Tested:**
- Pre-built connectors save development time
- Secure credential management protects secrets
- Connection testing ensures reliability

#### Steps to Verify:

**Connector List:**
- [ ] Navigate to `/connectors` or Integrations page
- [ ] Verify:
  - [ ] Connector catalog displays
  - [ ] Categories visible (Database, API, Cloud, etc.)
  - [ ] Add/Create button available

**Create Connector:**
- [ ] Click Add Connector
- [ ] Select connector type (e.g., PostgreSQL)
- [ ] Enter connection details
- [ ] Test connection
- [ ] Verify: Connection test result displayed
- [ ] Save connector
- [ ] Verify: Connector saved and listed

**Issues Found:**
```
(Document any issues here)
```

---

### 1.6 Observability and Metrics

**User Story:**
> As a Developer, I want to monitor my agents' performance and behavior so that I can identify issues and optimize their operation proactively.

**Value Being Tested:**
- Real-time visibility into agent behavior
- Performance metrics enable optimization
- Alert notifications prevent SLA breaches

#### Steps to Verify:

**Metrics Dashboard:**
- [ ] Navigate to `/observability`, `/metrics`, or `/monitoring`
- [ ] Verify:
  - [ ] Dashboard loads within 3 seconds
  - [ ] Key metrics displayed (latency, usage, errors)
  - [ ] Time range selector available

**View Specific Metrics:**
- [ ] Select an agent (if applicable)
- [ ] View latency metrics
- [ ] View token usage
- [ ] View error rates
- [ ] Verify: Data updates in reasonable time

**Issues Found:**
```
(Document any issues here)
```

---

### 1.7 API Key Management

**User Story:**
> As a Developer, I want to manage API keys for my applications so that I can securely integrate with Kaizen Studio programmatically.

**Value Being Tested:**
- Self-service API key management
- Granular permission scoping
- Key rotation without downtime

#### Steps to Verify:

**API Key List:**
- [ ] Navigate to Settings > API Keys
- [ ] Verify:
  - [ ] API key list displays
  - [ ] Create API Key button visible
  - [ ] Existing keys shown (if any)

**Create API Key:**
- [ ] Click "Create API Key"
- [ ] Enter key name: "Test Integration Key"
- [ ] Select permissions
- [ ] Generate key
- [ ] Verify:
  - [ ] Key displayed only once
  - [ ] Copy to clipboard works
  - [ ] Key appears in list

**Revoke API Key:**
- [ ] Select a key to revoke
- [ ] Click Revoke/Delete
- [ ] Confirm action
- [ ] Verify: Key removed from list

**Issues Found:**
```
(Document any issues here)
```

---

## Part 2: Org Admin Persona Testing

### Test Session Setup
- [ ] Log out from previous session
- [ ] Log in as Org Admin user

---

### 2.1 Admin Authentication

**User Story:**
> As an Org Admin, I want to access the administrative console so that I can manage organizational settings and user access.

**Value Being Tested:**
- Centralized administrative control
- Role-based access to admin functions
- Audit trail of administrative actions

#### Steps to Verify:

- [ ] Log in as admin user
- [ ] Verify:
  - [ ] Dashboard loads
  - [ ] Admin menu items visible (Users, Teams, Settings)
  - [ ] Access to admin-only features

**Issues Found:**
```
(Document any issues here)
```

---

### 2.2 User Management

**User Story:**
> As an Org Admin, I want to manage user accounts and access so that I can control who can access the platform and what they can do.

**Value Being Tested:**
- Centralized user lifecycle management
- Self-service reduces admin burden
- Audit compliance maintained

#### Steps to Verify:

**User Directory:**
- [ ] Navigate to Users page
- [ ] Verify:
  - [ ] User list displays
  - [ ] Search/filter functionality
  - [ ] User details visible (name, email, role)

**Invite New User:**
- [ ] Click "Invite User"
- [ ] Enter email: `testuser@example.com`
- [ ] Select role
- [ ] Send invitation
- [ ] Verify: Invitation sent confirmation

**Edit User Role:**
- [ ] Select existing user
- [ ] Change role
- [ ] Save changes
- [ ] Verify: Role updated

**Issues Found:**
```
(Document any issues here)
```

---

### 2.3 Team Management

**User Story:**
> As an Org Admin, I want to organize users into teams so that I can manage permissions and resources at the team level for better governance.

**Value Being Tested:**
- Team-based access control simplifies management
- Resource sharing within teams
- Clear organizational structure

#### Steps to Verify:

**Team List:**
- [ ] Navigate to `/teams`
- [ ] Verify:
  - [ ] Team list displays
  - [ ] Create Team button visible
  - [ ] Team details shown (name, member count)

**Create Team:**
- [ ] Click "Create Team"
- [ ] Enter name: "Engineering Team"
- [ ] Add description
- [ ] Save team
- [ ] Verify: Team created and listed

**Manage Team Members:**
- [ ] Open team details
- [ ] Add member to team
- [ ] Set member role
- [ ] Remove member
- [ ] Verify: Changes reflected

**Issues Found:**
```
(Document any issues here)
```

---

### 2.4 Policy Management (ABAC)

**User Story:**
> As an Org Admin, I want to define attribute-based access policies so that I can enforce fine-grained access control beyond simple roles.

**Value Being Tested:**
- Context-aware access decisions
- Regulatory compliance (SOC2, HIPAA)
- Reduced risk of unauthorized access

#### Steps to Verify:

**Policy List:**
- [ ] Navigate to Policies/Governance page
- [ ] Verify:
  - [ ] Policy list displays
  - [ ] Create Policy option available

**Create Policy (if supported):**
- [ ] Click Create Policy
- [ ] Define policy name and conditions
- [ ] Set allowed actions
- [ ] Save policy
- [ ] Verify: Policy created

**Issues Found:**
```
(Document any issues here)
```

---

### 2.5 SSO Integration

**User Story:**
> As an Org Admin, I want to integrate enterprise SSO so that users can authenticate with their corporate credentials for seamless access.

**Value Being Tested:**
- Single sign-on reduces password fatigue
- Centralized identity management
- Consistent security policies

#### Steps to Verify:

**SSO Configuration:**
- [ ] Navigate to Settings > SSO
- [ ] Verify:
  - [ ] SSO configuration page loads
  - [ ] IdP options available (SAML, OIDC, OAuth)
  - [ ] Configuration fields present

**Configure SSO (if test IdP available):**
- [ ] Select identity provider type
- [ ] Enter configuration details
- [ ] Test connection
- [ ] Verify: Test results displayed

**Issues Found:**
```
(Document any issues here)
```

---

### 2.6 Webhook Configuration

**User Story:**
> As an Org Admin, I want to configure webhooks so that I can integrate Kaizen Studio events with external systems for automation.

**Value Being Tested:**
- Real-time event integration
- Custom automation triggers
- Reliable delivery with retries

#### Steps to Verify:

**Webhook List:**
- [ ] Navigate to `/webhooks`
- [ ] Verify:
  - [ ] Webhook list displays
  - [ ] Create Webhook button visible

**Create Webhook:**
- [ ] Click Create Webhook
- [ ] Enter name: "Test Notification Webhook"
- [ ] Enter URL: `https://webhook.site/test`
- [ ] Select events
- [ ] Save webhook
- [ ] Verify: Webhook created and listed

**Test Webhook:**
- [ ] Select webhook
- [ ] Click Test/Send Test
- [ ] Verify: Test result displayed

**Issues Found:**
```
(Document any issues here)
```

---

### 2.7 Scaling Configuration

**User Story:**
> As an Org Admin, I want to configure auto-scaling policies so that the platform automatically adjusts capacity based on demand.

**Value Being Tested:**
- Cost optimization through right-sizing
- Performance maintained under load
- Automated capacity management

#### Steps to Verify:

**Scaling Dashboard:**
- [ ] Navigate to Settings > Scaling or Infrastructure
- [ ] Verify:
  - [ ] Current resource usage displayed
  - [ ] Scaling configuration options available

**Configure Scaling (if available):**
- [ ] Set min/max instances
- [ ] Configure scaling triggers
- [ ] Save configuration
- [ ] Verify: Settings saved

**Issues Found:**
```
(Document any issues here)
```

---

### 2.8 Audit Log Review

**User Story:**
> As an Org Admin, I want to review audit logs so that I can investigate security incidents and demonstrate compliance.

**Value Being Tested:**
- Complete audit trail
- Incident investigation support
- Compliance evidence

#### Steps to Verify:

**Audit Log Viewer:**
- [ ] Navigate to Audit Logs
- [ ] Verify:
  - [ ] Audit log list displays
  - [ ] Filter options available (date, user, action)
  - [ ] Log entries show meaningful data

**Filter Logs:**
- [ ] Filter by date range
- [ ] Filter by action type
- [ ] Search log content
- [ ] Verify: Filters work correctly

**Export Logs:**
- [ ] Click Export
- [ ] Select format (CSV/JSON)
- [ ] Verify: Export downloads successfully

**Issues Found:**
```
(Document any issues here)
```

---

## Part 3: Org Owner Persona Testing

### Test Session Setup
- [ ] Log out from previous session
- [ ] Log in as Org Owner user

---

### 3.1 Executive Dashboard Access

**User Story:**
> As an Org Owner, I want a high-level executive dashboard so that I can monitor organizational AI initiatives and key metrics at a glance.

**Value Being Tested:**
- Strategic visibility across all AI initiatives
- Investment ROI tracking
- Risk and compliance overview

#### Steps to Verify:

**Executive Dashboard:**
- [ ] Navigate to Dashboard
- [ ] Verify dashboard loads within 3 seconds
- [ ] Verify:
  - [ ] Organization summary displayed
  - [ ] Key metrics visible (agents, pipelines, deployments)
  - [ ] Recent activity section
  - [ ] Compliance status indicators

**Drill-Down Navigation:**
- [ ] Click on a metric card
- [ ] Verify: Navigates to detailed view
- [ ] Use back navigation
- [ ] Verify: Returns to dashboard

**Issues Found:**
```
(Document any issues here)
```

---

### 3.2 Organization Management

**User Story:**
> As an Org Owner, I want to manage my organization's settings and structure so that I can align the platform configuration with business requirements.

**Value Being Tested:**
- Organizational autonomy
- Custom branding and configuration
- Multi-tenant isolation

#### Steps to Verify:

**Organization Settings:**
- [ ] Navigate to Organization Settings
- [ ] Verify:
  - [ ] Organization name editable
  - [ ] Logo/branding options
  - [ ] Default settings configurable

**Update Organization:**
- [ ] Update organization description
- [ ] Save changes
- [ ] Verify: Changes saved and applied

**Issues Found:**
```
(Document any issues here)
```

---

### 3.3 Billing and Cost Management

**User Story:**
> As an Org Owner, I want to manage billing and monitor costs so that I can control AI platform spending and optimize ROI.

**Value Being Tested:**
- Cost visibility and control
- Budget enforcement
- ROI optimization

#### Steps to Verify:

**Billing Dashboard:**
- [ ] Navigate to Billing
- [ ] Verify:
  - [ ] Current month spend displayed
  - [ ] Invoice history accessible
  - [ ] Payment method visible

**View Invoices:**
- [ ] Click on past invoice
- [ ] Verify: Invoice details displayed
- [ ] Download invoice PDF
- [ ] Verify: PDF downloads successfully

**Set Budget Alert (if available):**
- [ ] Configure budget threshold
- [ ] Save settings
- [ ] Verify: Alert configured

**Issues Found:**
```
(Document any issues here)
```

---

### 3.4 Promotion and Discount Management

**User Story:**
> As an Org Owner, I want to apply promotional discounts so that I can benefit from special offers and optimize costs.

**Value Being Tested:**
- Cost savings through promotions
- Volume discount tracking
- Partner program benefits

#### Steps to Verify:

**Promotions Page:**
- [ ] Navigate to Billing > Promotions
- [ ] Verify:
  - [ ] Promotion code entry field
  - [ ] Active promotions listed

**Apply Promotion (if available):**
- [ ] Enter promotion code
- [ ] Apply promotion
- [ ] Verify: Discount applied or error message shown

**Issues Found:**
```
(Document any issues here)
```

---

### 3.5 Role-Based Access Control (RBAC)

**User Story:**
> As an Org Owner, I want to define custom roles and permissions so that I can implement precise access control aligned with organizational structure.

**Value Being Tested:**
- Least privilege enforcement
- Custom role flexibility
- Compliance with access policies

#### Steps to Verify:

**Roles Management:**
- [ ] Navigate to Roles & Permissions
- [ ] Verify:
  - [ ] Predefined roles listed
  - [ ] Custom role creation available

**Create Custom Role (if available):**
- [ ] Click Create Role
- [ ] Enter role name: "Read-Only Analyst"
- [ ] Select permissions (read-only)
- [ ] Save role
- [ ] Verify: Role created

**Assign Role:**
- [ ] Assign new role to test user
- [ ] Verify: Role assignment works

**Issues Found:**
```
(Document any issues here)
```

---

### 3.6 Compliance and Audit Oversight

**User Story:**
> As an Org Owner, I want comprehensive compliance and audit oversight so that I can ensure regulatory compliance and governance.

**Value Being Tested:**
- Regulatory compliance assurance
- Audit readiness
- Risk mitigation

#### Steps to Verify:

**Compliance Dashboard:**
- [ ] Navigate to Compliance/Governance
- [ ] Verify:
  - [ ] Compliance status overview
  - [ ] Framework indicators (SOC2, GDPR)
  - [ ] Audit reports accessible

**Generate Compliance Report (if available):**
- [ ] Select report type
- [ ] Generate report
- [ ] Verify: Report generated successfully

**Issues Found:**
```
(Document any issues here)
```

---

### 3.7 Platform-Wide Metrics and Analytics

**User Story:**
> As an Org Owner, I want platform-wide analytics so that I can make data-driven decisions about AI investments.

**Value Being Tested:**
- Strategic decision support
- Usage optimization insights
- Trend analysis

#### Steps to Verify:

**Analytics Dashboard:**
- [ ] Navigate to Analytics
- [ ] Verify:
  - [ ] Usage trends displayed
  - [ ] Team/project breakdown available
  - [ ] Time range selector works

**Export Analytics:**
- [ ] Select date range
- [ ] Export data
- [ ] Verify: Export successful

**Issues Found:**
```
(Document any issues here)
```

---

### 3.8 API Key Oversight

**User Story:**
> As an Org Owner, I want organization-wide API key oversight so that I can monitor and control programmatic access across all teams.

**Value Being Tested:**
- Centralized access control
- Security visibility
- Usage monitoring

#### Steps to Verify:

**API Key Overview:**
- [ ] Navigate to Settings > API Keys (admin view)
- [ ] Verify:
  - [ ] All organization API keys visible
  - [ ] Usage metrics displayed
  - [ ] Filter by team/user available

**Review Key Usage:**
- [ ] Select an API key
- [ ] View usage metrics
- [ ] Verify: Usage data displayed

**Issues Found:**
```
(Document any issues here)
```

---

## Cross-Cutting Concerns

### Accessibility Testing

**Value Proposition:**
> All users should be able to use Kaizen Studio effectively, regardless of their abilities.

#### Steps to Verify:

**Keyboard Navigation:**
- [ ] Navigate through entire page using only Tab key
- [ ] Verify: All interactive elements focusable
- [ ] Verify: Focus indicators visible

**Screen Reader Compatibility:**
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Verify: Headings announced correctly
- [ ] Verify: Form labels announced

**Color Contrast:**
- [ ] Verify text is readable
- [ ] Verify: Status indicators distinguishable without color alone

**Issues Found:**
```
(Document any issues here)
```

---

### Responsive Design Testing

**Value Proposition:**
> Users should access Kaizen Studio from any device.

#### Steps to Verify:

**Mobile (375px width):**
- [ ] Open DevTools, set viewport to 375x667
- [ ] Navigate to Dashboard
- [ ] Verify:
  - [ ] Content fits viewport
  - [ ] Touch targets are at least 44px
  - [ ] Navigation is accessible (hamburger menu)

**Tablet (768px width):**
- [ ] Set viewport to 768x1024
- [ ] Verify: Layout adapts appropriately

**Desktop (1920px width):**
- [ ] Set viewport to 1920x1080
- [ ] Verify:
  - [ ] Sidebar visible
  - [ ] Full layout utilized

**Issues Found:**
```
(Document any issues here)
```

---

### Performance Testing

**Value Proposition:**
> The platform should respond quickly to user actions.

#### Steps to Verify:

**Page Load Times:**
- [ ] Dashboard loads in < 3 seconds
- [ ] Agent list loads in < 3 seconds
- [ ] Pipeline canvas loads in < 3 seconds

**Navigation Speed:**
- [ ] Navigate between 5 pages
- [ ] Verify: No noticeable lag

**Console Errors:**
- [ ] Open DevTools Console
- [ ] Navigate through main pages
- [ ] Verify: No critical errors

**Issues Found:**
```
(Document any issues here)
```

---

## Test Summary

### Test Session Information
- **Date:** _______________
- **Tester:** _______________
- **Environment:** _______________
- **Browser:** _______________
- **Version:** _______________

### Results Overview

| Section | Total Steps | Passed | Failed | Blocked |
|---------|-------------|--------|--------|---------|
| Developer Auth | | | | |
| Agent Management | | | | |
| Pipeline Design | | | | |
| Deployments | | | | |
| Connectors | | | | |
| Observability | | | | |
| API Keys | | | | |
| Admin Auth | | | | |
| User Management | | | | |
| Team Management | | | | |
| Policy Management | | | | |
| SSO | | | | |
| Webhooks | | | | |
| Scaling | | | | |
| Audit Logs | | | | |
| Executive Dashboard | | | | |
| Org Management | | | | |
| Billing | | | | |
| Promotions | | | | |
| RBAC | | | | |
| Compliance | | | | |
| Analytics | | | | |
| API Key Oversight | | | | |
| Accessibility | | | | |
| Responsive | | | | |
| Performance | | | | |
| **TOTAL** | | | | |

### Critical Issues

```
(List critical issues that block functionality)
```

### Recommendations

```
(List improvement recommendations)
```

### Sign-off

- [ ] All critical paths verified
- [ ] No blocking issues found
- [ ] Ready for release

**Tester Signature:** _______________
**Date:** _______________
