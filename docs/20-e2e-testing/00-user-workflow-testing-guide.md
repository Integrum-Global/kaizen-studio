# Kaizen Studio User Workflow Testing Guide

## Overview

This document provides comprehensive user workflow testing coverage for Kaizen Studio, organized by user persona with value proposition-driven test scenarios. Each workflow is documented with:

1. **User Story** - What the user wants to accomplish and why
2. **Value Proposition** - Business value delivered by this capability
3. **Step-by-Step Procedure** - Detailed actions and verifications
4. **Success Criteria** - Observable outcomes that confirm the workflow works

---

## User Personas

| Persona | Role | Description | Permissions |
|---------|------|-------------|-------------|
| **Developer** | Business User | Creates and manages AI agents and pipelines | agents:*, deployments:*, pipelines:read, connectors:read/execute |
| **Org Admin** | Administrator | Manages users, teams, policies, and platform configuration | users:*, teams:*, policies:*, webhooks:*, sso:*, scaling:* |
| **Org Owner** | Executive | Organization-wide oversight, billing, compliance, and governance | Full platform access |

---

## Part 1: Developer Workflows

### Workflow 1.1: Authentication and Session Management

**User Story:**
> As a Developer, I want to securely log in to Kaizen Studio so that I can access my development workspace and manage my AI agents without compromising security.

**Value Proposition:**
- Secure access to enterprise AI platform
- Seamless authentication experience
- Session persistence across browser sessions

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to login page | Login form displays with email and password fields |
| 2 | Enter valid credentials | Fields accept input, password is masked |
| 3 | Click "Sign In" button | Loading indicator appears |
| 4 | Verify redirect | Dashboard loads with user's name displayed |
| 5 | Check session persistence | Refresh browser - session maintained |
| 6 | Test logout | Click logout - redirected to login page |
| 7 | Verify session cleared | Cannot access dashboard without re-login |

**Success Criteria:**
- [ ] Login completes within 3 seconds
- [ ] JWT token stored securely
- [ ] User context available in header
- [ ] Invalid credentials show clear error message
- [ ] Session timeout handled gracefully

---

### Workflow 1.2: AI Agent Creation and Management

**User Story:**
> As a Developer, I want to create, configure, and manage AI agents so that I can build intelligent automation solutions for my organization's needs.

**Value Proposition:**
- Visual agent configuration eliminates manual coding
- Template library accelerates development
- Real-time validation prevents configuration errors

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Agents page | Agent list displays with existing agents |
| 2 | Click "Create Agent" button | Agent creation wizard opens |
| 3 | Enter agent name | Name field validates (unique, no special chars) |
| 4 | Select agent type | Options: chat, completion, embedding, custom |
| 5 | Choose AI provider | Options: Azure AI Foundry, Docker Model Runner, OpenAI |
| 6 | Configure model settings | Model selection, temperature, max tokens |
| 7 | Add system prompt | Rich text editor with variable support |
| 8 | Set input/output schema | JSON schema editor with validation |
| 9 | Click "Create" | Agent created, redirected to agent detail page |
| 10 | Verify agent appears in list | Agent visible with correct status (draft) |
| 11 | Edit agent configuration | Changes save successfully |
| 12 | Delete agent | Confirmation dialog, agent removed from list |

**Success Criteria:**
- [ ] Agent creation wizard is intuitive (< 5 clicks)
- [ ] Validation errors display inline
- [ ] Agent list supports pagination and filtering
- [ ] Agent status accurately reflects lifecycle state
- [ ] Duplicate agent names rejected with clear message

---

### Workflow 1.3: Pipeline Design and Orchestration

**User Story:**
> As a Developer, I want to design multi-step AI pipelines using a visual canvas so that I can orchestrate complex workflows without writing deployment code.

