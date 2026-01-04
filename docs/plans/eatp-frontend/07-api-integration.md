# EATP Frontend: API Integration

## Document Control
- **Version**: 2.0
- **Date**: 2026-01-03
- **Status**: Planning (Updated for Ontology)
- **Author**: Kaizen Studio Team

---

## Overview

This document defines the API contracts between the frontend and backend for the EATP-integrated Kaizen Studio. All APIs follow RESTful conventions and use JSON:API-inspired response structures.

---

## Base Configuration

### API Client Setup

```typescript
// lib/api/client.ts
import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});
```

### Response Types

```typescript
// types/api.ts
interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    hasMore?: boolean;
  };
}

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

interface PaginationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
```

---

## Work Units API

### Types

```typescript
interface WorkUnit {
  id: string;
  name: string;
  description: string;
  type: 'atomic' | 'composite';
  capabilities: Capability[];
  trustStatus: TrustStatus;
  trustExpiresAt?: string;
  delegatedBy?: string;
  subUnitIds?: string[];  // For composite
  subUnitCount?: number;
  workspaceIds: string[];
  configuration: WorkUnitConfig;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface Capability {
  id: string;
  name: string;
  description: string;
}

type TrustStatus = 'valid' | 'expired' | 'revoked' | 'pending';

interface WorkUnitConfig {
  parameters: Parameter[];
  constraints: Constraint[];
}

interface Parameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'file' | 'select';
  required: boolean;
  default?: unknown;
  options?: string[];  // For select type
  description?: string;
}

interface Constraint {
  type: 'cost_limit' | 'time_window' | 'data_scope' | 'rate_limit';
  value: unknown;
  inherited?: boolean;  // From delegation chain
}
```

### Endpoints

#### List Work Units

```
GET /api/work-units
```

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| search | string | Search by name |
| type | 'atomic' \| 'composite' \| 'all' | Filter by type |
| trustStatus | TrustStatus \| 'all' | Filter by trust |
| workspaceId | string | Filter by workspace |
| page | number | Page number (default 1) |
| pageSize | number | Items per page (default 20) |

**Response**:
```json
{
  "data": [
    {
      "id": "wu-001",
      "name": "Invoice Processor",
      "description": "Processes and validates invoices",
      "type": "composite",
      "capabilities": [
        { "id": "cap-1", "name": "extract", "description": "Extract data" },
        { "id": "cap-2", "name": "validate", "description": "Validate data" }
      ],
      "trustStatus": "valid",
      "trustExpiresAt": "2026-12-31T23:59:59Z",
      "subUnitCount": 4,
      "workspaceIds": ["ws-001"],
      "createdAt": "2026-01-01T00:00:00Z",
      "createdBy": "user-001"
    }
  ],
  "meta": {
    "total": 24,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  }
}
```

#### Get Work Unit

```
GET /api/work-units/:id
```

**Response**:
```json
{
  "data": {
    "id": "wu-001",
    "name": "Invoice Processor",
    "description": "Processes and validates invoices",
    "type": "composite",
    "capabilities": [...],
    "trustStatus": "valid",
    "trustExpiresAt": "2026-12-31T23:59:59Z",
    "delegatedBy": "user-cfo",
    "subUnitIds": ["wu-002", "wu-003", "wu-004", "wu-005"],
    "subUnitCount": 4,
    "workspaceIds": ["ws-001"],
    "configuration": {
      "parameters": [
        {
          "name": "document",
          "type": "file",
          "required": true,
          "description": "Invoice document to process"
        }
      ],
      "constraints": [
        { "type": "cost_limit", "value": 500, "inherited": true },
        { "type": "time_window", "value": { "start": "09:00", "end": "18:00" } }
      ]
    },
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-02T00:00:00Z",
    "createdBy": "user-001"
  }
}
```

#### Create Work Unit

```
POST /api/work-units
```

**Request**:
```json
{
  "name": "Invoice Processor",
  "description": "Processes and validates invoices",
  "type": "composite",
  "capabilityIds": ["cap-1", "cap-2"],
  "subUnitIds": ["wu-002", "wu-003"],
  "configuration": {
    "parameters": [...],
    "constraints": [...]
  }
}
```

#### Run Work Unit

```
POST /api/work-units/:id/run
```

**Request**:
```json
{
  "inputs": {
    "document": "base64-encoded-content-or-file-id",
    "options": {
      "summaryLength": "standard"
    }
  }
}
```

