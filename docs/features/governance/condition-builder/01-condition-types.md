# Condition Types and Attributes

## Categories

Conditions are organized into four categories:

### User Category
Attributes related to the person performing the action.

| Attribute | Description | Value Type | Operators |
|-----------|-------------|------------|-----------|
| `user_email` | User's email address | Email | equals, contains, ends_with |
| `user_email_domain` | Email domain only | Email Domain | equals, in |
| `user_role` | Organization role | Enum | equals, in, not_in |
| `user_team` | Team membership | Team IDs | in, not_in |
| `user_level` | User level (1-3) | Number | equals, gte, lte |

### Resource Category
Attributes of the resource being accessed.

| Attribute | Description | Value Type | Operators |
|-----------|-------------|------------|-----------|
| `resource_agent` | Specific agent | Resource ID | in, not_in |
| `resource_deployment` | Deployment target | Resource ID | in, not_in |
| `resource_gateway` | API gateway | Resource ID | in, not_in |
| `resource_environment` | Environment type | Enum | equals, in |
| `resource_status` | Resource status | Enum | equals, in |
| `resource_created_by` | Creator user ID | String | equals |

### Time Category
Time-based restrictions for access control.

| Attribute | Description | Value Type | Operators |
|-----------|-------------|------------|-----------|
| `time_hours` | Business hours | Time Range | between |
| `time_days` | Days of week | Days | in |

### Context Category
Environmental context of the request.

| Attribute | Description | Value Type | Operators |
|-----------|-------------|------------|-----------|
| `context_ip` | Client IP address | IP Range | equals, in, starts_with |

## Value Types

### Simple Types
- **String** - Text input with optional validation pattern
- **Number** - Numeric input with optional min/max
- **Email** - Email address with format validation
- **Email Domain** - Domain portion only (e.g., "company.com")

### Selection Types
- **Enum** - Single or multi-select from predefined options
- **Days of Week** - Checkbox selection for days (0-6)

### Resource Types
- **Resource ID** - Single resource picker
- **Resource IDs** - Multi-select resource picker
- **Team IDs** - Team-specific multi-select picker

### Complex Types
- **Time Range** - Start/end time with day selection
- **IP Range** - IP address or CIDR notation (192.168.0.0/24)

## Operators

| Operator | Description | Applicable Types |
|----------|-------------|------------------|
| `equals` | Exact match | All |
| `not_equals` | Not equal | All |
| `contains` | Contains substring | String, Email |
| `starts_with` | Prefix match | String, IP Range |
| `ends_with` | Suffix match | String, Email |
| `in` | Value in list | All |
| `not_in` | Value not in list | All |
| `gt` | Greater than | Number |
| `gte` | Greater than or equal | Number |
| `lt` | Less than | Number |
| `lte` | Less than or equal | Number |
| `between` | Within range | Time Range |
| `exists` | Attribute exists | All |
| `not_exists` | Attribute missing | All |

## Usage Example

```typescript
import { ConditionsSection } from '@/features/governance/components/conditions';

const initialConditions = [
  {
    id: 'cond-1',
    category: 'user',
    attribute: 'user_team',
    operator: 'in',
    value: {
      $ref: 'resource',
      type: 'team',
      selector: { ids: ['team-001', 'team-002'] },
      display: { names: ['Engineering', 'DevOps'], status: 'valid' }
    }
  }
];

<ConditionsSection
  initialConditions={initialConditions}
  initialLogic="all"
  onChange={(group) => console.log('Conditions:', group)}
/>
```