**Value Proposition:**
- Visual workflow design reduces complexity
- Drag-and-drop interface enables rapid prototyping
- Real-time validation ensures pipeline correctness

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Pipelines page | Pipeline list displays |
| 2 | Click "Create Pipeline" | Pipeline canvas opens with empty workspace |
| 3 | Add start node | Start node placed on canvas |
| 4 | Drag agent from palette | Agent node added to canvas |
| 5 | Connect start to agent | Connection line drawn between nodes |
| 6 | Add conditional branch | Decision node placed, branches created |
| 7 | Configure node parameters | Node properties panel updates |
| 8 | Add data transformation | Transform node processes data between agents |
| 9 | Validate pipeline | Validation runs, errors highlighted on canvas |
| 10 | Save pipeline | Pipeline saved with version history |
| 11 | Test pipeline execution | Dry-run executes, results display |
| 12 | View execution history | Historical runs visible with logs |

**Success Criteria:**
- [ ] Canvas supports zoom and pan
- [ ] Node connections validate data types
- [ ] Undo/redo functionality works
- [ ] Pipeline version history maintained
- [ ] Execution logs are searchable

---

### Workflow 1.4: Deployment and Environment Management

**User Story:**
> As a Developer, I want to deploy my agents and pipelines to different environments so that I can safely test changes before production release.

**Value Proposition:**
- Environment isolation prevents production incidents
- Promotion workflows enable controlled releases
- Rollback capability ensures quick recovery

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Deployments | Deployment dashboard shows all environments |
| 2 | Select agent/pipeline to deploy | Selection dialog opens |
| 3 | Choose target environment | dev/staging/production options |
| 4 | Configure deployment settings | Resource limits, scaling, health checks |
| 5 | Review deployment summary | Changes clearly displayed |
| 6 | Click "Deploy" | Deployment initiated with progress indicator |
| 7 | Monitor deployment status | Real-time status updates |
| 8 | Verify deployment success | Health checks pass, endpoints active |
| 9 | Test promoted endpoint | API responds correctly |
| 10 | Initiate rollback (if needed) | Previous version restored |

**Success Criteria:**
- [ ] Deployment completes within configured timeout
- [ ] Health checks run automatically
- [ ] Failed deployments auto-rollback
- [ ] Environment-specific configuration applied
- [ ] Deployment history tracked with audit trail

---

### Workflow 1.5: Connector Integration

**User Story:**
> As a Developer, I want to use pre-built connectors for external services so that I can integrate my AI agents with enterprise systems without building custom integrations.

**Value Proposition:**
- Pre-built connectors save development time
- Secure credential management protects secrets
- Connection testing ensures reliability

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Connectors page | Available connectors listed |
| 2 | Browse connector catalog | Categories: Database, API, Cloud, Custom |
| 3 | Select connector (e.g., PostgreSQL) | Connector configuration form opens |
| 4 | Enter connection details | Host, port, credentials fields |
| 5 | Test connection | Connection test runs, success/failure reported |
| 6 | Save connector configuration | Connector saved with encrypted credentials |
| 7 | Use connector in pipeline | Connector available in pipeline palette |
| 8 | Execute pipeline with connector | Data flows through connector successfully |

**Success Criteria:**
- [ ] Credentials never displayed in plain text
- [ ] Connection test provides clear error messages
- [ ] Connector health monitored continuously
- [ ] Connection pooling optimizes performance
- [ ] Failed connections trigger alerts

---

### Workflow 1.6: Observability and Metrics

**User Story:**
> As a Developer, I want to monitor my agents' performance and behavior so that I can identify issues and optimize their operation proactively.

**Value Proposition:**
- Real-time visibility into agent behavior
- Performance metrics enable optimization
- Alert notifications prevent SLA breaches

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Observability | Metrics dashboard displays |
| 2 | Select agent to monitor | Agent-specific metrics shown |
| 3 | View latency metrics | Response time distribution chart |
| 4 | Check token usage | Token consumption over time |
| 5 | Review error rates | Error breakdown by type |
| 6 | Examine request traces | Distributed tracing visualization |
| 7 | Configure alert threshold | Alert rule created |
| 8 | Test alert notification | Test alert fires correctly |
| 9 | Export metrics data | CSV/JSON export succeeds |

