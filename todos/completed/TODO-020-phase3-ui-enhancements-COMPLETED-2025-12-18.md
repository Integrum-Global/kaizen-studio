# TODO-020: Phase 3 - UI Enhancements (Billing, Settings, Metrics)

**Status**: ACTIVE
**Priority**: MEDIUM
**Owner**: Frontend Team
**Estimated Effort**: 5 days
**Created**: 2025-12-18

## Description

Enhance existing UI pages (Billing, Settings, Metrics) with missing features and components to pass E2E tests. These enhancements focus on completing partially implemented pages with proper data displays, interactive elements, and comprehensive features.

## Target Impact

- Fix 16 billing page tests
- Fix 14 settings page tests
- Fix 6 metrics page tests
- Total: 36 additional tests passing

## Acceptance Criteria

- [ ] Billing page enhancements complete (plan comparison, payment methods, invoices)
- [ ] Settings page enhancements complete (profile, organization, API keys, webhooks)
- [ ] Metrics page enhancements complete (charts, filters, exports)
- [ ] All interactive elements functional
- [ ] Proper empty states and loading states
- [ ] 36 E2E tests passing

## Dependencies

- TODO-018: Test fixtures for billing/settings/metrics data
- Existing page implementations
- Backend API endpoints

## Subtasks

### 1. Billing Page - Plan Features and Comparison (Est: 1 day)

**Files to modify**:
- `apps/frontend/src/pages/settings/BillingPage.tsx`
- `apps/frontend/src/features/billing/components/PlanCard.tsx`
- `apps/frontend/src/features/billing/components/PlanComparison.tsx`
- `apps/frontend/src/features/billing/components/FeatureList.tsx`

**Enhancements needed**:
1. **Plan Features Display**:
   - List of features per plan with checkmarks
   - Feature descriptions
   - Feature limits (e.g., "100 API calls/month")
   - Highlight current plan features

2. **Plan Comparison Table**:
   - Side-by-side plan comparison
   - Feature availability matrix
   - Price comparison
   - Current plan indicator

3. **Current Plan Badge**:
   - Prominent "Current Plan" badge
   - Visual distinction from other plans
   - Active state styling

**Current Test Failures**:
- `should display plan features list` - No features visible
- `should show feature comparison between plans` - No comparison table
- `should indicate current plan clearly` - No current plan marker

**Verification**:
```bash
npm run test:e2e -- e2e/billing.spec.ts -g "Plan|Features|Comparison"
```

**Success Criteria**:
- [ ] Plan features list visible
- [ ] Feature comparison table functional
- [ ] Current plan clearly marked
- [ ] 5 tests passing

### 2. Billing Page - Payment Methods (Est: 1 day)

**Files to modify**:
- `apps/frontend/src/features/billing/components/PaymentMethods.tsx`
- `apps/frontend/src/features/billing/components/PaymentMethodCard.tsx`
- `apps/frontend/src/features/billing/components/AddPaymentMethodDialog.tsx`

**Enhancements needed**:
1. **Payment Methods List**:
   - Display saved payment methods
   - Card last 4 digits
   - Card brand icons (Visa, Mastercard, etc.)
   - Expiry date
   - Default payment method indicator

2. **Add Payment Method Dialog**:
   - Dialog opens on button click
   - Credit card form with Stripe Elements
   - Validation messages
   - Save and cancel buttons

3. **Payment Method Actions**:
   - Set as default
   - Delete payment method
   - Edit billing address

4. **Empty State**:
   - "No payment methods" message
   - Call-to-action to add first method
   - Helpful illustration

**Current Test Failures**:
- `should have payment methods section accessible` - Section not found
- `should have add payment method button that opens dialog` - Button doesn't open dialog
- `should display payment methods list or actionable empty state` - No list or empty state

**Verification**:
```bash
npm run test:e2e -- e2e/billing.spec.ts -g "Payment Methods"
```

**Success Criteria**:
- [ ] Payment methods list displays
- [ ] Add button opens dialog
- [ ] Empty state shows call-to-action
- [ ] 3 tests passing

### 3. Billing Page - Invoices and Usage (Est: 1 day)

**Files to modify**:
- `apps/frontend/src/features/billing/components/InvoicesList.tsx`
- `apps/frontend/src/features/billing/components/InvoiceCard.tsx`
- `apps/frontend/src/features/billing/components/UsageMetrics.tsx`
- `apps/frontend/src/features/billing/components/UsageProgressBar.tsx`

**Enhancements needed**:
1. **Invoices List**:
   - Invoice date and number
   - Amount and status
   - Download PDF button
   - Pagination for long lists

2. **Usage Statistics**:
   - Current usage with numbers (not just text)
   - Progress bars with actual percentages
   - Multiple metrics (API calls, storage, bandwidth)
   - Quota limits displayed

