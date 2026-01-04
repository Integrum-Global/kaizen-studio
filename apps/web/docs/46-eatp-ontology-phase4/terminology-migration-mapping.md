# Terminology Migration Mapping

Phase 4 of the EATP Ontology Redesign requires migrating from Agent/Pipeline terminology to the new Work Unit model.

## Terminology Rules

### Terms to Migrate

| Old Term | New Term (Level 1) | New Term (Level 2) | New Term (Level 3) |
|----------|-------------------|-------------------|-------------------|
| Agent | Task | Work Unit | Work Unit |
| Pipeline | — | Process | Value Chain |
| Agent Designer | — | Work Unit Builder | Work Unit Builder |
| Pipeline Canvas | — | Process Designer | Process Designer |
| Create Agent | Run Task | Create Work Unit | Create Work Unit |
| Run Agent | Run Task | Execute Work Unit | Execute Work Unit |

### Terms to KEEP (Technical/Protocol Names)

The following terms are **protocol names** and should NOT be changed:

- **Enterprise Agent Trust Protocol (EATP)** - The protocol name itself
- **Agent Registry** - EATP technical component
- **A2A (Agent-to-Agent)** - Protocol for agent communication
- **Specialist Agent** - Technical role in EATP trust chains
- **External Agent** - Technical integration pattern
- **Agent ID** - Technical identifier in trust contexts
- **TrustedAgent** - EATP interface type

## Files Requiring Migration

### High Priority - User-Facing Navigation

| File | Current Text | New Text | Line(s) |
|------|-------------|----------|---------|
| `src/components/layout/Sidebar.tsx` | "Pipelines" | "Processes" | 44 |
| `src/components/layout/MobileSidebar.tsx` | "Pipelines" | "Processes" | 42 |
| `src/pages/Dashboard.tsx` | "New Agent" | "New Work Unit" | 128 |
| `src/pages/Dashboard.tsx` | "New Pipeline" | "New Process" | 134 |
| `src/pages/Dashboard.tsx` | "Running Pipelines" | "Active Processes" | 201 |

### High Priority - Page Titles

| File | Current Text | New Text |
|------|-------------|----------|
| `src/pages/agents/AgentsPage.tsx` | "Create Agent" | "Create Work Unit" |
| `src/pages/pipelines/PipelinesPage.tsx` | "Pipelines" | "Processes" |
| `src/pages/pipelines/PipelinesPage.tsx` | "Create Pipeline" | "Create Process" |
| `src/pages/pipelines/PipelineEditorPage.tsx` | "Pipeline Editor" | "Process Designer" |

### Medium Priority - Forms & Components

| File | Current Text | New Text |
|------|-------------|----------|
| `src/features/agents/components/AgentForm.tsx` | "Create Agent" | "Create Work Unit" |
| `src/features/agents/components/AgentForm.tsx` | "Update Agent" | "Update Work Unit" |
| `src/features/agents/components/AgentCard.tsx` | "Unnamed Agent" | "Unnamed Work Unit" |
| `src/features/agents/components/AgentFormDialog.tsx` | "Edit Agent" | "Edit Work Unit" |
| `src/features/agents/components/AgentFormDialog.tsx` | "Create New Agent" | "Create New Work Unit" |
| `src/features/deployments/components/DeploymentForm.tsx` | "Pipeline ID" | "Process ID" |

### Medium Priority - Canvas Components

| File | Current Text | New Text |
|------|-------------|----------|
| `src/features/pipelines/components/canvas/NodePalette.tsx` | "Agent" node label | "Work Unit" |
| `src/features/pipelines/components/canvas/NodeConfigPanel.tsx` | "Select Agent" | "Select Work Unit" |
| `src/features/pipelines/components/nodes/AgentNode.tsx` | "Agent Node" | "Work Unit Node" |

### Low Priority - Help Content

| File | Current Text | New Text |
|------|-------------|----------|
| `src/features/help/data/articles.ts` | "Creating Your First Agent" | "Creating Your First Work Unit" |
| `src/features/help/data/articles.ts` | "What is an Agent?" | "What is a Work Unit?" |
| `src/features/help/data/articles.ts` | "Building a Pipeline" | "Building a Process" |
| `src/features/help/data/articles.ts` | "Pipeline Canvas" | "Process Designer" |

## Files to EXCLUDE from Migration

These files contain EATP protocol terminology that should remain unchanged:

### Trust Feature Files (KEEP AS-IS)
- `src/features/trust/**` - All EATP trust components use "Agent" as protocol term
- `src/features/external-agents/**` - External agent integration (technical)
- API response types using `agent_id`, `agent_name` from backend

### Type Definition Files (KEEP AS-IS)
- `src/features/trust/types/index.ts` - EATP type definitions
- `src/features/agents/types/agent.ts` - Backend API types (must match backend)

### Test Files (UPDATE CAREFULLY)
Test files should be updated only if they test user-facing strings.
Internal test fixtures using `agent` IDs can remain unchanged.

## Migration Strategy

### Phase 1: Navigation & Page Titles (Day 1)
1. Update Sidebar navigation labels
2. Update page titles and headings
3. Run tests to verify no breakage

### Phase 2: Forms & Components (Day 2)
1. Update form labels and button text
2. Update card and list component text
3. Update dialog titles

### Phase 3: Canvas & Editor (Day 3)
1. Update node type labels
2. Update config panel labels
3. Update editor toolbar text

### Phase 4: Help Content (Day 4)
1. Update help article titles
2. Update help article content
3. Verify search still works

## Verification Checklist

After migration, verify:

- [ ] No "Agent" appears in sidebar navigation
- [ ] No "Pipeline" appears in sidebar navigation
- [ ] Page titles use new terminology
- [ ] Form labels use new terminology
- [ ] Button labels use new terminology
- [ ] Help articles use new terminology
- [ ] EATP/Trust features still use correct protocol terms
- [ ] All tests pass
- [ ] No TypeScript errors

## Notes

1. **Backend API contracts remain unchanged** - Only UI strings are migrated
2. **Type names can remain** - `Agent` type can still exist in code
3. **Variable names can remain** - `pipelineId` etc. don't need renaming
4. **Only user-visible strings** need migration