**Success Criteria:**
- [ ] Metrics update in real-time (< 5s delay)
- [ ] Dashboard loads within 3 seconds
- [ ] Historical data retained per policy
- [ ] Alerting reduces MTTR
- [ ] Custom dashboards saveable

---

### Workflow 1.7: API Key Management

**User Story:**
> As a Developer, I want to manage API keys for my applications so that I can securely integrate with Kaizen Studio programmatically.

**Value Proposition:**
- Self-service API key management
- Granular permission scoping
- Key rotation without downtime

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Settings > API Keys | API key list displays |
| 2 | Click "Create API Key" | Key creation dialog opens |
| 3 | Enter key name/description | Descriptive name for identification |
| 4 | Select permissions | Scoped permissions (read, write, deploy) |
| 5 | Set expiration | Optional expiration date |
| 6 | Generate key | Key displayed once (copy immediately) |
| 7 | Copy key to clipboard | Key copied with confirmation |
| 8 | Test API key | curl/SDK call succeeds |
| 9 | Rotate key | New key generated, old key disabled |
| 10 | Revoke key | Key immediately invalidated |

**Success Criteria:**
- [ ] API key shown only once at creation
- [ ] Permission scopes enforced correctly
- [ ] Key rotation is zero-downtime
- [ ] Revoked keys fail immediately
- [ ] Key usage tracked in audit log

---

## Part 2: Org Admin Workflows

### Workflow 2.1: Admin Authentication

**User Story:**
> As an Org Admin, I want to access the administrative console so that I can manage organizational settings and user access.

**Value Proposition:**
- Centralized administrative control
- Role-based access to admin functions
- Audit trail of administrative actions

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to login page | Login form displays |
| 2 | Authenticate with admin credentials | Admin successfully authenticated |
| 3 | Verify admin dashboard access | Admin menu items visible |
| 4 | Access admin-only features | User management, policies, etc. available |
| 5 | Verify audit logging | Admin actions logged |

**Success Criteria:**
- [ ] Admin-only features hidden from non-admins
- [ ] Multi-factor authentication supported
- [ ] Session timeout configurable
- [ ] Concurrent session limits enforced
- [ ] Admin actions logged with context

---

### Workflow 2.2: User Management

**User Story:**
> As an Org Admin, I want to manage user accounts and access so that I can control who can access the platform and what they can do.

**Value Proposition:**
- Centralized user lifecycle management
- Self-service reduces admin burden
- Audit compliance maintained

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Users page | User directory displays |
| 2 | Search for user | Filtered results shown |
| 3 | View user profile | User details, roles, activity |
| 4 | Edit user role | Role assignment updated |
| 5 | Invite new user | Invitation email sent |
| 6 | User accepts invitation | New user can login |
| 7 | Disable user account | User cannot login |
| 8 | Re-enable user | Access restored |
| 9 | Delete user | User removed, data handling per policy |

**Success Criteria:**
- [ ] User search is fast (< 1s for 1000+ users)
- [ ] Role changes take effect immediately
- [ ] Invitation emails delivered reliably
- [ ] Disabled users logged out immediately
- [ ] User deletion follows data retention policy

---

### Workflow 2.3: Team Management

**User Story:**
> As an Org Admin, I want to organize users into teams so that I can manage permissions and resources at the team level for better governance.

**Value Proposition:**
- Team-based access control simplifies management
- Resource sharing within teams
- Clear organizational structure

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Teams page | Team list displays |
| 2 | Create new team | Team created with name/description |
| 3 | Add members to team | Users added with team roles |
| 4 | Assign team permissions | Permission set applied to team |
| 5 | Create sub-team | Hierarchy established |
| 6 | Transfer resources to team | Agents/pipelines moved to team ownership |
| 7 | Remove member from team | Access revoked immediately |
| 8 | Delete team | Team removed, resources reassigned |

