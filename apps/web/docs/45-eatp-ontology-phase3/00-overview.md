# Phase 3: Level 3 Value Chain Owner Experience

Phase 3 of the EATP Ontology Redesign implements the Level 3 (Value Chain Owner) experience, providing enterprise-wide visibility, compliance monitoring, and trust management across departments.

## What It Is

Level 3 is the enterprise administrative layer for managing value chains, monitoring compliance, and maintaining trust relationships across the organization. Value Chain Owners:

- View and manage enterprise-wide value chains
- Monitor compliance and constraint violations
- Access complete audit trails of trust operations
- Visualize cross-department trust relationships
- Track performance metrics and costs

## Key Features

### Value Chains Management
- `/work/value-chains` - Enterprise value chains overview
- Filter by status, department, and trust health
- View department flow visualizations
- Access metrics, compliance, and audit dashboards

### Compliance Dashboard
- `/govern/compliance` - Compliance monitoring center
- Trust health bar showing valid/expiring/expired/revoked breakdown
- Constraint violations chart with weekly trends
- Recent audit events and alerts

### Enterprise Audit Trail
- `/govern/audit-trail` - Complete trust operation history
- Filter by event type, date range, and search
- Export to CSV or PDF
- Expandable event details with metadata

### Cross-Department Trust Visualization
- React Flow-based graph showing trust relationships
- Department groupings with work units
- Color-coded trust status indicators
- Interactive node selection

## File Structure

```
src/
├── features/
│   ├── value-chains/           # Value chains feature
│   │   ├── api/                # API client functions
│   │   ├── components/         # UI components
│   │   │   ├── CrossDepartmentTrustVisualization/
│   │   │   ├── DepartmentFlowVisualization/
│   │   │   ├── EnterpriseOverview/
│   │   │   ├── ValueChainCard/
│   │   │   └── ValueChainMetrics/
│   │   ├── hooks/              # React Query hooks
│   │   └── types/              # TypeScript types
│   └── compliance/             # Compliance feature
│       ├── api/                # API client functions
│       ├── components/         # UI components
│       │   ├── ComplianceAlerts/
│       │   ├── ConstraintViolationsChart/
│       │   ├── RecentAuditEvents/
│       │   └── TrustHealthBar/
│       ├── hooks/              # React Query hooks
│       └── types/              # TypeScript types
├── pages/
│   ├── work/
│   │   └── ValueChainsPage.tsx
│   └── govern/
│       ├── ComplianceDashboard.tsx
│       └── EnterpriseAuditTrail.tsx
└── components/shared/
    └── LevelGuard.tsx          # Level-based route protection
```

## Routes

| Path | Component | Level |
|------|-----------|-------|
| `/work/value-chains` | ValueChainsPage | 3 |
| `/work/value-chains/:id` | ValueChainsPage | 3 |
| `/govern/compliance` | ComplianceDashboard | 3 |
| `/govern/audit-trail` | EnterpriseAuditTrail | 3 |

## Test Coverage

- **167 tests** across 9 test files
- All tests passing with 100% success rate
- Coverage includes:
  - Value chains components (59 tests)
  - Compliance components (41 tests)
  - Enterprise audit trail (21 tests)
  - Cross-department visualization (11 tests)
  - Value chain metrics (30 tests)
  - Level guard (5 tests)

## Related Documentation

- [01-value-chains.md](./01-value-chains.md) - Value chains components
- [02-compliance.md](./02-compliance.md) - Compliance monitoring
- [03-trust-visualization.md](./03-trust-visualization.md) - Cross-department trust
