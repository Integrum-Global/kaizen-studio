# User Flows: End-to-End User Journeys

This document illustrates how different users interact with the EATP-enabled system.

---

## User Personas

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER PERSONAS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│   │    BUSINESS     │  │   TECHNICAL     │  │   COMPLIANCE    │        │
│   │     USER        │  │    ADMIN        │  │    OFFICER      │        │
│   │                 │  │                 │  │                 │        │
│   │  "I want to     │  │  "I manage      │  │  "I need to     │        │
│   │   delegate      │  │   agent         │  │   audit who     │        │
│   │   tasks to      │  │   capabilities  │  │   authorized    │        │
│   │   AI agents"    │  │   and policies" │  │   what"         │        │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘        │
│           │                    │                    │                   │
│           │                    │                    │                   │
│           ▼                    ▼                    ▼                   │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │                     KAIZEN STUDIO                             │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Flow 1: Business User Delegates Task to Agent

**Scenario**: Alice (CFO) wants to delegate invoice processing to an AI agent.

```
┌─────────────────────────────────────────────────────────────────────────┐
│           FLOW 1: BUSINESS USER TASK DELEGATION                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │  STEP 1: LOGIN                                                │    │
│   │  ────────────────                                             │    │
│   │                                                               │    │
│   │  ┌─────────────────┐        ┌─────────────────┐              │    │
│   │  │                 │        │                 │              │    │
│   │  │  Alice clicks   │───────►│   SSO Login     │              │    │
│   │  │  "Sign In"      │        │   (Okta/Azure)  │              │    │
│   │  │                 │        │                 │              │    │
│   │  └─────────────────┘        └────────┬────────┘              │    │
│   │                                      │                        │    │
│   │                                      ▼                        │    │
│   │                             ┌─────────────────┐              │    │
│   │                             │  PseudoAgent    │              │    │
│   │                             │  Created        │              │    │
│   │                             │                 │              │    │
│   │                             │  human_id:      │              │    │
│   │                             │  alice@corp.com │              │    │
│   │                             └─────────────────┘              │    │
│   │                                                               │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                      │                                  │
│                                      ▼                                  │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │  STEP 2: SELECT AGENT                                         │    │
│   │  ─────────────────────                                        │    │
│   │                                                               │    │
│   │  ┌─────────────────────────────────────────────────────────┐ │    │
│   │  │                   Agent Marketplace                      │ │    │
│   │  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │ │    │
│   │  │  │   Invoice    │ │   Report     │ │   Email      │    │ │    │
│   │  │  │   Processor  │ │   Generator  │ │   Responder  │    │ │    │
│   │  │  │              │ │              │ │              │    │ │    │
│   │  │  │ Capabilities:│ │ Capabilities:│ │ Capabilities:│    │ │    │
│   │  │  │ • read_inv   │ │ • read_data  │ │ • send_email │    │ │    │
│   │  │  │ • process    │ │ • gen_report │ │ • read_email │    │ │    │
│   │  │  │ • approve*   │ │              │ │              │    │ │    │
│   │  │  └──────────────┘ └──────────────┘ └──────────────┘    │ │    │
│   │  │          ▲                                               │ │    │
│   │  │          │                                               │ │    │
│   │  │     Alice selects                                        │ │    │
│   │  └─────────────────────────────────────────────────────────┘ │    │
│   │                                                               │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                      │                                  │
│                                      ▼                                  │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │  STEP 3: CONFIGURE DELEGATION                                 │    │
│   │  ─────────────────────────────                                │    │
│   │                                                               │    │
│   │  ┌─────────────────────────────────────────────────────────┐ │    │
│   │  │              Delegation Configuration                    │ │    │
│   │  │                                                          │ │    │
│   │  │  Task: Process November Invoices                        │ │    │
│   │  │  ────────────────────────────────                        │ │    │
│   │  │                                                          │ │    │
│   │  │  Capabilities to Grant:                                  │ │    │
│   │  │  ☑ read_invoices                                        │ │    │
│   │  │  ☑ process_invoices                                     │ │    │
│   │  │  ☐ approve_invoices (requires additional auth)          │ │    │
│   │  │                                                          │ │    │
│   │  │  Constraints:                                            │ │    │
│   │  │  ┌─────────────────────────────────────────────────┐    │ │    │
│   │  │  │  Cost Limit:     [$1,000     ▼]                 │    │ │    │
│   │  │  │  Time Window:    [09:00] - [17:00] EST          │    │ │    │
│   │  │  │  Resource Scope: [invoices/nov-2025/*]          │    │ │    │
│   │  │  │  Rate Limit:     [100] requests/hour            │    │ │    │
│   │  │  │  Expires:        [2025-12-01]                   │    │ │    │
│   │  │  └─────────────────────────────────────────────────┘    │ │    │
│   │  │                                                          │ │    │
│   │  │  [Cancel]                          [Delegate →]          │ │    │
│   │  │                                                          │ │    │
│   │  └─────────────────────────────────────────────────────────┘ │    │
│   │                                                               │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                      │                                  │
│                                      ▼                                  │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │  STEP 4: CONFIRM & ACTIVATE                                   │    │
│   │  ───────────────────────────                                  │    │
│   │                                                               │    │
│   │  ┌─────────────────────────────────────────────────────────┐ │    │
│   │  │              Delegation Confirmation                     │ │    │
│   │  │                                                          │ │    │
│   │  │  You are about to delegate to: Invoice Processor        │ │    │
│   │  │                                                          │ │    │
│   │  │  ┌───────────────────────────────────────────────────┐  │ │    │
│   │  │  │  Trust Chain Preview:                             │  │ │    │
│   │  │  │                                                   │  │ │    │
│   │  │  │  alice@corp.com (You)                            │  │ │    │
│   │  │  │        │                                          │  │ │    │
│   │  │  │        ▼                                          │  │ │    │
│   │  │  │  Invoice Processor                                │  │ │    │
│   │  │  │  • Capabilities: read, process                    │  │ │    │
│   │  │  │  • Cost limit: $1,000                             │  │ │    │
│   │  │  │  • Expires: Dec 1, 2025                           │  │ │    │
│   │  │  │                                                   │  │ │    │
│   │  │  │  All actions will be traceable to YOU.            │  │ │    │
│   │  │  └───────────────────────────────────────────────────┘  │ │    │
│   │  │                                                          │ │    │
│   │  │  ☑ I understand I am responsible for this agent's      │ │    │
│   │  │    actions within these constraints                     │ │    │
│   │  │                                                          │ │    │
│   │  │  [Back]                            [Confirm Delegation]  │ │    │
│   │  │                                                          │ │    │
│   │  └─────────────────────────────────────────────────────────┘ │    │
│   │                                                               │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                      │                                  │
│                                      ▼                                  │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │  STEP 5: ACTIVE DELEGATION DASHBOARD                          │    │
│   │  ────────────────────────────────────                         │    │
│   │                                                               │    │
│   │  ┌─────────────────────────────────────────────────────────┐ │    │
│   │  │              My Active Delegations                       │ │    │
│   │  │                                                          │ │    │
│   │  │  ┌───────────────────────────────────────────────────┐  │ │    │
│   │  │  │  Invoice Processor    🟢 ACTIVE                   │  │ │    │
│   │  │  │  ────────────────────────────────────             │  │ │    │
│   │  │  │  Task: Process November Invoices                  │  │ │    │
│   │  │  │  Processed: 47/156 invoices                       │  │ │    │
│   │  │  │  Cost Used: $234 / $1,000                         │  │ │    │
│   │  │  │  Expires: 28 days remaining                       │  │ │    │
│   │  │  │                                                   │  │ │    │
│   │  │  │  [View Activity]  [Pause]  [Revoke]              │  │ │    │
│   │  │  └───────────────────────────────────────────────────┘  │ │    │
│   │  │                                                          │ │    │
│   │  └─────────────────────────────────────────────────────────┘ │    │
│   │                                                               │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Flow 2: Compliance Officer Audits Agent Activity

**Scenario**: The compliance officer needs to investigate who authorized a specific action.

```
┌─────────────────────────────────────────────────────────────────────────┐
│           FLOW 2: COMPLIANCE AUDIT TRAIL                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │  STEP 1: SEARCH FOR ACTION                                    │    │
│   │  ──────────────────────────                                   │    │
│   │                                                               │    │
│   │  ┌─────────────────────────────────────────────────────────┐ │    │
│   │  │              Audit Trail Search                          │ │    │
│   │  │                                                          │ │    │
│   │  │  🔍 Search: [invoice_id:INV-2025-1234          ]        │ │    │
│   │  │                                                          │ │    │
│   │  │  Filters:                                                │ │    │
│   │  │  Date Range: [Nov 1] - [Nov 30, 2025]                   │ │    │
│   │  │  Action Type: [All Actions        ▼]                    │ │    │
│   │  │  Agent: [All Agents              ▼]                     │ │    │
│   │  │                                                          │ │    │
│   │  │  [Search]                                                │ │    │
│   │  │                                                          │ │    │
│   │  └─────────────────────────────────────────────────────────┘ │    │
│   │                                                               │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                      │                                  │
│                                      ▼                                  │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │  STEP 2: VIEW RESULTS                                         │    │
│   │  ─────────────────────                                        │    │
│   │                                                               │    │
│   │  ┌─────────────────────────────────────────────────────────┐ │    │
│   │  │              Audit Results (3 actions found)             │ │    │
│   │  │                                                          │ │    │
│   │  │  ┌───────────────────────────────────────────────────┐  │ │    │
│   │  │  │  Nov 15, 10:32 AM  │  read_invoice                │  │ │    │
│   │  │  │  Agent: Invoice Processor                         │  │ │    │
│   │  │  │  Resource: invoices/INV-2025-1234                 │  │ │    │
│   │  │  │  Result: ✅ SUCCESS                               │  │ │    │
│   │  │  │  Authorized by: alice@corp.com ◄─ TRACEABLE      │  │ │    │
│   │  │  └───────────────────────────────────────────────────┘  │ │    │
│   │  │  ┌───────────────────────────────────────────────────┐  │ │    │
│   │  │  │  Nov 15, 10:33 AM  │  process_invoice             │  │ │    │
│   │  │  │  Agent: Invoice Processor                         │  │ │    │
│   │  │  │  Resource: invoices/INV-2025-1234                 │  │ │    │
│   │  │  │  Result: ✅ SUCCESS                               │  │ │    │
│   │  │  │  Authorized by: alice@corp.com ◄─ TRACEABLE      │  │ │    │
│   │  │  └───────────────────────────────────────────────────┘  │ │    │
│   │  │  ┌───────────────────────────────────────────────────┐  │ │    │
│   │  │  │  Nov 15, 10:34 AM  │  submit_for_approval         │  │ │    │
│   │  │  │  Agent: Invoice Processor                         │  │ │    │
│   │  │  │  Resource: invoices/INV-2025-1234                 │  │ │    │
│   │  │  │  Result: ✅ SUCCESS                               │  │ │    │
│   │  │  │  Authorized by: alice@corp.com ◄─ TRACEABLE      │  │ │    │
│   │  │  └───────────────────────────────────────────────────┘  │ │    │
│   │  │                                                          │ │    │
│   │  └─────────────────────────────────────────────────────────┘ │    │
│   │                                                               │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                      │                                  │
│                                      ▼                                  │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │  STEP 3: DRILL INTO TRUST CHAIN                               │    │
│   │  ───────────────────────────────                              │    │
│   │                                                               │    │
│   │  ┌─────────────────────────────────────────────────────────┐ │    │
│   │  │              Trust Chain Visualization                   │ │    │
│   │  │                                                          │ │    │
│   │  │  Action: process_invoice on INV-2025-1234               │ │    │
│   │  │  ─────────────────────────────────────────              │ │    │
│   │  │                                                          │ │    │
│   │  │  ┌───────────────────────────────────────────────────┐  │ │    │
│   │  │  │                                                   │  │ │    │
│   │  │  │         ┌─────────────────────┐                   │  │ │    │
│   │  │  │         │  👤 Alice Chen      │                   │  │ │    │
│   │  │  │         │  CFO                │                   │  │ │    │
│   │  │  │         │  alice@corp.com     │                   │  │ │    │
│   │  │  │         │  Auth: Okta SSO     │                   │  │ │    │
│   │  │  │         │  Nov 1, 09:00 AM    │                   │  │ │    │
│   │  │  │         └──────────┬──────────┘                   │  │ │    │
│   │  │  │                    │                              │  │ │    │
│   │  │  │           DELEGATED (Nov 1)                       │  │ │    │
│   │  │  │           Capabilities: read, process             │  │ │    │
│   │  │  │           Cost limit: $1,000                      │  │ │    │
│   │  │  │                    │                              │  │ │    │
│   │  │  │                    ▼                              │  │ │    │
│   │  │  │         ┌─────────────────────┐                   │  │ │    │
│   │  │  │         │  🤖 Invoice         │                   │  │ │    │
│   │  │  │         │     Processor       │                   │  │ │    │
│   │  │  │         │  agent-inv-001      │                   │  │ │    │
│   │  │  │         │                     │                   │  │ │    │
│   │  │  │         │  Executed action:   │                   │  │ │    │
│   │  │  │         │  process_invoice    │                   │  │ │    │
│   │  │  │         │  Nov 15, 10:33 AM   │                   │  │ │    │
│   │  │  │         └─────────────────────┘                   │  │ │    │
│   │  │  │                                                   │  │ │    │
│   │  │  └───────────────────────────────────────────────────┘  │ │    │
│   │  │                                                          │ │    │
│   │  │  Conclusion: Alice Chen (CFO) authorized this action    │ │    │
│   │  │  through delegation on Nov 1, 2025.                     │ │    │
│   │  │                                                          │ │    │
│   │  │  [Export Report]  [View Full Chain JSON]                │ │    │
│   │  │                                                          │ │    │
│   │  └─────────────────────────────────────────────────────────┘ │    │
│   │                                                               │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Flow 3: IT Admin Handles Employee Departure