**Success Criteria:**
- [ ] Team hierarchy visualized clearly
- [ ] Permission inheritance works correctly
- [ ] Team resource quotas enforced
- [ ] Cross-team sharing configurable
- [ ] Team activity aggregated in reports

---

### Workflow 2.4: Policy Management (ABAC)

**User Story:**
> As an Org Admin, I want to define attribute-based access policies so that I can enforce fine-grained access control beyond simple roles.

**Value Proposition:**
- Context-aware access decisions
- Regulatory compliance (SOC2, HIPAA)
- Reduced risk of unauthorized access

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Policies page | Policy list displays |
| 2 | Create new policy | Policy editor opens |
| 3 | Define policy name/description | Clear naming convention |
| 4 | Set policy conditions | Attribute-based rules (department, location, time) |
| 5 | Define allowed actions | Specific permissions granted |
| 6 | Test policy evaluation | Dry-run shows decision |
| 7 | Activate policy | Policy takes effect |
| 8 | Monitor policy impact | Access decisions logged |
| 9 | Edit policy | Changes versioned |
| 10 | Disable policy | Policy suspended without deletion |

**Success Criteria:**
- [ ] Policy syntax validated in real-time
- [ ] Policy conflicts detected
- [ ] Policy evaluation is fast (< 50ms)
- [ ] Policy version history maintained
- [ ] Policy impact analyzable before activation

---

### Workflow 2.5: SSO Integration

**User Story:**
> As an Org Admin, I want to integrate enterprise SSO so that users can authenticate with their corporate credentials for seamless access.

**Value Proposition:**
- Single sign-on reduces password fatigue
- Centralized identity management
- Consistent security policies

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Settings > SSO | SSO configuration page |
| 2 | Select identity provider | SAML, OIDC, or OAuth options |
| 3 | Enter IdP configuration | Metadata URL or manual config |
| 4 | Configure attribute mapping | Map IdP attributes to roles |
| 5 | Test SSO connection | Test login succeeds |
| 6 | Enable SSO | SSO activated for organization |
| 7 | Test end-user SSO flow | User redirected and authenticated |
| 8 | Configure fallback | Local auth option for emergencies |

**Success Criteria:**
- [ ] SSO setup wizard is guided
- [ ] Attribute mapping flexible
- [ ] SSO failures clearly diagnosed
- [ ] Fallback authentication available
- [ ] SSO sessions respect IdP timeout

---

### Workflow 2.6: Webhook Configuration

**User Story:**
> As an Org Admin, I want to configure webhooks so that I can integrate Kaizen Studio events with external systems for automation.

**Value Proposition:**
- Real-time event integration
- Custom automation triggers
- Reliable delivery with retries

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Webhooks | Webhook list displays |
| 2 | Create new webhook | Webhook form opens |
| 3 | Enter endpoint URL | HTTPS URL validated |
| 4 | Select event types | deployment.completed, agent.error, etc. |
| 5 | Configure secret | Signature verification setup |
| 6 | Test webhook delivery | Test payload sent and received |
| 7 | Enable webhook | Events start firing |
| 8 | View delivery history | Success/failure logs |
| 9 | Retry failed deliveries | Manual retry option |
| 10 | Edit webhook configuration | Changes take effect immediately |

**Success Criteria:**
- [ ] Webhook payloads are signed
- [ ] Retry policy configurable (exponential backoff)
- [ ] Delivery history retained
- [ ] Failed webhooks don't block operations
- [ ] Custom headers supported

---

### Workflow 2.7: Scaling Configuration

**User Story:**
> As an Org Admin, I want to configure auto-scaling policies so that the platform automatically adjusts capacity based on demand.

**Value Proposition:**
- Cost optimization through right-sizing
- Performance maintained under load
- Automated capacity management

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Scaling | Scaling dashboard displays |
| 2 | View current resource usage | CPU, memory, request metrics |
| 3 | Configure scaling policy | Min/max instances, thresholds |
| 4 | Set scaling triggers | CPU > 80%, queue length, etc. |
| 5 | Enable auto-scaling | Policy activated |
| 6 | Monitor scaling events | Scale up/down events logged |
| 7 | Test scaling behavior | Load test triggers scale-out |
| 8 | Configure cooldown periods | Prevent thrashing |