**Response**:
```json
{
  "data": {
    "runId": "run-001",
    "status": "running",
    "startedAt": "2026-01-03T10:00:00Z",
    "estimatedDuration": 30
  }
}
```

#### Get Run Status

```
GET /api/work-units/:id/runs/:runId
```

**Response**:
```json
{
  "data": {
    "runId": "run-001",
    "status": "completed",
    "startedAt": "2026-01-03T10:00:00Z",
    "completedAt": "2026-01-03T10:00:25Z",
    "result": {
      "summary": "...",
      "extractedData": {...}
    }
  }
}
```

---

## Workspaces API

### Types

```typescript
interface Workspace {
  id: string;
  name: string;
  description: string;
  type: 'permanent' | 'temporary' | 'personal';
  departments: string[];
  workUnitCount: number;
  memberCount: number;
  expiresAt?: string;
  isArchived: boolean;
  createdAt: string;
  createdBy: string;
}

interface WorkspaceMember {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  role: 'owner' | 'admin' | 'member';
  accessLevel: 'full' | 'run_only';
  department: string;
  joinedAt: string;
}
```

### Endpoints

#### List Workspaces

```
GET /api/workspaces
```

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| search | string | Search by name |
| type | 'active' \| 'archived' \| 'all' | Filter by status |
| department | string | Filter by department |
| ownership | 'mine' \| 'shared' \| 'all' | Filter by ownership |

#### Get Workspace Details

```
GET /api/workspaces/:id
```

**Response**:
```json
{
  "data": {
    "id": "ws-001",
    "name": "Q4 Audit Prep",
    "description": "Cross-functional workspace for Q4 audit",
    "type": "temporary",
    "departments": ["Finance", "Legal", "Compliance"],
    "workUnitCount": 12,
    "memberCount": 5,
    "expiresAt": "2026-12-31T23:59:59Z",
    "isArchived": false,
    "createdAt": "2026-10-01T00:00:00Z",
    "createdBy": "user-001"
  }
}
```

#### Get Workspace Work Units

```
GET /api/workspaces/:id/work-units
```

**Response**:
```json
{
  "data": [
    {
      "id": "wu-001",
      "name": "Financial Report Generator",
      "type": "composite",
      "trustStatus": "valid",
      "department": "Finance"
    }
  ],
  "meta": {
    "byDepartment": {
      "Finance": 3,
      "Legal": 2,
      "Compliance": 2
    }
  }
}
```

#### Add Work Units to Workspace

```
POST /api/workspaces/:id/work-units
```

**Request**:
```json
{
  "workUnitIds": ["wu-001", "wu-002", "wu-003"]
}
```

#### Get Workspace Members

```
GET /api/workspaces/:id/members
```

#### Invite Member

```
POST /api/workspaces/:id/members
```

**Request**:
```json
{
  "userId": "user-003",
  "role": "member",
  "accessLevel": "run_only"
}
```

---

## Trust API

### Types

```typescript
interface TrustChain {
  workUnitId: string;
  chain: TrustLink[];
  status: TrustStatus;
  expiresAt?: string;
}

interface TrustLink {
  delegatorId: string;
  delegatorName: string;
  delegateeId: string;
  delegateeName: string;
  capabilities: string[];
  constraints: Constraint[];
  createdAt: string;
  expiresAt?: string;
}

interface DelegationRecord {
  id: string;
  workUnitId: string;
  workUnitName: string;
  delegatorId: string;
  delegatorName: string;
  delegateeId: string;
  delegateeName: string;
  capabilities: string[];
  constraints: Constraint[];
  status: 'active' | 'expired' | 'revoked';
  createdAt: string;
  expiresAt?: string;
  revokedAt?: string;
}
```

### Endpoints

#### Get Trust Chain

```
GET /api/work-units/:id/trust
```

**Response**:
```json
{
  "data": {
    "workUnitId": "wu-001",
    "status": "valid",
    "expiresAt": "2026-12-31T23:59:59Z",
    "chain": [
      {
        "delegatorId": "user-ceo",
        "delegatorName": "CEO",
        "delegateeId": "user-cfo",
        "delegateeName": "CFO",
        "capabilities": ["*"],
        "constraints": [{ "type": "cost_limit", "value": 10000 }],
        "createdAt": "2026-01-01T00:00:00Z"
      },
      {
        "delegatorId": "user-cfo",
        "delegatorName": "CFO",
        "delegateeId": "user-manager",
        "delegateeName": "Finance Manager",
        "capabilities": ["run", "configure"],
        "constraints": [{ "type": "cost_limit", "value": 500 }],
        "createdAt": "2026-01-15T00:00:00Z"
      }
    ]
  }
}
```

