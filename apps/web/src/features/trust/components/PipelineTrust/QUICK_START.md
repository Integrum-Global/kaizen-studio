# Pipeline Trust Integration - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Import Components

```typescript
import {
  PipelineTrustOverlay,
  PipelineTrustValidator,
  AgentTrustStatus,
  usePipelineTrustValidation,
} from "@/features/trust";
```

### Step 2: Add Trust Overlay to Pipeline Canvas

```tsx
// In your PipelineCanvas component
function PipelineCanvas() {
  const [showTrust, setShowTrust] = useState(true);
  const pipelineId = "your-pipeline-id";
  const agentIds = ["agent-1", "agent-2"]; // From your pipeline state

  return (
    <div className="flex h-screen">
      {/* Your canvas content */}
      <div className="flex-1">{/* Canvas nodes here */}</div>

      {/* Add trust overlay */}
      {showTrust && (
        <PipelineTrustOverlay
          pipelineId={pipelineId}
          agentIds={agentIds}
          onClose={() => setShowTrust(false)}
        />
      )}
    </div>
  );
}
```

### Step 3: Add Trust Badge to Pipeline Nodes

```tsx
// In your PipelineNode component
function PipelineNode({ agent }) {
  return (
    <div className="relative">
      {/* Your node UI */}
      <div className="rounded-lg border bg-white p-4">{agent.name}</div>

      {/* Add trust badge */}
      <div className="absolute -right-2 -top-2">
        <AgentTrustStatus
          agentId={agent.id}
          agentName={agent.name}
          trustStatus={agent.trustStatus}
        />
      </div>
    </div>
  );
}
```

### Step 4: Add Pre-Execution Validation

```tsx
// In your ExecutePipeline dialog/modal
function ExecutePipelineDialog({ pipelineId, agentIds }) {
  const handleExecute = () => {
    // Run your pipeline
    console.log("Executing pipeline...");
  };

  return (
    <Dialog>
      <DialogContent>
        <PipelineTrustValidator
          pipelineId={pipelineId}
          agentIds={agentIds}
          blockExecutionOnFailure={true}
          onExecute={handleExecute}
        />
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📊 Component Comparison

| Component                  | Use Case                         | Where to Use          |
| -------------------------- | -------------------------------- | --------------------- |
| `PipelineTrustOverlay`     | Show all agents trust status     | Pipeline canvas       |
| `AgentTrustStatus`         | Show single agent status         | On pipeline nodes     |
| `PipelineTrustValidator`   | Validate before execution        | Execution modal       |
| `usePipelineTrustValidation` | Custom validation logic        | Any component         |

---

## 🎨 Visual Examples

### TrustOverlay Panel
```
┌─────────────────────────────────┐
│ 🛡️ Trust Status          [↓] [×] │
├─────────────────────────────────┤
│ Pipeline Status: Ready          │
│ ┌───────┬───────┬───────────┐  │
│ │   3   │   2   │     1     │  │
│ │ Total │Trusted│ Untrusted │  │
│ └───────┴───────┴───────────┘  │
│                                 │
│ Agents:                         │
│ ┌───────────────────────────┐  │
│ │ ✓ Data Processor    VALID │  │
│ │   agent-1                 │  │
│ └───────────────────────────┘  │
│ ┌───────────────────────────┐  │
│ │ × Model Inference INVALID │  │
│ │   agent-2                 │  │
│ │   Missing: model_inference│  │
│ │ [View] [Establish Trust]  │  │
│ └───────────────────────────┘  │
└─────────────────────────────────┘
```

### AgentTrustStatus Badge
```
Pipeline Node:
┌─────────────────────┐
│  Data Processor     │  [●]  <- Trust badge
│  agent-123          │
└─────────────────────┘

Click badge → Shows popup:
┌─────────────────────────┐
│ 🛡️ Data Processor       │
│ agent-123               │
│ Status: Valid ✓         │
│ Capabilities: ✓ All OK  │
│ [View Details]          │
└─────────────────────────┘
```

---

## 🔧 Common Configurations

### Enable Auto-Refresh
```tsx
usePipelineTrustValidation(pipelineId, agentIds, capabilities, {
  refetchInterval: 5000, // Refresh every 5 seconds
});
```

### Custom Cache Duration
```tsx
usePipelineTrustValidation(pipelineId, agentIds, capabilities, {
  staleTime: 60000, // Cache for 1 minute
});
```

### Allow Execution Despite Failures
```tsx
<PipelineTrustValidator
  blockExecutionOnFailure={false} // Warning only
  onExecute={handleExecute}
/>
```

---

## 🐛 Troubleshooting

### Issue: Trust overlay not showing
**Solution**: Check that `agentIds` array is not empty

### Issue: Badge not appearing on node
**Solution**: Ensure node has `position: relative` styling

### Issue: Validation always pending
**Solution**: Verify `pipelineId` and `agentIds` are provided

### Issue: TypeScript errors
**Solution**: Import types from `@/features/trust`:
```typescript
import type { TrustStatus } from "@/features/trust";
```

---

## 📚 Additional Resources

- **Full Documentation**: See `README.md`
- **Complete Examples**: See `USAGE_EXAMPLE.tsx`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`

---

## ✅ Checklist for Integration

- [ ] Import components from `@/features/trust`
- [ ] Add `PipelineTrustOverlay` to pipeline canvas
- [ ] Add `AgentTrustStatus` badges to pipeline nodes
- [ ] Add `PipelineTrustValidator` to execution flow
- [ ] Wire up `onViewAgent` callback
- [ ] Wire up `onEstablishTrust` callback
- [ ] Test with various trust states (valid, invalid, expired)
- [ ] Test execution blocking behavior
- [ ] Verify responsive design on mobile/desktop

---

## 🎯 Next Steps

1. **Integrate with Pipeline Canvas**: Add components to existing pipeline UI
2. **Connect Backend API**: Ensure API endpoints return expected data shape
3. **Add Error Boundaries**: Wrap components in error boundaries for robustness
4. **Add Analytics**: Track user interactions with trust components
5. **Write Tests**: Add unit and integration tests (not included per requirements)
