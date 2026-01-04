# EATP Frontend: Migration Guide

## Document Control
- **Version**: 1.0
- **Date**: 2026-01-03
- **Status**: Planning
- **Author**: Kaizen Studio Team

---

## Overview

This guide outlines the migration from the current "Agents" and "Pipelines" terminology to the unified "Work Units" model. This is a significant change that affects UI, API, database schema, and user documentation.

---

## Terminology Changes

### Summary Table

| Old Term | New Term | Notes |
|----------|----------|-------|
| Agent | Work Unit (atomic) | Single-capability unit |
| Pipeline | Work Unit (composite) / Process | Multi-step orchestration |
| Bot | Work Unit | Deprecated casual term |
| Hub | Workspace | Purpose-driven collection |
| Folder | Workspace | Not a container metaphor |
| Share | Delegate | Implies trust transfer |
| Permission | Capability | EATP terminology |
| Execution | Task / Run | User-friendly |

### User-Facing String Changes

```typescript
// old-strings.ts (to be replaced)
const OLD_STRINGS = {
  createAgent: 'Create Agent',
  agentList: 'Agents',
  createPipeline: 'Create Pipeline',
  pipelineList: 'Pipelines',
  shareWith: 'Share with',
  botSettings: 'Bot Settings',
};

// new-strings.ts
const NEW_STRINGS = {
  createWorkUnit: 'Create Work Unit',
  workUnitList: 'Work Units',
  createProcess: 'Create Process',
  processList: 'My Processes',
  delegateTo: 'Delegate to',
  workUnitSettings: 'Work Unit Settings',
};
```

---

## Component Migration

### File Renames

| Old Path | New Path |
|----------|----------|
| `components/agents/AgentCard.tsx` | `components/work-units/WorkUnitCard.tsx` |
| `components/agents/AgentList.tsx` | `components/work-units/WorkUnitList.tsx` |
| `components/agents/AgentDetail.tsx` | `components/work-units/WorkUnitDetail.tsx` |
| `components/pipelines/PipelineCard.tsx` | Merged into `WorkUnitCard.tsx` |
| `components/pipelines/PipelineList.tsx` | Merged into `WorkUnitList.tsx` |
| `components/pipelines/PipelineFlow.tsx` | `components/work-units/ProcessFlow.tsx` |
| `pages/agents/index.tsx` | `pages/build/work-units/index.tsx` |
| `pages/pipelines/index.tsx` | Redirect to work-units |
| `hooks/useAgents.ts` | `hooks/useWorkUnits.ts` |
| `hooks/usePipelines.ts` | Merged into `useWorkUnits.ts` |

### Component Interface Changes

```typescript
// OLD: AgentCard.tsx
interface AgentCardProps {
  agent: Agent;
  onRun: () => void;
  onEdit: () => void;
  onShare: () => void;  // Deprecated
}

// NEW: WorkUnitCard.tsx
interface WorkUnitCardProps {
  workUnit: WorkUnit;
  onRun?: () => void;
  onConfigure?: () => void;
  onDelegate?: () => void;  // Replaces onShare
  userLevel: 1 | 2 | 3;     // NEW: Level-based rendering
  compact?: boolean;        // NEW: Embedding support
}
```

### Type Changes

```typescript
// OLD: types/agent.ts
interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  isActive: boolean;
  createdAt: string;
}

interface Pipeline {
  id: string;
  name: string;
  description: string;
  agents: string[];  // Child agent IDs
  isActive: boolean;
  createdAt: string;
}

// NEW: types/work-unit.ts
interface WorkUnit {
  id: string;
  name: string;
  description: string;
  type: 'atomic' | 'composite';  // Unified type discriminator
  capabilities: Capability[];     // Rich capability objects
  trustStatus: TrustStatus;       // NEW: Integrated trust
  subUnitIds?: string[];          // For composite (replaces 'agents')
  subUnitCount?: number;
  workspaceIds: string[];         // NEW: Workspace membership
  configuration: WorkUnitConfig;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
```

---

## Route Migration

### URL Changes