#### Create Delegation

```
POST /api/work-units/:id/delegate
```

**Request**:
```json
{
  "delegateeId": "user-003",
  "capabilities": ["run"],
  "constraints": [
    { "type": "cost_limit", "value": 250 }
  ],
  "expiresAt": "2026-02-03T00:00:00Z"
}
```

**Response**:
```json
{
  "data": {
    "id": "del-001",
    "workUnitId": "wu-001",
    "delegateeId": "user-003",
    "delegateeName": "Alice Chen",
    "capabilities": ["run"],
    "constraints": [
      { "type": "cost_limit", "value": 250 }
    ],
    "status": "active",
    "createdAt": "2026-01-03T10:00:00Z",
    "expiresAt": "2026-02-03T00:00:00Z"
  }
}
```

#### List My Delegations (Level 2)

```
GET /api/delegations
```

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| direction | 'given' \| 'received' \| 'all' | Filter by direction |
| status | 'active' \| 'expired' \| 'all' | Filter by status |

#### Revoke Delegation

```
DELETE /api/delegations/:id
```

---

## User & Level API

### Types

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  department: string;
  level: 1 | 2 | 3;
  trustPosture: TrustPosture;
}

type TrustPosture =
  | 'pseudo_agent'
  | 'supervised_autonomy'
  | 'shared_planning'
  | 'continuous_insight'
  | 'delegation_at_scale';

interface UserPermissions {
  canRun: boolean;
  canConfigure: boolean;
  canDelegate: boolean;
  canCreateWorkUnits: boolean;
  canManageWorkspaces: boolean;
  canViewValueChains: boolean;
  canAccessCompliance: boolean;
  canEstablishTrust: boolean;
}
```

### Endpoints

#### Get Current User

```
GET /api/users/me
```

**Response**:
```json
{
  "data": {
    "id": "user-001",
    "name": "Alice Chen",
    "email": "alice@company.com",
    "avatarUrl": "https://...",
    "department": "Finance",
    "level": 2,
    "trustPosture": "shared_planning",
    "permissions": {
      "canRun": true,
      "canConfigure": true,
      "canDelegate": true,
      "canCreateWorkUnits": true,
      "canManageWorkspaces": true,
      "canViewValueChains": false,
      "canAccessCompliance": false,
      "canEstablishTrust": false
    }
  }
}
```

#### Search Users (for delegation)

```
GET /api/users/search
```

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| q | string | Search query |
| department | string | Filter by department |
| excludeSelf | boolean | Exclude current user |

---

## Value Chains API (Level 3)

### Types

```typescript
interface ValueChain {
  id: string;
  name: string;
  description: string;
  departments: DepartmentNode[];
  workUnitCount: number;
  activeUserCount: number;
  status: 'active' | 'warning' | 'error';
  trustHealth: {
    valid: number;
    expiring: number;
    expired: number;
    revoked: number;
  };
  lastAuditAt: string;
  createdAt: string;
}

interface DepartmentNode {
  department: string;
  workUnits: string[];
  order: number;
}
```

### Endpoints

#### List Value Chains

```
GET /api/value-chains
```

#### Get Value Chain

```
GET /api/value-chains/:id
```

#### Get Value Chain Trust Map

```
GET /api/value-chains/:id/trust-map
```

---

## Compliance API (Level 3)

### Endpoints

#### Get Trust Health Summary

```
GET /api/compliance/trust-health
```

**Response**:
```json
{
  "data": {
    "summary": {
      "valid": 247,
      "expiring": 12,
      "expired": 3,
      "revoked": 1
    },
    "healthPercentage": 87,
    "expiringByDepartment": {
      "Finance": 5,
      "Legal": 4,
      "Compliance": 3
    }
  }
}
```

#### Get Constraint Violations

```
GET /api/compliance/violations
```

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| startDate | string | Start date (ISO) |
| endDate | string | End date (ISO) |
| type | string | Violation type |
| department | string | Filter by department |

#### Get Audit Trail

```
GET /api/compliance/audit-trail
```

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| startDate | string | Start date (ISO) |
| endDate | string | End date (ISO) |
| eventType | string | Filter by event type |
| userId | string | Filter by user |
| workUnitId | string | Filter by work unit |

---

## Activity API

### Types

```typescript
interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  userId: string;
  userName: string;
  workUnitId?: string;
  workUnitName?: string;
  workspaceId?: string;
  workspaceName?: string;
  details: Record<string, unknown>;
  timestamp: string;
}

