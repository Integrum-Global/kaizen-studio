# Lineage Visualization Guide

## Overview

The Lineage Viewer provides an interactive graph visualization of external agent invocation flows, showing how data moves from workflows through external agents to webhook platforms.

## Accessing Lineage

1. Navigate to **Settings** → **External Agents**
2. Click any agent in the list
3. Open the **Lineage** tab in the details modal

**Note**: Lineage data appears after the agent has been invoked at least once.

## Graph Elements

### Node Types

**External Agent Node** (Purple Border):
- **Visual**: Purple border (#8B5CF6), platform icon, agent name
- **Represents**: The external agent integration point
- **Data**: Agent name, provider, webhook URL (in tooltip)

**Workflow Node** (Blue Border):
- **Visual**: Blue border (#3B82F6), workflow icon, workflow name
- **Represents**: Kaizen workflow that invokes the external agent
- **Data**: Workflow name, execution timestamp

**Webhook Node** (Gray Border):
- **Visual**: Gray border (#6B7280), webhook icon, endpoint name
- **Represents**: Final webhook delivery endpoint
- **Data**: Webhook URL, delivery status

### Edges (Connections)

- **Arrows**: Show data flow direction (left to right)
- **Labels**: May include metadata (request size, response time)
- **Style**: Solid lines with arrowheads

## Interacting with the Graph

### Zoom

- **Mouse Wheel**: Scroll to zoom in/out
- **Controls**: Click + / - buttons in bottom-right
- **Double Click**: Zoom to node
- **Min/Max**: 10% to 200% zoom

### Pan

- **Click and Drag**: Move graph around canvas
- **Touchpad**: Two-finger drag
- **Touch Screen**: Single finger drag

### Fit View

Click the "Fit View" button (📐 icon) to auto-zoom and center all nodes.

### Minimap

- **Location**: Bottom-right corner (when enabled)
- **Purpose**: Navigate large graphs
- **Interaction**: Click to jump to area

### Node Selection

- **Click**: Select node (highlights connected edges)
- **Hover**: Show tooltip with metadata
- **Keyboard**: Tab to navigate, Enter to select

## Node Details

### External Agent Node Details

Hovering over an external agent node shows:

- **Provider**: Platform name (Teams, Discord, etc.)
- **Webhook URL**: Delivery endpoint (truncated if long)
- **Status**: Active, Inactive, Deleted
- **Last Invocation**: Timestamp of most recent invocation

Click the node to open a detail panel showing:

- Full configuration
- Recent invocations via this hop
- Error messages (if any)
- Performance metrics (execution time, success rate)

### Workflow Node Details

Hovering shows:

- **Workflow Name**
- **Created By**: User who created workflow
- **Last Execution**: Timestamp

Click to navigate to workflow details page.

### Webhook Node Details

Hovering shows:

- **Endpoint URL**
- **Delivery Status**: Pending, Delivered, Failed
- **Response Code**: HTTP status code
- **Retry Count**: Number of delivery attempts

## Graph Layout

### Auto-Layout Algorithm

The lineage viewer uses a horizontal layout algorithm:

- **Direction**: Left to right (workflows → agents → webhooks)
- **Levels**: Nodes arranged in dependency levels
- **Spacing**: 300px horizontal, 150px vertical between nodes

### Manual Repositioning

- **Drag Nodes**: Click and drag to reposition
- **Reset**: Click "Fit View" to restore auto-layout

## Filtering (Coming Soon)

Future updates will support:

- **By Provider**: Show only Teams or Discord nodes
- **By Status**: Show only successful or failed paths
- **By Date**: Filter by invocation time range
- **By Workflow**: Show lineage for specific workflow

## Performance

### Large Graphs

For workflows with 50+ nodes:

- Use minimap for navigation
- Zoom to focus on specific areas
- Use search (coming soon) to jump to nodes

### Refresh

Lineage data auto-refreshes every 60 seconds. To manually refresh:

1. Close details modal
2. Reopen details modal
3. Navigate to Lineage tab

## Exporting Lineage

To export lineage for documentation or analysis:

1. Take screenshot (browser screenshot tool)
2. Or use browser "Print to PDF" function
3. Or download as JSON (coming soon)

## Troubleshooting

### No Lineage Data

**Possible causes**:
- Agent has not been invoked yet
- Lineage service is offline
- Invocations occurred before lineage tracking was enabled

**Solutions**:
1. Invoke the agent via a workflow
2. Wait 30 seconds for lineage to generate
3. Refresh the page

### Missing Nodes

**Possible causes**:
- Node is outside viewport (zoomed in)
- Node was filtered out (future feature)
- Lineage data incomplete

**Solutions**:
1. Click "Fit View" to see all nodes
2. Zoom out
3. Check if all related workflows are deployed

### Purple Border Not Showing

**Possible causes**:
- Browser CSS issue
- Dark mode rendering issue
- React Flow version incompatibility

**Solutions**:
1. Refresh page (Ctrl+R / Cmd+R)
2. Clear browser cache
3. Try different browser
4. Check browser console for errors

## Best Practices

### Graph Readability

- **Limit Complexity**: Keep workflows focused (< 20 nodes)
- **Use Descriptive Names**: Name agents clearly (e.g., "Production Alerts to Teams")
- **Group Related Flows**: Use tags to organize agents

### Debugging Workflows

Use lineage to:

1. **Trace Failures**: Find where invocation failed
2. **Identify Bottlenecks**: See which hops are slow
3. **Verify Routing**: Confirm data goes to correct endpoints
4. **Audit Compliance**: Track all data flows for compliance

### Performance Optimization

If lineage graph is slow:

1. **Reduce Graph Size**: Archive old workflows
2. **Limit Invocations**: Set governance rate limits
3. **Use Minimap**: Navigate without panning
4. **Close Other Tabs**: Free browser memory

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Zoom In | + |
| Zoom Out | - |
| Fit View | 0 (zero) |
| Reset | R |
| Close Modal | Escape |

## Accessibility

The lineage viewer is partially accessible:

- ✅ Keyboard navigation to graph container
- ✅ ARIA labels on controls
- ⚠️ Limited keyboard navigation within graph (React Flow limitation)
- ✅ Text-based alternative in Overview tab

For full accessibility, use the Invocations tab for text-based lineage data.

## Technical Details

### React Flow Configuration

```typescript
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={{ externalAgent: ExternalAgentNode }}
  fitView
  minZoom={0.1}
  maxZoom={2}
/>
```

### Custom Node Styling

External agent nodes use custom CSS:

```css
.external-agent-node {
  border: 2px solid #8B5CF6; /* Purple */
  border-radius: 8px;
  padding: 12px;
  background: white;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
```

### Data Structure

Lineage graph API response:

```json
{
  "nodes": [
    {
      "id": "agent-123",
      "type": "external_agent",
      "label": "Teams Notifications",
      "provider": "teams",
      "metadata": {
        "webhook_url": "https://teams.webhook.office.com/..."
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "workflow-456",
      "target": "agent-123",
      "label": "invokes"
    }
  ]
}
```

## Future Enhancements

- [ ] Search nodes by name
- [ ] Filter by provider, status, date
- [ ] Export as PNG, SVG, JSON
- [ ] Animate data flow
- [ ] Show real-time invocations
- [ ] Collapsible node groups
- [ ] Side-by-side comparison
- [ ] Time-based playback