| Old URL | New URL | Redirect? |
|---------|---------|-----------|
| `/agents` | `/build/work-units` | Yes (301) |
| `/agents/:id` | `/build/work-units/:id` | Yes (301) |
| `/agents/create` | `/build/work-units/new` | Yes (301) |
| `/pipelines` | `/build/work-units?type=composite` | Yes (301) |
| `/pipelines/:id` | `/build/work-units/:id` | Yes (301) |
| `/pipelines/create` | `/build/work-units/new?type=composite` | Yes (301) |
| `/dashboard` | `/work/tasks` | Yes (301) |
| `/settings/sharing` | `/govern/trust` | Yes (301) |

### Redirect Implementation

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const REDIRECTS: Record<string, string> = {
  '/agents': '/build/work-units',
  '/pipelines': '/build/work-units?type=composite',
  '/dashboard': '/work/tasks',
  '/settings/sharing': '/govern/trust',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for exact matches
  if (REDIRECTS[pathname]) {
    return NextResponse.redirect(
      new URL(REDIRECTS[pathname], request.url),
      301
    );
  }

  // Check for pattern matches
  if (pathname.startsWith('/agents/')) {
    const id = pathname.replace('/agents/', '');
    return NextResponse.redirect(
      new URL(`/build/work-units/${id}`, request.url),
      301
    );
  }

  if (pathname.startsWith('/pipelines/')) {
    const id = pathname.replace('/pipelines/', '');
    return NextResponse.redirect(
      new URL(`/build/work-units/${id}`, request.url),
      301
    );
  }

  return NextResponse.next();
}
```

---

## API Migration

### Endpoint Changes

| Old Endpoint | New Endpoint | Notes |
|--------------|--------------|-------|
| `GET /api/agents` | `GET /api/work-units?type=atomic` | Query param filter |
| `GET /api/pipelines` | `GET /api/work-units?type=composite` | Query param filter |
| `POST /api/agents` | `POST /api/work-units` | Include `type: 'atomic'` |
| `POST /api/pipelines` | `POST /api/work-units` | Include `type: 'composite'` |
| `POST /api/agents/:id/share` | `POST /api/work-units/:id/delegate` | New delegation model |

### API Compatibility Layer

For backward compatibility during migration:

```typescript
// api/agents/route.ts (deprecated, forwards to work-units)
export async function GET(request: NextRequest) {
  console.warn('DEPRECATED: /api/agents - use /api/work-units?type=atomic');

  const url = new URL('/api/work-units', request.url);
  url.searchParams.set('type', 'atomic');

  return NextResponse.redirect(url, 307);
}