**Scenario**: Bob from Finance is leaving the company. All his delegations must be revoked.

```
┌─────────────────────────────────────────────────────────────────────────┐
│           FLOW 3: EMPLOYEE DEPARTURE - CASCADE REVOCATION               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │  TRIGGER: HR System Notification                              │    │
│   │  ────────────────────────────────                             │    │
│   │                                                               │    │
│   │  ┌─────────────────────────────────────────────────────────┐ │    │
│   │  │              HR System → Kaizen Integration              │ │    │
│   │  │                                                          │ │    │
│   │  │  Event: EMPLOYEE_TERMINATION                            │ │    │
│   │  │  Employee: bob@corp.com                                 │ │    │
│   │  │  Effective: Immediately                                  │ │    │
│   │  │                                                          │ │    │
│   │  │  Auto-action: Revoke all trust delegations              │ │    │
│   │  │                                                          │ │    │
│   │  └─────────────────────────────────────────────────────────┘ │    │
│   │                                                               │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                      │                                  │
│                                      ▼                                  │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │  STEP 1: CASCADE REVOCATION PREVIEW                           │    │
│   │  ───────────────────────────────────                          │    │
│   │                                                               │    │
│   │  ┌─────────────────────────────────────────────────────────┐ │    │
│   │  │              Revocation Impact Analysis                  │ │    │
│   │  │                                                          │ │    │
│   │  │  User: bob@corp.com                                     │ │    │
│   │  │  Status: Account disabled                               │ │    │
│   │  │                                                          │ │    │
│   │  │  Active Delegations Found: 3                            │ │    │
│   │  │  ─────────────────────────────                           │ │    │
│   │  │                                                          │ │    │
│   │  │  ┌───────────────────────────────────────────────────┐  │ │    │
│   │  │  │                                                   │  │ │    │
│   │  │  │      ┌──────────────┐                            │  │ │    │
│   │  │  │      │  👤 Bob      │                            │  │ │    │
│   │  │  │      └──────┬───────┘                            │  │ │    │
│   │  │  │             │                                     │  │ │    │
│   │  │  │    ┌────────┼────────┐                           │  │ │    │
│   │  │  │    │        │        │                           │  │ │    │
│   │  │  │    ▼        ▼        ▼                           │  │ │    │
│   │  │  │ ┌──────┐ ┌──────┐ ┌──────┐                      │  │ │    │
│   │  │  │ │Agent │ │Agent │ │Agent │                      │  │ │    │
│   │  │  │ │  A   │ │  B   │ │  C   │                      │  │ │    │
│   │  │  │ └──┬───┘ └──────┘ └──────┘                      │  │ │    │
│   │  │  │    │                                             │  │ │    │
│   │  │  │    ▼                                             │  │ │    │
│   │  │  │ ┌──────┐                                         │  │ │    │
│   │  │  │ │Agent │ ◄── Also revoked (cascade)             │  │ │    │
│   │  │  │ │  D   │                                         │  │ │    │
│   │  │  │ └──────┘                                         │  │ │    │
│   │  │  │                                                   │  │ │    │
│   │  │  │  Total agents to revoke: 4                       │  │ │    │
│   │  │  │                                                   │  │ │    │
│   │  │  └───────────────────────────────────────────────────┘  │ │    │
│   │  │                                                          │ │    │
│   │  │  ⚠️ This action is IRREVERSIBLE                         │ │    │
│   │  │                                                          │ │    │
│   │  │  [Cancel]                [Confirm Cascade Revocation]   │ │    │
│   │  │                                                          │ │    │
│   │  └─────────────────────────────────────────────────────────┘ │    │
│   │                                                               │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                      │                                  │
│                                      ▼                                  │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │  STEP 2: REVOCATION IN PROGRESS                               │    │
│   │  ───────────────────────────────                              │    │
│   │                                                               │    │
│   │  ┌─────────────────────────────────────────────────────────┐ │    │
│   │  │              Cascade Revocation Status                   │ │    │
│   │  │                                                          │ │    │
│   │  │  ████████████████████░░░░░░░░░░ 60%                     │ │    │
│   │  │                                                          │ │    │
│   │  │  ✅ bob@corp.com - Trust revoked                        │ │    │
│   │  │  ✅ agent-a - Delegation revoked                        │ │    │
│   │  │  ✅ agent-b - Delegation revoked                        │ │    │
│   │  │  ⏳ agent-c - Revoking...                               │ │    │
│   │  │  ⏳ agent-d - Pending (cascade from agent-a)            │ │    │
│   │  │                                                          │ │    │
│   │  │  Elapsed: 0.3 seconds                                   │ │    │
│   │  │                                                          │ │    │
│   │  └─────────────────────────────────────────────────────────┘ │    │
│   │                                                               │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                      │                                  │
│                                      ▼                                  │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │  STEP 3: REVOCATION COMPLETE                                  │    │
│   │  ────────────────────────────                                 │    │
│   │                                                               │    │
│   │  ┌─────────────────────────────────────────────────────────┐ │    │
│   │  │              Revocation Complete ✅                      │ │    │
│   │  │                                                          │ │    │
│   │  │  User: bob@corp.com                                     │ │    │
│   │  │  Agents Revoked: 4                                      │ │    │
│   │  │  Time Elapsed: 0.7 seconds                              │ │    │
│   │  │                                                          │ │    │
│   │  │  ┌───────────────────────────────────────────────────┐  │ │    │
│   │  │  │  Revocation Summary                               │  │ │    │
│   │  │  │                                                   │  │ │    │
│   │  │  │  Agent       │ Status    │ Reason                │  │ │    │
│   │  │  │  ──────────────────────────────────────────────  │  │ │    │
│   │  │  │  agent-a     │ Revoked   │ Root source revoked   │  │ │    │
│   │  │  │  agent-b     │ Revoked   │ Root source revoked   │  │ │    │
│   │  │  │  agent-c     │ Revoked   │ Root source revoked   │  │ │    │
│   │  │  │  agent-d     │ Revoked   │ Cascade from agent-a  │  │ │    │
│   │  │  │                                                   │  │ │    │
│   │  │  └───────────────────────────────────────────────────┘  │ │    │
│   │  │                                                          │ │    │
│   │  │  [Download Audit Report]  [Notify Affected Users]       │ │    │
│   │  │                                                          │ │    │
│   │  └─────────────────────────────────────────────────────────┘ │    │
│   │                                                               │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Flow 4: Agent-to-Agent Delegation

**Scenario**: Manager Agent delegates subtask to Worker Agent (with constraint tightening).

```
┌─────────────────────────────────────────────────────────────────────────┐
│           FLOW 4: AGENT-TO-AGENT DELEGATION                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   This flow happens automatically - no UI required.                    │
│   The UI shows the result in the Trust Chain Visualization.           │
│                                                                         │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │                                                               │    │
│   │   Alice (Human)                                               │    │
│   │   └── delegates to ──► Manager Agent                         │    │
│   │       Constraints:                                            │    │
│   │       • cost_limit: $10,000                                  │    │
│   │       • time_window: 09:00-17:00                             │    │
│   │       • resources: invoices/*                                │    │
│   │                          │                                    │    │
│   │                          │                                    │    │
│   │                          ▼                                    │    │
│   │                    Manager Agent                              │    │
│   │                    └── delegates to ──► Worker Agent         │    │
│   │                        Constraints (TIGHTENED):               │    │
│   │                        • cost_limit: $1,000 ◄─ REDUCED       │    │
│   │                        • time_window: 10:00-16:00 ◄─ REDUCED │    │
│   │                        • resources: invoices/small/* ◄─ REDUCED│   │
│   │                                                               │    │
│   │   Key: Worker CANNOT have looser constraints than Manager.   │    │
│   │   The SDK enforces this automatically.                       │    │
│   │                                                               │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                                                         │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │  UI: Trust Chain View (what user sees)                        │    │
│   │  ──────────────────────────────────────                       │    │
│   │                                                               │    │
│   │  ┌─────────────────────────────────────────────────────────┐ │    │
│   │  │                                                          │ │    │
│   │  │   👤 alice@corp.com                                     │ │    │
│   │  │   └─ $10K, 09:00-17:00, invoices/*                      │ │    │
│   │  │       │                                                  │ │    │
│   │  │       ▼                                                  │ │    │
│   │  │   🤖 Manager Agent                                      │ │    │
│   │  │   └─ $10K, 09:00-17:00, invoices/*                      │ │    │
│   │  │       │                                                  │ │    │
│   │  │       ▼                                                  │ │    │
│   │  │   🤖 Worker Agent                                       │ │    │
│   │  │   └─ $1K, 10:00-16:00, invoices/small/*  ◄─ TIGHTENED  │ │    │
│   │  │                                                          │ │    │
│   │  │   [Expand Details]  [View Constraints Diff]              │ │    │
│   │  │                                                          │ │    │
│   │  └─────────────────────────────────────────────────────────┘ │    │
│   │                                                               │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Flow Summary

| Flow | User | Trigger | SDK Components | Studio Components |
|------|------|---------|----------------|-------------------|
| 1. Task Delegation | Business User | Login + UI | PseudoAgent, TrustOperations.delegate() | Delegation Wizard |
| 2. Audit Trail | Compliance | Search | TrustOperations.audit(), AuditAnchor | Audit Search + Visualization |
| 3. Cascade Revoke | IT Admin | HR Event | revoke_by_human(), revoke_cascade() | Revocation Dashboard |
| 4. Agent Delegation | (Automatic) | Agent code | TrustedSupervisorAgent.delegate_to_worker() | Trust Chain Viewer |
