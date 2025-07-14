# Service Management Troubleshooting Guide

This guide provides detailed troubleshooting steps for common issues that may arise after implementing the service management functionality in the Zappy Dashboard.

## Database Issues

### Junction Tables Not Created

**Symptoms:**
- Error messages about missing tables
- Services display without associated products or plans

**Steps to Resolve:**
1. Check if the migration was applied:
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name IN ('service_products', 'service_plans');
   ```
2. If tables don't exist, apply the migration:
   ```sql
   -- Run the migration script from supabase/migrations/20250426000000_create_service_junction_tables.sql
   ```

### Row Level Security Blocking Access

**Symptoms:**
- 403 Forbidden errors
- Empty data when querying tables
- Operations succeeding in SQL Editor but failing in the application

**Steps to Resolve:**
1. Check RLS policies:
   ```sql
   SELECT tablename, policyname, permissive, roles, cmd
   FROM pg_policies
   WHERE tablename IN ('services', 'service_products', 'service_plans');
   ```

2. Verify your user's role:
   ```sql
   SELECT auth.uid(), auth.role();
   ```

3. Modify the policy if needed:
   ```sql
   -- Example: Make RLS policy more permissive for testing
   CREATE OR REPLACE POLICY "Authenticated users can read services"
     ON services FOR SELECT
     USING (true);  -- Allow all users to read services
   ```

## API Integration Issues

### Data Not Showing in UI

**Symptoms:**
- Empty lists in the service management component
- Missing product or plan associations

**Steps to Resolve:**
1. Check browser console for errors
2. Verify API responses using the Network tab in browser developer tools
3. Test individual database queries in Supabase SQL Editor:
   ```sql
   SELECT s.*, 
     (SELECT json_agg(sp.*) FROM service_products sp WHERE sp.service_id = s.id) as products,
     (SELECT json_agg(pl.*) FROM service_plans pl WHERE pl.service_id = s.id) as plans
   FROM services s;
   ```
4. Check environment variables for proper Supabase configuration

### Service Creation Fails

**Symptoms:**
- Error notifications when trying to create or update services
- Failed network requests in console

**Steps to Resolve:**
1. Check for validation errors:
   - Ensure required fields are provided (name, etc.)
   - Check for data type mismatches
2. Verify transaction handling:
   - Services should be created before relationships
   - Data format for product and plan IDs should be valid UUIDs
3. Console log the exact data being sent in the mutation

## Performance Issues

### Slow Loading of Service List

**Symptoms:**
- Long loading times for the service management page
- Browser lag when many services exist

**Steps to Resolve:**
1. Check the number of database calls being made:
   - The current implementation makes N+1 queries (1 for services, N for products/plans)
   - Consider a JOIN or built-in Supabase RPC function
2. Implement pagination if not already present
3. Apply indexing to junction tables if they're growing large:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_service_products_service_id ON service_products(service_id);
   CREATE INDEX IF NOT EXISTS idx_service_products_product_id ON service_products(product_id);
   CREATE INDEX IF NOT EXISTS idx_service_plans_service_id ON service_plans(service_id);
   CREATE INDEX IF NOT EXISTS idx_service_plans_plan_id ON service_plans(plan_id);
   ```

### React Component Re-render Issues

**Symptoms:**
- UI freezing when interacting with modals or forms
- Excessive re-renders shown in React DevTools

**Steps to Resolve:**
1. Use React DevTools to profile component renders
2. Add memoization to expensive components:
   ```javascript
   const MemoizedProductList = React.memo(ProductList);
   ```
3. Move state logic to a custom hook to isolate re-renders

## Common Error Messages and Resolutions

### "Error code 42501: permission denied"

This indicates an RLS policy is blocking access to the table.

**Resolution:**
- Check if the user has the correct role
- Verify that the RLS policy allows the operation
- For testing, you can temporarily disable RLS:
  ```sql
  ALTER TABLE services DISABLE ROW LEVEL SECURITY;
  ```
  (Remember to re-enable it before deploying to production)

### "Error code 23503: foreign key constraint violation"

This occurs when trying to reference a product or plan that doesn't exist.

**Resolution:**
- Verify the IDs being sent to the API
- Check if products/plans are active
- Confirm that the referenced tables have the expected data

### "Error code 23505: unique constraint violation"

This happens when trying to create a duplicate relationship.

**Resolution:**
- Check if the relationship already exists
- Implement an "upsert" pattern using ON CONFLICT
- Add client-side validation to prevent duplicate submissions

## Next Steps for Performance Optimization

If you're still experiencing issues after applying the above solutions:

1. **Consider PostgreSQL Functions:**
   ```sql
   CREATE OR REPLACE FUNCTION get_service_with_relationships(service_id uuid)
   RETURNS json AS $$
   SELECT json_build_object(
     'service', s.*,
     'products', (SELECT json_agg(p.*) FROM products p 
                  JOIN service_products sp ON p.id = sp.product_id 
                  WHERE sp.service_id = s.id),
     'plans', (SELECT json_agg(pl.*) FROM subscription_plans pl 
               JOIN service_plans sp ON pl.id = sp.plan_id 
               WHERE sp.service_id = s.id)
   )
   FROM services s WHERE s.id = service_id
   $$ LANGUAGE sql;
   ```

2. **Implement Batch Updates:**
   When updating many relationships at once, use a transaction and COPY command for better performance.

3. **Add Monitoring:**
   Implement basic performance monitoring to identify bottlenecks in production.