export async function POST(request: NextRequest) {
  console.warn('DEPRECATED: POST /api/agents - use POST /api/work-units');

  const body = await request.json();
  body.type = 'atomic';

  return fetch(new URL('/api/work-units', request.url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
```

---

## Database Migration

### Schema Changes

```sql
-- Migration: Rename agents to work_units
ALTER TABLE agents RENAME TO work_units;

-- Add type column
ALTER TABLE work_units ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'atomic';

-- Migrate pipelines to work_units
INSERT INTO work_units (id, name, description, type, created_at, created_by)
SELECT id, name, description, 'composite', created_at, created_by
FROM pipelines;

-- Rename pipeline_agents to work_unit_children
ALTER TABLE pipeline_agents RENAME TO work_unit_children;
ALTER TABLE work_unit_children RENAME COLUMN pipeline_id TO parent_id;
ALTER TABLE work_unit_children RENAME COLUMN agent_id TO child_id;

-- Add trust columns
ALTER TABLE work_units ADD COLUMN trust_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE work_units ADD COLUMN trust_expires_at TIMESTAMP;
ALTER TABLE work_units ADD COLUMN delegated_by VARCHAR(255);

-- Create workspaces table (if not exists)
CREATE TABLE IF NOT EXISTS workspaces (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL DEFAULT 'permanent',
  departments JSONB DEFAULT '[]',
  expires_at TIMESTAMP,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL
);

-- Create work_unit_workspaces junction table
CREATE TABLE IF NOT EXISTS work_unit_workspaces (
  work_unit_id VARCHAR(255) REFERENCES work_units(id),
  workspace_id VARCHAR(255) REFERENCES workspaces(id),
  PRIMARY KEY (work_unit_id, workspace_id)
);

-- Drop old pipelines table after migration verification
-- DROP TABLE pipelines;  -- ONLY after verification!
```

### Data Migration Script

```python
# scripts/migrate_to_work_units.py
import asyncio
from dataflow import DataFlow

async def migrate():
    db = DataFlow(connection_string="postgresql://...")

    # 1. Verify all agents migrated
    agents = await db.execute("SELECT COUNT(*) FROM work_units WHERE type = 'atomic'")
    print(f"Atomic work units: {agents}")

    # 2. Verify all pipelines migrated
    composites = await db.execute("SELECT COUNT(*) FROM work_units WHERE type = 'composite'")
    print(f"Composite work units: {composites}")

    # 3. Verify relationships preserved
    relationships = await db.execute("SELECT COUNT(*) FROM work_unit_children")
    print(f"Work unit relationships: {relationships}")

    # 4. Set default trust status
    await db.execute("""
        UPDATE work_units
        SET trust_status = 'valid'
        WHERE trust_status = 'pending'
        AND created_by IN (SELECT id FROM users WHERE level >= 2)
    """)

if __name__ == "__main__":
    asyncio.run(migrate())
```

---

## State Management Migration

### Zustand Store Changes

```typescript
// OLD: stores/agentStore.ts
interface AgentStore {
  agents: Agent[];
  selectedAgent: Agent | null;
  fetchAgents: () => Promise<void>;
  createAgent: (data: CreateAgentInput) => Promise<Agent>;
  // ...
}

// OLD: stores/pipelineStore.ts
interface PipelineStore {
  pipelines: Pipeline[];
  selectedPipeline: Pipeline | null;
  fetchPipelines: () => Promise<void>;
  createPipeline: (data: CreatePipelineInput) => Promise<Pipeline>;
  // ...
}

// NEW: stores/workUnitStore.ts (unified)
interface WorkUnitStore {
  workUnits: WorkUnit[];
  selectedWorkUnit: WorkUnit | null;
  filters: WorkUnitFilters;

  // Fetching
  fetchWorkUnits: (filters?: WorkUnitFilters) => Promise<void>;
  selectWorkUnit: (id: string | null) => void;

  // CRUD
  createWorkUnit: (data: CreateWorkUnitInput) => Promise<WorkUnit>;
  updateWorkUnit: (id: string, data: UpdateWorkUnitInput) => Promise<void>;
  deleteWorkUnit: (id: string) => Promise<void>;

  // Execution
  runWorkUnit: (id: string, inputs: Record<string, unknown>) => Promise<RunResult>;

  // Trust (NEW)
  refreshTrustStatus: (id: string) => Promise<void>;
  requestDelegation: (id: string, delegateeId: string) => Promise<void>;
}

// Helper selectors
export const selectAtomicWorkUnits = (state: WorkUnitStore) =>
  state.workUnits.filter(wu => wu.type === 'atomic');

export const selectCompositeWorkUnits = (state: WorkUnitStore) =>
  state.workUnits.filter(wu => wu.type === 'composite');
```

---

## Testing Migration

### Test File Renames

| Old Path | New Path |
|----------|----------|
| `tests/agents.test.ts` | `tests/work-units.test.ts` |
| `tests/pipelines.test.ts` | Merged into `work-units.test.ts` |
| `tests/e2e/agent-flow.spec.ts` | `tests/e2e/work-unit-flow.spec.ts` |

### Updated Test Cases

```typescript
// tests/work-units.test.ts
describe('WorkUnits', () => {
  describe('Atomic Work Units (formerly Agents)', () => {
    it('should create an atomic work unit', async () => {
      const workUnit = await workUnitApi.create({
        name: 'Document Summarizer',
        type: 'atomic',
        capabilities: ['summarize'],
      });

      expect(workUnit.type).toBe('atomic');
      expect(workUnit.trustStatus).toBe('pending');
    });
  });

  describe('Composite Work Units (formerly Pipelines)', () => {
    it('should create a composite work unit with sub-units', async () => {
      const atomicUnit = await workUnitApi.create({
        name: 'Extractor',
        type: 'atomic',
      });

      const compositeUnit = await workUnitApi.create({
        name: 'Invoice Processor',
        type: 'composite',
        subUnitIds: [atomicUnit.id],
      });

      expect(compositeUnit.type).toBe('composite');
      expect(compositeUnit.subUnitCount).toBe(1);
    });
  });

  describe('Trust Integration (NEW)', () => {
    it('should validate trust before running', async () => {
      const workUnit = await workUnitApi.create({
        name: 'Secure Processor',
        type: 'atomic',
      });

      // Without trust established, run should fail
      await expect(workUnitApi.run(workUnit.id, {}))
        .rejects.toThrow('TRUST_INVALID');

      // Establish trust
      await trustApi.establish(workUnit.id, { delegateeId: testUser.id });

      // Now run should succeed
      const result = await workUnitApi.run(workUnit.id, {});
      expect(result.status).toBe('running');
    });
  });
});
```

---

## Migration Checklist

### Phase 1: Backend (Week 1)
- [ ] Database schema migration script
- [ ] API endpoint changes (with compatibility layer)
- [ ] Update backend models
- [ ] Add trust status to work units
- [ ] Create workspaces table
- [ ] Run data migration
- [ ] Verify data integrity

### Phase 2: Frontend Components (Week 2)
- [ ] Rename component files
- [ ] Update component interfaces
- [ ] Add trust status integration
- [ ] Implement WorkUnitCard unified design
- [ ] Add level-based rendering
- [ ] Update state management stores

### Phase 3: Navigation & Routes (Week 3)
- [ ] Update route structure
- [ ] Implement redirects for old URLs
- [ ] Update sidebar navigation
- [ ] Add level-based navigation filtering
- [ ] Update breadcrumbs

### Phase 4: User-Facing Strings (Week 4)
- [ ] Update all UI strings
- [ ] Update error messages
- [ ] Update documentation
- [ ] Update in-app help text
- [ ] Update email templates

### Phase 5: Testing & Verification (Week 5)
- [ ] Update unit tests
- [ ] Update integration tests
- [ ] Update E2E tests
- [ ] Manual QA testing
- [ ] Performance testing
- [ ] Accessibility testing

### Phase 6: Cleanup (Week 6)
- [ ] Remove deprecated components
- [ ] Remove API compatibility layer
- [ ] Remove old database tables
- [ ] Archive old documentation
- [ ] Update developer docs

---

## Rollback Plan

If critical issues are discovered:

1. **Immediate Rollback**:
   - Revert frontend to previous version
   - API compatibility layer allows old clients to work
   - No database rollback needed (additive changes only)

2. **Data Rollback**:
   ```sql
   -- Restore agents view
   CREATE VIEW agents AS
   SELECT * FROM work_units WHERE type = 'atomic';

   -- Restore pipelines view
   CREATE VIEW pipelines AS
   SELECT * FROM work_units WHERE type = 'composite';
   ```

3. **Feature Flags**:
   ```typescript
   // Enable/disable new UI via feature flag
   const useNewWorkUnitsUI = process.env.NEXT_PUBLIC_WORK_UNITS_UI === 'true';

   // In components
   if (useNewWorkUnitsUI) {
     return <WorkUnitCard workUnit={item} />;
   }
   return <AgentCard agent={item} />;  // Legacy
   ```

---

## Communication Plan

### Internal (Development Team)
- Migration kickoff meeting
- Daily standups during migration
- Slack channel for migration issues

### External (Users)
- Blog post announcing changes
- In-app banner 2 weeks before
- Guided tour on first login after migration
- Updated help documentation

### Sample Announcement

> **Introducing Work Units**
>
> We've simplified how you work with automation in Kaizen Studio. What were previously called "Agents" and "Pipelines" are now unified as **Work Units**.
>
> **What's changing:**
> - "Agents" → "Work Units" (atomic)
> - "Pipelines" → "Processes" or "Work Units" (composite)
> - "Share" → "Delegate"
>
> **What's new:**
> - Trust status visible on every work unit
> - Purpose-driven Workspaces
> - Level-based experience tailored to your role
>
> **Your data is safe.** All your existing agents and pipelines have been automatically migrated.

---

## References

- **Terminology Glossary**: `docs/plans/eatp-ontology/07-terminology-glossary.md`
- **Work Unit Model**: `docs/plans/eatp-ontology/02-work-unit-model.md`
- **Navigation Architecture**: `docs/plans/eatp-ontology/06-navigation-architecture.md`