3. **Billing Period Info**:
   - Current billing period dates
   - Next billing date
   - Renewal information
   - Payment due date

**Current Test Failures**:
- `should have invoices section accessible` - Section not found
- `should display invoices list or empty state message` - No list
- `should display usage statistics with actual values` - No numbers
- `should display progress bars for usage visualization` - No progress bars
- `should display billing period information` - No period info

**Verification**:
```bash
npm run test:e2e -- e2e/billing.spec.ts -g "Invoices|Usage|Billing period"
```

**Success Criteria**:
- [ ] Invoices list displays
- [ ] Usage stats show numbers
- [ ] Progress bars visible
- [ ] Billing period info displayed
- [ ] 5 tests passing

### 4. Billing Page - Subscription Management (Est: 0.5 day)

**Files to modify**:
- `apps/frontend/src/features/billing/components/SubscriptionManagement.tsx`
- `apps/frontend/src/features/billing/components/ChangePlanDialog.tsx`
- `apps/frontend/src/features/billing/components/CancelSubscriptionDialog.tsx`

**Enhancements needed**:
1. **Management Options**:
   - Upgrade plan button
   - Downgrade plan button
   - Cancel subscription button
   - Change billing period button

2. **Change Plan Dialog**:
   - Plan selection
   - Prorated amount calculation
   - Confirmation step

3. **Cancel Subscription**:
   - Cancellation reasons
   - Feedback form
   - Confirmation with warning

**Current Test Failures**:
- `should show subscription management options` - No management buttons
- `should have clickable upgrade or manage subscription button` - Button not functional

**Verification**:
```bash
npm run test:e2e -- e2e/billing.spec.ts -g "Subscription Management"
```

**Success Criteria**:
- [ ] Management options visible
- [ ] Buttons functional
- [ ] Dialogs open correctly
- [ ] 3 tests passing

### 5. Settings Page - Profile and Organization (Est: 1 day)

**Files to modify**:
- `apps/frontend/src/pages/settings/SettingsPage.tsx`
- `apps/frontend/src/features/settings/components/ProfileSettings.tsx`
- `apps/frontend/src/features/settings/components/OrganizationSettings.tsx`
- `apps/frontend/src/features/settings/components/NotificationPreferences.tsx`

**Enhancements needed**:
1. **Profile Settings**:
   - Name and email fields (with validation)
   - Avatar upload
   - Password change
   - Two-factor authentication toggle

2. **Organization Settings**:
   - Organization name edit
   - Organization avatar
   - Default role for new members
   - Organization deletion (danger zone)

3. **Notification Preferences**:
   - Email notifications toggle
   - Notification types (alerts, updates, marketing)
   - Frequency settings

4. **Settings Navigation**:
   - Tabbed interface or sidebar
   - Active tab indication
   - Keyboard navigation

**Current Test Failures**:
- Settings tests expect specific sections that don't exist
- Form inputs not properly labeled
- Save buttons not functional

**Verification**:
```bash
npm run test:e2e -- e2e/settings.spec.ts -g "Profile|Organization|Notifications"
```

**Success Criteria**:
- [ ] Profile settings editable
- [ ] Organization settings editable
- [ ] Notification preferences configurable
- [ ] Settings navigation functional
- [ ] 7 tests passing

### 6. Settings Page - API Keys and Webhooks (Est: 1 day)

**Files to modify**:
- `apps/frontend/src/pages/settings/ApiKeysPage.tsx`
- `apps/frontend/src/pages/settings/WebhooksPage.tsx`
- `apps/frontend/src/features/settings/components/ApiKeysList.tsx`
- `apps/frontend/src/features/settings/components/CreateApiKeyDialog.tsx`
- `apps/frontend/src/features/settings/components/WebhooksList.tsx`
- `apps/frontend/src/features/settings/components/CreateWebhookDialog.tsx`

**Enhancements needed**:
1. **API Keys Section**:
   - List of API keys with names
   - Creation date and last used
   - Copy key button
   - Revoke key button
   - Create new key dialog

2. **Create API Key Dialog**:
   - Key name input
   - Scope/permissions selection
   - Expiration date (optional)
   - Display key once (copy to clipboard)

3. **Webhooks Section**:
   - List of webhooks with URLs
   - Event types subscribed
   - Enable/disable toggle
   - Test webhook button
   - Delivery logs

4. **Create Webhook Dialog**:
   - Webhook URL input
   - Event type selection (checkboxes)
   - Authentication method
   - Test connection button

**Current Test Failures**:
- API keys tests expect key management features
- Webhook tests expect webhook configuration

