# Gateways Feature

The Gateways feature provides gateway management, environment promotion, and scaling controls for deployed services.

## Feature Location

```
src/features/gateways/
├── types/
│   └── gateway.ts          # Type definitions
├── api/
│   └── gateways.ts         # API client
├── hooks/
│   └── useGateways.ts      # React Query hooks
├── components/
│   ├── GatewayCard.tsx     # Gateway display card
│   ├── GatewayList.tsx     # Filterable gateway list
│   ├── GatewayHealth.tsx   # Health metrics display
│   ├── GatewayDashboard.tsx # Main dashboard
│   ├── PromotionDialog.tsx # Environment promotion
│   ├── PromotionHistory.tsx # Promotion history
│   ├── ScalingPolicyList.tsx # Scaling policies
│   ├── ScalingPolicyEditor.tsx # Policy editor
│   ├── ScalingEventTimeline.tsx # Scaling events
│   └── ManualScaleControls.tsx # Manual scaling
└── index.ts                # Barrel exports
```

## Types

### Gateway
```typescript
interface Gateway {
  id: string;
  name: string;
  description?: string;
  environment: GatewayEnvironment;
  status: GatewayStatus;
  endpoint: string;
  version: string;
  replicas: number;
  minReplicas: number;
  maxReplicas: number;
  scalingMode: 'auto' | 'manual';
  createdAt: string;
  updatedAt: string;
}

type GatewayEnvironment = 'development' | 'staging' | 'production';
type GatewayStatus = 'healthy' | 'degraded' | 'down' | 'unknown';
```

### ScalingPolicy
```typescript
interface ScalingPolicy {
  id: string;
  gatewayId: string;
  name: string;
  metric: 'cpu' | 'memory' | 'requests' | 'latency';
  targetValue: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  minReplicas: number;
  maxReplicas: number;
  cooldownSeconds: number;
  enabled: boolean;
}
```

## Hooks

| Hook | Description |
|------|-------------|
| `useGateways(filters?)` | List gateways with filtering |
| `useGateway(id)` | Get single gateway |
| `useGatewayHealth(id)` | Get health metrics |
| `usePromotions(gatewayId)` | Promotion history |
| `usePromoteGateway()` | Promote to environment |
| `useScalingPolicies(gatewayId)` | List scaling policies |
| `useCreateScalingPolicy()` | Create new policy |
| `useUpdateScalingPolicy()` | Update policy |
| `useDeleteScalingPolicy()` | Delete policy |
| `useScalingEvents(gatewayId?)` | Scaling events |
| `useManualScale()` | Manual replica scaling |

## Components

### GatewayCard
Display a single gateway with status and actions.

```tsx
import { GatewayCard } from '@/features/gateways';

<GatewayCard
  gateway={gateway}
  onViewDetails={(gw) => navigate(`/gateways/${gw.id}`)}
  onPromote={(gw) => setPromoteGateway(gw)}
  onScale={(gw) => setScaleGateway(gw)}
/>
```

### GatewayList
Filterable list of gateways with search, environment, and status filters.

```tsx
import { GatewayList } from '@/features/gateways';

<GatewayList
  onViewDetails={handleViewDetails}
  onPromote={handlePromote}
  onScale={handleScale}
/>
```

### GatewayHealth
Display health metrics for a gateway.

```tsx
import { GatewayHealth } from '@/features/gateways';

<GatewayHealth
  gatewayId="gw-123"
  gatewayName="API Gateway"
/>
```

### ScalingPolicyList
Manage scaling policies for a gateway.

```tsx
import { ScalingPolicyList } from '@/features/gateways';

<ScalingPolicyList gatewayId="gw-123" />
```

### ManualScaleControls
Manual replica scaling with slider and input.

```tsx
import { ManualScaleControls } from '@/features/gateways';

<ManualScaleControls
  gateway={gateway}
  onSuccess={() => refetch()}
/>
```

### PromotionDialog
Promote gateway to next environment.

```tsx
import { PromotionDialog } from '@/features/gateways';

<PromotionDialog
  gateway={gateway}
  open={isOpen}
  onOpenChange={setIsOpen}
/>
```

## Environment Promotion Flow

1. Development → Staging → Production
2. Production gateways cannot be promoted further
3. Promotion creates a record in promotion history
4. Optional approval workflow for production promotions

## Scaling Modes

### Auto Scaling
- Define scaling policies based on metrics
- Automatic scale up/down based on thresholds
- Cooldown period to prevent thrashing

### Manual Scaling
- Direct replica count adjustment
- Slider and numeric input controls
- Optional reason for audit trail