**Success Criteria:**
- [ ] Scaling responds within SLA
- [ ] Scaling events visible in real-time
- [ ] Cost impact projected
- [ ] Manual override available
- [ ] Scaling limits prevent runaway costs

---

### Workflow 2.8: Audit Log Review

**User Story:**
> As an Org Admin, I want to review audit logs so that I can investigate security incidents and demonstrate compliance.

**Value Proposition:**
- Complete audit trail
- Incident investigation support
- Compliance evidence

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Audit Logs | Audit log viewer opens |
| 2 | Filter by date range | Logs filtered |
| 3 | Filter by user | User-specific actions shown |
| 4 | Filter by action type | login, create, delete, etc. |
| 5 | Search log content | Full-text search works |
| 6 | View log detail | Full context with before/after |
| 7 | Export logs | CSV/JSON export |
| 8 | Set log retention | Retention policy configured |

**Success Criteria:**
- [ ] Logs are immutable
- [ ] Log search is fast (< 2s)
- [ ] Export handles large datasets
- [ ] Retention policy enforced automatically
- [ ] Sensitive data masked in logs

---

## Part 3: Org Owner Workflows

### Workflow 3.1: Executive Dashboard Access

**User Story:**
> As an Org Owner, I want a high-level executive dashboard so that I can monitor organizational AI initiatives and key metrics at a glance.

**Value Proposition:**
- Strategic visibility across all AI initiatives
- Investment ROI tracking
- Risk and compliance overview

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as Org Owner | Dashboard loads |
| 2 | View organization summary | Key metrics displayed |
| 3 | Check active deployments | Deployment count and status |
| 4 | Review cost metrics | Spend vs budget |
| 5 | Monitor compliance status | Green/yellow/red indicators |
| 6 | View team performance | Usage by team |
| 7 | Access drill-down details | Navigate to detailed views |

**Success Criteria:**
- [ ] Dashboard loads in < 3 seconds
- [ ] Key metrics prominently displayed
- [ ] Trends clearly visualized
- [ ] Alerts surface critical issues
- [ ] Export to executive report format

---

### Workflow 3.2: Organization Management

**User Story:**
> As an Org Owner, I want to manage my organization's settings and structure so that I can align the platform configuration with business requirements.

**Value Proposition:**
- Organizational autonomy
- Custom branding and configuration
- Multi-tenant isolation

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Organization Settings | Org settings page |
| 2 | Update organization name/logo | Branding updated |
| 3 | Configure default settings | Org-wide defaults set |
| 4 | Manage departments/divisions | Hierarchy configured |
| 5 | Set organization quotas | Resource limits defined |
| 6 | Configure data residency | Region selection |
| 7 | Review organization health | Health metrics displayed |

**Success Criteria:**
- [ ] Settings changes take effect immediately
- [ ] Branding visible across platform
- [ ] Quotas enforced at org level
- [ ] Data residency respected
- [ ] Org changes logged in audit

---

### Workflow 3.3: Billing and Cost Management

**User Story:**
> As an Org Owner, I want to manage billing and monitor costs so that I can control AI platform spending and optimize ROI.

**Value Proposition:**
- Cost visibility and control
- Budget enforcement
- ROI optimization

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Billing | Billing dashboard displays |
| 2 | View current month spend | Spend breakdown shown |
| 3 | Review invoice history | Past invoices accessible |
| 4 | Update payment method | Card/ACH updated |
| 5 | Set budget alerts | Threshold notifications configured |
| 6 | View cost by team/project | Cost allocation visible |
| 7 | Download invoices | PDF download works |
| 8 | Configure cost allocation | Tag-based allocation |
| 9 | Project future costs | Forecast displayed |