**Verification**:
```bash
npm run test:e2e -- e2e/settings.spec.ts -g "API Keys|Webhooks"
```

**Success Criteria**:
- [ ] API keys list displays
- [ ] Create API key functional
- [ ] Webhooks list displays
- [ ] Create webhook functional
- [ ] 7 tests passing

### 7. Metrics Page - Enhanced Visualizations (Est: 1 day)

**Files to modify**:
- `apps/frontend/src/pages/observability/MetricsPage.tsx`
- `apps/frontend/src/features/metrics/components/MetricsCharts.tsx`
- `apps/frontend/src/features/metrics/components/MetricFilters.tsx`
- `apps/frontend/src/features/metrics/components/MetricExport.tsx`

**Enhancements needed**:
1. **Metrics Charts**:
   - Line charts for time-series data
   - Bar charts for comparisons
   - Multiple metrics on same chart
   - Hover tooltips with exact values

2. **Time Range Filter**:
   - Last 1 hour, 24 hours, 7 days, 30 days
   - Custom date range picker
   - Auto-refresh toggle

3. **Metric Selection**:
   - Dropdown to select metrics
   - Multiple metric selection
   - Metric categories (performance, errors, usage)

4. **Export Functionality**:
   - Export as CSV
   - Export as PNG (chart image)
   - Export as JSON (raw data)
   - Date range selection

5. **Aggregation Options**:
   - Sum, Average, Min, Max, P50, P95, P99
   - Group by (hour, day, week)

**Current Test Failures**:
- Metrics tests expect charts and filters
- Export functionality missing
- No time range selector

**Verification**:
```bash
npm run test:e2e -- e2e/metrics.spec.ts
```

**Success Criteria**:
- [ ] Charts display correctly
- [ ] Filters functional
- [ ] Export works
- [ ] Time range selection working
- [ ] 6 tests passing

## Testing Requirements

### Unit Tests
- [ ] Billing components render correctly
- [ ] Settings components render correctly
- [ ] Metrics components render correctly
- [ ] Forms validate properly
- [ ] Actions trigger correct API calls

### Integration Tests
- [ ] Billing API integration working
- [ ] Settings API integration working
- [ ] Metrics API integration working
- [ ] Payment processing flow works
- [ ] Webhook creation flow works

### E2E Tests
- [ ] 16 billing tests passing
- [ ] 14 settings tests passing
- [ ] 6 metrics tests passing
- [ ] Total: 36 tests passing
- [ ] No regressions in other tests

## Risk Assessment

**HIGH**:
- Payment processing integration complexity
- Sensitive data handling (API keys, payment methods)

**MEDIUM**:
- Chart rendering performance with large datasets
- Form validation complexity

**LOW**:
- Empty state edge cases
- Export format compatibility

## Mitigation Strategies

1. **Security**:
   - Never display full API keys (only last 4 chars)
   - Mask payment method details
   - HTTPS only for payment forms
   - CSP headers for Stripe integration

2. **Performance**:
   - Lazy load chart libraries
   - Paginate long lists
   - Debounce chart updates
   - Virtual scrolling for metrics

3. **UX**:
   - Clear loading states
   - Optimistic UI updates
   - Helpful error messages
   - Confirmation dialogs for destructive actions

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Billing page enhancements complete
- [ ] Settings page enhancements complete
- [ ] Metrics page enhancements complete
- [ ] 36 E2E tests passing
- [ ] Unit tests passing
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Code review completed
- [ ] No policy violations

## Related Files

**To Modify**:
- `apps/frontend/src/pages/settings/BillingPage.tsx`
- `apps/frontend/src/pages/settings/SettingsPage.tsx`
- `apps/frontend/src/pages/settings/ApiKeysPage.tsx`
- `apps/frontend/src/pages/settings/WebhooksPage.tsx`
- `apps/frontend/src/pages/observability/MetricsPage.tsx`
- `apps/frontend/src/features/billing/` (8 components)
- `apps/frontend/src/features/settings/` (10 components)
- `apps/frontend/src/features/metrics/` (5 components)

**Existing Tests**:
- `apps/frontend/e2e/billing.spec.ts` (16 failing tests)
- `apps/frontend/e2e/settings.spec.ts` (14 failing tests)
- `apps/frontend/e2e/metrics.spec.ts` (6 failing tests)

## Progress Tracking

- [ ] Task breakdown complete
- [ ] Billing - Plan features and comparison
- [ ] Billing - Payment methods
- [ ] Billing - Invoices and usage
- [ ] Billing - Subscription management
- [ ] Settings - Profile and organization
- [ ] Settings - API keys and webhooks
- [ ] Metrics - Enhanced visualizations
- [ ] 36 E2E tests passing
- [ ] Documentation complete
- [ ] Code review approved
