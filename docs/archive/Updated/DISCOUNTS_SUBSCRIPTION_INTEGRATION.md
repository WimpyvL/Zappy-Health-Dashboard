# Discounts and Subscription Plans Integration

## Overview

This document outlines the integration between the discounts system and subscription plans in the Telehealth platform. The integration allows administrators to create discounts that are specifically tied to subscription plans, enabling targeted promotional offers for subscribers.

## Changes Made

1. **Database Schema Updates**:
   - Created a junction table `discount_subscription_plans` to support many-to-many relationships
   - Added foreign key relationships to both the `discounts` and `subscription_plans` tables
   - Added indexes for improved query performance

2. **Frontend Updates**:
   - Enhanced the Discount Management UI to display subscription plan selection when "Subscription Plans" is selected as a requirement
   - Added multi-select checkbox interface for selecting multiple subscription plans
   - Removed the minimum purchase amount field for subscription plan discounts
   - Updated form handling to include multiple subscription plan IDs

3. **API Integration**:
   - Updated discount API hooks to handle the new many-to-many relationship
   - Modified create and update operations to manage junction table entries
   - Enhanced queries to fetch subscription plan data with discounts
   - Ensured proper data validation and error handling

## How It Works

### Creating a Subscription-Specific Discount

1. Navigate to the Discount Management page
2. Click "Add Discount" to open the creation modal
3. Fill in the basic discount information (name, code, value, etc.)
4. In the "Requirement" dropdown, select "Subscription Plans"
5. A list of subscription plans with checkboxes will appear
6. Select one or more subscription plans this discount should apply to
7. Complete the rest of the form and click "Add Discount"

### Editing a Subscription-Specific Discount

1. Find the discount in the list and click the edit icon
2. In the edit modal, you can change the selected subscription plans or remove the subscription requirement entirely by changing the "Requirement" dropdown
3. Save your changes

## Technical Implementation

### Database Migration

A new migration file (`20250507000100_add_subscription_plan_id_to_discounts.sql`) has been created to add the necessary junction table:

```sql
-- Create a junction table for the many-to-many relationship
CREATE TABLE IF NOT EXISTS public.discount_subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discount_id UUID NOT NULL REFERENCES public.discounts(id) ON DELETE CASCADE,
    subscription_plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(discount_id, subscription_plan_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_discount_subscription_plans_discount_id ON public.discount_subscription_plans (discount_id);
CREATE INDEX IF NOT EXISTS idx_discount_subscription_plans_subscription_plan_id ON public.discount_subscription_plans (subscription_plan_id);
```

### API Hooks

The discount API hooks have been updated to handle the new many-to-many relationship:

```javascript
// In useDiscounts - Fetch discounts with their subscription plans
let query = supabase
  .from('discounts')
  .select(`
    *,
    discount_subscription_plans:discount_subscription_plans(
      subscription_plan_id
    )
  `)
  .order('name', { ascending: true });

// Map data to include subscription_plan_ids array
const mappedData = data?.map(d => ({
    ...d,
    subscription_plan_ids: d.discount_subscription_plans?.map(dsp => dsp.subscription_plan_id) || []
})) || [];

// In useCreateDiscount - Handle creating junction table entries
// Extract subscription plan IDs
const subscriptionPlanIds = discountData.subscription_plan_ids || [];

// Create discount record
const { data, error } = await supabase
  .from('discounts')
  .insert(dataToInsert)
  .select()
  .single();

// Create junction table entries for selected plans
if (subscriptionPlanIds.length > 0) {
  const junctionEntries = subscriptionPlanIds.map(planId => ({
    discount_id: data.id,
    subscription_plan_id: planId
  }));

  await supabase
    .from('discount_subscription_plans')
    .insert(junctionEntries);
}
```

### UI Components

The DiscountManagement component has been updated to include multi-select subscription plan selection:

```jsx
{formData.requirement === 'Subscription Plans' && (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Subscription Plans
    </label>
    <div className="border border-gray-300 rounded-md p-3 max-h-60 overflow-y-auto">
      {isLoadingSubscriptionPlans ? (
        <div className="flex items-center justify-center py-2">
          <Loader className="h-5 w-5 text-primary animate-spin mr-2" />
          <span>Loading plans...</span>
        </div>
      ) : (
        <div className="space-y-2">
          {subscriptionPlans?.map(plan => (
            <label key={plan.id} className="flex items-center">
              <input
                type="checkbox"
                name="subscription_plan_ids"
                value={plan.id}
                checked={formData.subscription_plan_ids?.includes(plan.id)}
                onChange={(e) => {
                  // Handle checkbox change
                }}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                {plan.name} (${plan.price})
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
    <p className="mt-1 text-xs text-gray-500">
      Select one or more subscription plans to apply this discount to
    </p>
  </div>
)}
```

## How to Apply the Migration

To apply the database migration, run the provided script:

```bash
./apply-discounts-migration.sh
```

This script will:
1. Check if the Supabase CLI is installed
2. Run the migration to create the junction table
3. Provide feedback on the success or failure of the migration

## Referral System Separation

The referral system has been kept separate from the discount codes system to maintain a clear separation of concerns. The referral system has its own dedicated functionality:

1. A dedicated referral_settings table for managing reward amounts and recipients
2. A referrals table that tracks referrals between users
3. API hooks for managing referrals and retrieving referral information

By keeping these systems separate, we ensure:
1. Cleaner code organization and maintenance
2. More focused user interfaces for each feature
3. Greater flexibility in how each system evolves independently
4. Reduced complexity in the discount management interface

## Future Enhancements

1. **Discount Application Logic**: Implement logic to automatically apply discounts when users subscribe to eligible plans
2. **Discount Analytics**: Add reporting to track the effectiveness of subscription-specific discounts
3. **Tiered Discounts**: Implement tiered discounts based on subscription duration or level
4. **Conditional Discounts**: Add support for more complex discount conditions combining subscription plans with other requirements
5. **Enhanced Referral Integration**: Develop deeper integration between the discount and referral systems, such as automatic discount application for referred customers