**Success Criteria:**
- [ ] Billing data accurate and up-to-date
- [ ] Payment processing secure (PCI compliant)
- [ ] Budget alerts trigger on time
- [ ] Cost allocation accurate
- [ ] Invoice details exportable

---

### Workflow 3.4: Promotion and Discount Management

**User Story:**
> As an Org Owner, I want to apply promotional discounts so that I can benefit from special offers and optimize costs.

**Value Proposition:**
- Cost savings through promotions
- Volume discount tracking
- Partner program benefits

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Billing > Promotions | Promotions page |
| 2 | Enter promotion code | Code field displayed |
| 3 | Apply promotion | Discount calculated and shown |
| 4 | View active promotions | All active discounts listed |
| 5 | Check promotion expiry | Expiration dates visible |
| 6 | View promotion history | Past promotions accessible |

**Success Criteria:**
- [ ] Invalid codes rejected with clear message
- [ ] Discounts applied correctly to billing
- [ ] Promotion stacking rules enforced
- [ ] Expiration warnings provided
- [ ] Promotion usage tracked

---

### Workflow 3.5: Role-Based Access Control (RBAC)

**User Story:**
> As an Org Owner, I want to define custom roles and permissions so that I can implement precise access control aligned with organizational structure.

**Value Proposition:**
- Least privilege enforcement
- Custom role flexibility
- Compliance with access policies

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Roles & Permissions | Role management page |
| 2 | View existing roles | Predefined + custom roles |
| 3 | Create custom role | Role creation wizard |
| 4 | Define role permissions | Granular permission selection |
| 5 | Assign role to users | Role assignment interface |
| 6 | Test role permissions | Verify access boundaries |
| 7 | Edit role | Permissions modified |
| 8 | Delete custom role | Role removed, users reassigned |

**Success Criteria:**
- [ ] Predefined roles available (viewer, editor, admin)
- [ ] Custom roles fully flexible
- [ ] Permission changes immediate
- [ ] Role assignment bulk-capable
- [ ] Role usage audited

---

### Workflow 3.6: Compliance and Audit Oversight

**User Story:**
> As an Org Owner, I want comprehensive compliance and audit oversight so that I can ensure regulatory compliance and governance.

**Value Proposition:**
- Regulatory compliance assurance
- Audit readiness
- Risk mitigation

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Compliance Dashboard | Compliance overview |
| 2 | View compliance status | Framework compliance (SOC2, GDPR, etc.) |
| 3 | Review compliance gaps | Remediation recommendations |
| 4 | Access audit reports | Pre-built audit reports |
| 5 | Schedule compliance review | Automated review scheduling |
| 6 | Export compliance evidence | Documentation export |
| 7 | Configure compliance alerts | Policy violation notifications |

**Success Criteria:**
- [ ] Compliance status real-time
- [ ] Gap analysis actionable
- [ ] Audit reports comprehensive
- [ ] Evidence export complete
- [ ] Alerts immediate on violations

---

### Workflow 3.7: Platform-Wide Metrics and Analytics

**User Story:**
> As an Org Owner, I want platform-wide analytics so that I can make data-driven decisions about AI investments.

**Value Proposition:**
- Strategic decision support
- Usage optimization insights
- Trend analysis

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Analytics | Analytics dashboard |
| 2 | View platform usage trends | Charts and graphs displayed |
| 3 | Analyze by team/project | Drill-down available |
| 4 | Compare periods | Period-over-period analysis |
| 5 | View adoption metrics | User engagement metrics |
| 6 | Export analytics data | Report export |
| 7 | Schedule reports | Automated report delivery |

**Success Criteria:**
- [ ] Analytics load quickly
- [ ] Visualizations clear and insightful
- [ ] Data exportable in multiple formats
- [ ] Scheduled reports delivered reliably
- [ ] Custom date ranges supported

---

### Workflow 3.8: API Key Oversight

**User Story:**
> As an Org Owner, I want organization-wide API key oversight so that I can monitor and control programmatic access across all teams.

