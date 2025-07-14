# Subscription Duration Changes

## Overview

This document outlines the changes made to the subscription duration feature to support 28-day billing periods instead of calendar months. This change allows for more precise billing cycles, particularly for monthly subscriptions.

## Changes Made

1. **Database Schema**:
   - Added `duration_days` field to the `SubscriptionDuration` model in Prisma schema
   - Created a migration script to add the column to the database
   - Updated existing "Monthly" durations to use 28 days

2. **UI Changes**:
   - Updated the SubscriptionDurationsPage to include the new duration_days field
   - Added validation to ensure at least one duration type (months or days) is specified
   - Updated the help text to explain the new feature

3. **Backend Changes**:
   - Modified the subscription duration hooks to handle the new field
   - Updated the subscription creation logic to use days for calculating end dates when available
   - Added a helper function in subscription plans hooks to calculate end dates

## How It Works

The system now supports two ways to define a subscription duration:

1. **Month-based durations**: Traditional approach using calendar months (e.g., 3 months, 6 months, 12 months)
2. **Day-based durations**: Precise approach using exact number of days (e.g., 28 days, 90 days)

When creating or updating a subscription duration, you can now specify either:
- `duration_months` (e.g., 1, 3, 6, 12)
- `duration_days` (e.g., 28, 90, 180, 365)
- Or both (in which case `duration_days` takes precedence when calculating end dates)

## Implementation Details

### Database Changes

The `SubscriptionDuration` table now has a new column:

```sql
ALTER TABLE subscription_duration ADD COLUMN IF NOT EXISTS duration_days INTEGER;
```

### Subscription End Date Calculation

When calculating a subscription's end date, the system now checks if `duration_days` is available:

```javascript
// Calculate dates
const now = new Date();
const endDate = new Date(now);

// Use days if available, otherwise use months
if (durationData.duration_days) {
  endDate.setDate(now.getDate() + durationData.duration_days);
} else {
  endDate.setMonth(now.getMonth() + durationData.duration_months);
}
```

### Default Durations

The default durations have been updated to include:

```javascript
const standardDurations = [
  { name: 'Monthly (28 days)', duration_months: 1, duration_days: 28, discount_percent: 0 },
  { name: 'Quarterly', duration_months: 3, duration_days: null, discount_percent: 5 },
  { name: 'Semi-Annual', duration_months: 6, duration_days: null, discount_percent: 10 },
  { name: 'Annual', duration_months: 12, duration_days: null, discount_percent: 15 }
];
```

## Migration Path

To apply these changes to an existing system:

1. Run the Prisma migration to update the schema:
   ```
   npx prisma migrate dev
   ```

2. Apply the database migration script:
   ```
   supabase db push --db-url=YOUR_DB_URL --migration-file=20240504000000_add_duration_days_to_subscription_duration.sql
   ```

3. Deploy the updated code to your environment

## Benefits

1. **Precise Billing Cycles**: Exact 28-day cycles for monthly subscriptions
2. **Consistent Revenue Recognition**: More predictable billing dates
3. **Flexibility**: Support for both month-based and day-based billing periods
4. **Backward Compatibility**: Existing month-based durations continue to work

## Future Considerations

1. **Stripe Integration**: Ensure Stripe subscription creation uses the correct billing interval
2. **Reporting**: Update any reporting tools to account for the new billing cycle definition
3. **User Communication**: Consider notifying users about the change in billing cycle definition
