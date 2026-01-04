# ABAC Condition Builder

## Overview

The ABAC (Attribute-Based Access Control) Condition Builder is a guided UI component for creating policy conditions without requiring users to write complex expressions or JSON. It transforms policy creation from a technical task into an intuitive, guided experience.

## Key Features

### Guided Condition Creation
Users select conditions through a series of dropdowns:
1. **Category** - What type of attribute (User, Resource, Time, Context)
2. **Attribute** - Specific attribute within the category (e.g., User's email, Resource's environment)
3. **Operator** - How to compare (equals, contains, in, between, etc.)
4. **Value** - The value to compare against (text, selection, resource picker)

### Quick Templates
Pre-built templates for common policy patterns:
- **Team Access** - Restrict to specific teams
- **Business Hours** - Allow only during work hours (9-5 Mon-Fri)
- **IP Restriction** - Limit to specific IP ranges
- **Specific Agent** - Control access to selected agents

### Plain English Preview
Every condition is translated to readable English:
- "User's email equals admin@company.com"
- "Resource is in production environment"
- "Access allowed from 9:00 AM to 5:00 PM on weekdays"

### Logic Operators
Combine multiple conditions with:
- **ALL must match** (AND logic)
- **ANY can match** (OR logic)

### Reference Management
Automatic validation of resource references:
- Detects orphaned resources (deleted agents, teams, etc.)
- Warns about changed resources before saving
- Validates on save with user confirmation

## Component Structure

```
ConditionsSection
├── ConditionTemplates (quick template bar)
├── Logic Toggle (ALL/ANY when multiple conditions)
├── ConditionRow[] (one per condition)
│   ├── CategorySelect
│   ├── AttributeSelect
│   ├── OperatorSelect
│   └── ValueInput
│       ├── ResourcePicker (for agent/team/deployment selection)
│       ├── TeamPicker (multi-select teams)
│       ├── TimePicker (business hours)
│       ├── IpRangeInput (IP/CIDR validation)
│       └── Other input types
├── ReferenceWarnings (orphan/changed alerts)
└── OverallPreview (plain English summary)
```

## Integration Points

### PolicyEditor
The condition builder integrates with `PolicyEditor.tsx`:
```tsx
<ConditionsSection
  initialConditions={policy.conditions}
  initialLogic={policy.logic}
  onChange={(group) => setConditions(group)}
  policyId={policy.id}
/>
```

### Backend API
- `POST /api/v1/policies/validate-conditions` - Validate conditions
- `GET /api/v1/policies/{id}/references` - Get resource reference status

## Related Documentation

- [01-condition-types.md](./01-condition-types.md) - Condition types and attributes
- [02-templates.md](./02-templates.md) - Template definitions and customization
- [03-validation.md](./03-validation.md) - Validation rules and reference management
- [04-api-integration.md](./04-api-integration.md) - Backend API integration
