# Condition Templates

## Overview

Templates provide pre-configured conditions for common policy patterns. Users can apply a template with one click, then customize as needed.

## Common Templates

These appear in the quick template bar:

### Team Access
Restrict access to specific teams.
```typescript
{
  category: 'user',
  attribute: 'user_team',
  operator: 'in',
  value: []  // User selects teams
}
```

### Business Hours
Allow access only during standard work hours.
```typescript
{
  category: 'time',
  attribute: 'time_hours',
  operator: 'between',
  value: {
    startHour: 9,
    endHour: 17,
    days: [1, 2, 3, 4, 5]  // Mon-Fri
  }
}
```

### IP Restriction
Limit access to specific IP addresses or ranges.
```typescript
{
  category: 'context',
  attribute: 'context_ip',
  operator: 'in',
  value: []  // User enters IPs
}
```

### Specific Agent
Control access to selected agents.
```typescript
{
  category: 'resource',
  attribute: 'resource_agent',
  operator: 'in',
  value: []  // User selects agents
}
```

## Extended Templates

Available in the "More Templates" modal:

| Template | Category | Description |
|----------|----------|-------------|
| Admin Only | access | Restrict to admin roles |
| Company Email | access | Require specific email domain |
| Resource Owner | access | Only creator can access |
| Production Only | environment | Restrict to production |
| Non-Production | environment | Allow only dev/staging |
| Active Only | environment | Only active resources |
| Weekdays Only | time | Monday through Friday |
| Weekends Only | time | Saturday and Sunday |
| Internal Network | security | Private IP ranges only |

## Using Templates

### Apply Template
```tsx
import { ConditionTemplates, ConditionTemplatesModal } from '@/features/governance/components/conditions';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  const handleApply = (template) => {
    // Add template conditions to your list
    setConditions([...conditions, ...template.conditions]);
  };

  return (
    <>
      <ConditionTemplates
        onApplyTemplate={handleApply}
        onOpenModal={() => setShowModal(true)}
      />
      <ConditionTemplatesModal
        open={showModal}
        onOpenChange={setShowModal}
        onApplyTemplate={handleApply}
      />
    </>
  );
}
```

### Template Structure
```typescript
interface ConditionTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;           // Lucide icon name
  category: 'access' | 'time' | 'security' | 'environment';
  isCommon: boolean;      // Show in quick bar
  conditions: Partial<PolicyCondition>[];
}
```

## Customizing Templates

Templates are defined in `data/templates.ts`. To add a custom template:

```typescript
// In your templates.ts or custom file
export const customTemplates: ConditionTemplate[] = [
  {
    id: 'my-custom-template',
    name: 'My Custom Template',
    description: 'Description of what this template does',
    icon: 'Zap',
    category: 'access',
    isCommon: true,  // Set true to show in quick bar
    conditions: [
      {
        category: 'user',
        attribute: 'user_role',
        operator: 'in',
        value: ['custom_role'],
      },
    ],
  },
];
```
