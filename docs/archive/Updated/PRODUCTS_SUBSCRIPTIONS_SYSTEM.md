# Products & Subscriptions System Documentation

This document provides an overview of the products and subscriptions system in the Telehealth application, including recent improvements and best practices.

## System Overview

The products and subscriptions system allows patients to subscribe to various treatment plans and purchase products. The system consists of several key components:

1. **Subscription Plans**: Recurring payment plans that provide access to specific services
2. **Products**: Individual items that can be purchased
3. **Bundles**: Collections of products sold together at a discounted price
4. **Categories**: Groupings for products and subscription plans
5. **Subscription Durations**: Time periods for subscriptions (e.g., monthly, quarterly, yearly)

## Database Schema

### Main Tables

- `subscription_plans`: Defines available subscription plans
- `products`: Individual products available for purchase
- `bundles`: Collections of products sold together
- `bundle_products`: Junction table linking bundles to products
- `categories`: Categories for organizing products and plans
- `subscription_durations`: Available subscription time periods
- `patient_subscriptions`: Records of patient subscriptions
- `orders`: Patient product orders

### Key Relationships

- A subscription plan belongs to a category
- A product belongs to a category
- A bundle contains multiple products (via bundle_products)
- A patient can have multiple subscriptions
- A subscription has one plan and one duration

## API Structure

The API layer is organized using React Query hooks for data fetching and mutations:

- `src/apis/subscriptionPlans/hooks.js`: Subscription plan operations
- `src/apis/products/hooks.js`: Product operations
- `src/apis/bundles/hooks.js`: Bundle operations
- `src/apis/categories/hooks.js`: Category operations
- `src/apis/subscriptionDurations/hooks.js`: Subscription duration operations

Each API module follows a consistent pattern:

```javascript
// Query keys
const queryKeys = {
  all: ['entity-name'],
  lists: () => [...queryKeys.all, 'list'],
  details: (id) => [...queryKeys.all, 'detail', id],
};

// Read operations (queries)
export const useEntityList = (options) => {
  return useQuery({
    queryKey: queryKeys.lists(),
    queryFn: async () => {
      // Fetch data from Supabase
    },
    ...options,
  });
};

// Write operations (mutations)
export const useCreateEntity = (options) => {
  return useMutation({
    mutationFn: async (data) => {
      // Create entity in Supabase
    },
    onSuccess: () => {
      // Invalidate queries and show success message
    },
    onError: () => {
      // Handle error and show error message
    },
    ...options,
  });
};
```

## UI Components

### Main Components

- `SubscriptionPlanSelection.jsx`: Component for selecting and subscribing to plans
- `PatientSubscriptionDetails.jsx`: Component for viewing subscription details
- `BundleModal.jsx`: Modal for creating and editing bundles
- `ProductModal.jsx`: Modal for creating and editing products
- `SubscriptionPlanModal.jsx`: Modal for creating and editing subscription plans

### Admin Interface

The admin interface for managing products and subscriptions is located in:

- `src/pages/admin/ProductSubscriptionManagement.jsx`: Main admin page
- `src/pages/admin/SubscriptionPlansPage.jsx`: Subscription plans management
- `src/pages/admin/SubscriptionDurationsPage.jsx`: Subscription durations management

## Error Handling

The system uses a centralized error handling utility in `src/utils/errorHandling.js` that provides:

- Consistent error messages for API errors
- Form validation error handling
- User-friendly error messages for database errors

Example usage:

```javascript
import { handleApiError } from '../../utils/errorHandling';

try {
  // API call
} catch (err) {
  handleApiError(err, 'Creating subscription', toast, setError, setIsLoading);
}
```

## Migration Scripts

Database migrations are managed through SQL scripts in the `supabase/migrations` directory:

- `20250515000000_create_bundles_table.sql`: Creates bundles and bundle_products tables
- `20240504000000_add_duration_days_to_subscription_duration.sql`: Adds duration_days field
- `20240503000000_migrate_products_services.sql`: Migrates from old product structure
- `20240502000000_migrate_treatment_packages.sql`: Migrates from treatment packages

Migration scripts can be applied using the corresponding shell scripts:

- `apply-bundles-migration.sh`
- `apply-subscription-duration-migration.sh`

## Recent Improvements

1. **Bundle Management**
   - Added complete bundle management API
   - Created database tables for bundles
   - Implemented CRUD operations with proper error handling

2. **Real API Implementation**
   - Replaced mock implementations with actual Supabase API calls
   - Added proper error handling and loading states
   - Implemented comprehensive validation

3. **Error Handling**
   - Created a reusable error handling utility
   - Standardized error messages across the application
   - Added user-friendly error displays

4. **Deprecated Components Cleanup**
   - Removed treatment packages (replaced by subscription plans)
   - Updated references throughout the codebase
   - Created cleanup script for removing deprecated components

## Best Practices

1. **Data Fetching**
   - Use React Query hooks for all data operations
   - Implement proper loading and error states
   - Use query invalidation for cache management

2. **Error Handling**
   - Always use the centralized error handling utility
   - Display user-friendly error messages
   - Log detailed errors to the console for debugging

3. **Component Structure**
   - Use PropTypes for documenting component props
   - Implement proper loading and error states
   - Follow the container/presentational pattern where appropriate

4. **Database Operations**
   - Use transactions for operations that modify multiple tables
   - Implement proper error handling for database constraints
   - Follow the migration pattern for schema changes

## Future Improvements

1. **Subscription Management**
   - Add subscription cancellation and modification features
   - Implement subscription renewal notifications
   - Add subscription usage analytics

2. **Product Recommendations**
   - Implement personalized product recommendations
   - Add cross-selling features based on subscription history
   - Implement bundle recommendations

3. **Performance Optimization**
   - Optimize Supabase queries for subscription data
   - Implement pagination for product and subscription lists
   - Add caching for frequently accessed data

## Troubleshooting

### Common Issues

1. **Subscription Creation Fails**
   - Check that the patient ID is valid
   - Verify that the subscription plan and duration exist
   - Check for database constraint violations

2. **Products Not Displaying**
   - Verify that the products are active
   - Check category filters
   - Verify that the API is returning data correctly

3. **Bundle Management Issues**
   - Ensure products exist before adding to bundles
   - Check for duplicate product entries
   - Verify pricing calculations

### Debugging Tips

1. Check the browser console for detailed error messages
2. Use the Network tab to inspect API requests and responses
3. Verify database records directly in Supabase
4. Check for validation errors in form submissions