**Value Proposition:**
- Centralized access control
- Security visibility
- Usage monitoring

**Step-by-Step Procedure:**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to API Keys (admin view) | All org API keys listed |
| 2 | Filter by team/user | Scoped views |
| 3 | View key usage metrics | Call counts, last used |
| 4 | Identify unused keys | Stale key detection |
| 5 | Revoke suspicious keys | Immediate revocation |
| 6 | Set org-wide key policies | Expiration, rotation rules |
| 7 | Export key inventory | Security audit export |

**Success Criteria:**
- [ ] All org keys visible to owner
- [ ] Usage metrics accurate
- [ ] Revocation immediate
- [ ] Policy enforcement automatic
- [ ] Audit export complete

---

## Test Alignment Matrix

This matrix maps user stories to E2E tests and manual checklist items:

| ID | User Story | Playwright Test | Manual Checklist |
|----|------------|-----------------|------------------|
| 1.1 | Developer Authentication | auth.spec.ts | Section 1.1 |
| 1.2 | Agent Creation | agents.spec.ts | Section 1.2 |
| 1.3 | Pipeline Design | pipelines.spec.ts | Section 1.3 |
| 1.4 | Deployment Management | deployments.spec.ts | Section 1.4 |
| 1.5 | Connector Integration | connectors.spec.ts | Section 1.5 |
| 1.6 | Observability | metrics.spec.ts | Section 1.6 |
| 1.7 | API Key Management | settings.spec.ts | Section 1.7 |
| 2.1 | Admin Authentication | auth.spec.ts | Section 2.1 |
| 2.2 | User Management | settings.spec.ts | Section 2.2 |
| 2.3 | Team Management | teams.spec.ts | Section 2.3 |
| 2.4 | Policy Management | governance.spec.ts | Section 2.4 |
| 2.5 | SSO Integration | auth.spec.ts | Section 2.5 |
| 2.6 | Webhook Configuration | webhooks.spec.ts | Section 2.6 |
| 2.7 | Scaling Configuration | settings.spec.ts | Section 2.7 |
| 2.8 | Audit Log Review | settings.spec.ts | Section 2.8 |
| 3.1 | Executive Dashboard | dashboard.spec.ts | Section 3.1 |
| 3.2 | Organization Management | settings.spec.ts | Section 3.2 |
| 3.3 | Billing Management | billing.spec.ts | Section 3.3 |
| 3.4 | Promotion Management | billing.spec.ts | Section 3.4 |
| 3.5 | RBAC Management | governance.spec.ts | Section 3.5 |
| 3.6 | Compliance Oversight | governance.spec.ts | Section 3.6 |
| 3.7 | Platform Analytics | metrics.spec.ts | Section 3.7 |
| 3.8 | API Key Oversight | settings.spec.ts | Section 3.8 |

---

## Appendix A: Permission Matrix

| Permission | Developer | Org Admin | Org Owner |
|------------|-----------|-----------|-----------|
| agents:create | ✓ | ✓ | ✓ |
| agents:read | ✓ | ✓ | ✓ |
| agents:update | ✓ | ✓ | ✓ |
| agents:delete | ✓ | ✓ | ✓ |
| pipelines:read | ✓ | ✓ | ✓ |
| pipelines:* | - | ✓ | ✓ |
| deployments:* | ✓ | ✓ | ✓ |
| connectors:read | ✓ | ✓ | ✓ |
| connectors:execute | ✓ | ✓ | ✓ |
| connectors:* | - | ✓ | ✓ |
| users:* | - | ✓ | ✓ |
| teams:* | - | ✓ | ✓ |
| policies:* | - | ✓ | ✓ |
| webhooks:* | - | ✓ | ✓ |
| sso:* | - | ✓ | ✓ |
| scaling:* | - | ✓ | ✓ |
| billing:* | - | - | ✓ |
| organization:* | - | - | ✓ |
| compliance:* | - | - | ✓ |