type ActivityEventType =
  | 'work_unit_run'
  | 'work_unit_created'
  | 'work_unit_updated'
  | 'delegation_created'
  | 'delegation_revoked'
  | 'workspace_created'
  | 'workspace_member_added'
  | 'constraint_violation'
  | 'trust_expired';
```

### Endpoints

#### Get Activity Feed

```
GET /api/activity
```

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| scope | 'personal' \| 'team' \| 'all' | Activity scope |
| workUnitId | string | Filter by work unit |
| workspaceId | string | Filter by workspace |
| eventType | string | Filter by event type |

---

## React Query Hooks

### Work Units Hooks

```typescript
// hooks/useWorkUnits.ts
export function useWorkUnits(filters: WorkUnitFilters) {
  return useQuery({
    queryKey: ['workUnits', filters],
    queryFn: () => workUnitApi.list(filters),
  });
}

export function useWorkUnit(id: string) {
  return useQuery({
    queryKey: ['workUnit', id],
    queryFn: () => workUnitApi.get(id),
    enabled: !!id,
  });
}

export function useRunWorkUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, inputs }: { id: string; inputs: Record<string, unknown> }) =>
      workUnitApi.run(id, inputs),
    onSuccess: (data, { id }) => {
      // Invalidate activity feed
      queryClient.invalidateQueries(['activity']);
      // Optionally refetch work unit for updated stats
      queryClient.invalidateQueries(['workUnit', id]);
    },
  });
}

export function useCreateWorkUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkUnitInput) => workUnitApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workUnits']);
      toast.success('Work unit created successfully');
    },
  });
}

export function useDelegate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workUnitId, data }: { workUnitId: string; data: DelegateInput }) =>
      trustApi.delegate(workUnitId, data),
    onSuccess: (_, { workUnitId }) => {
      queryClient.invalidateQueries(['workUnit', workUnitId, 'trust']);
      queryClient.invalidateQueries(['delegations']);
      toast.success('Delegation created');
    },
  });
}
```

### Workspace Hooks

```typescript
// hooks/useWorkspaces.ts
export function useWorkspaces(filters: WorkspaceFilters) {
  return useQuery({
    queryKey: ['workspaces', filters],
    queryFn: () => workspaceApi.list(filters),
  });
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: ['workspace', id],
    queryFn: () => workspaceApi.get(id),
    enabled: !!id,
  });
}

export function useWorkspaceWorkUnits(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace', workspaceId, 'workUnits'],
    queryFn: () => workspaceApi.getWorkUnits(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace', workspaceId, 'members'],
    queryFn: () => workspaceApi.getMembers(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, data }: { workspaceId: string; data: InviteMemberInput }) =>
      workspaceApi.inviteMember(workspaceId, data),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries(['workspace', workspaceId, 'members']);
      toast.success('Invitation sent');
    },
  });
}
```

---

## Error Handling

### Error Codes

| Code | Description |
|------|-------------|
| `TRUST_INVALID` | Trust chain is invalid or expired |
| `TRUST_EXPIRED` | Trust has expired |
| `TRUST_REVOKED` | Trust has been revoked |
| `CONSTRAINT_EXCEEDED` | Constraint limit exceeded |
| `INSUFFICIENT_LEVEL` | User level too low for action |
| `NOT_DELEGATED` | User not delegated for this work unit |
| `DELEGATION_FAILED` | Cannot delegate (constraint tightening) |
| `WORKSPACE_EXPIRED` | Workspace has expired |

### Error Handler

```typescript
function handleApiError(error: ApiError): void {
  const messages: Record<string, string> = {
    TRUST_INVALID: 'Trust verification failed. Please contact your administrator.',
    TRUST_EXPIRED: 'Your access has expired. Please request renewal.',
    CONSTRAINT_EXCEEDED: 'You have exceeded your usage limits.',
    INSUFFICIENT_LEVEL: 'You do not have permission for this action.',
    NOT_DELEGATED: 'You have not been delegated access to this work unit.',
  };

  toast.error(messages[error.code] || error.message);
}
```

---

## References

- **Work Units UI**: `docs/plans/eatp-frontend/03-work-units-ui.md`
- **Workspaces UI**: `docs/plans/eatp-frontend/04-workspaces-ui.md`
- **EATP Mapping**: `docs/plans/eatp-ontology/05-eatp-mapping.md`
