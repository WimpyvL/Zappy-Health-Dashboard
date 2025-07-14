# Service Management Testing Guide

This document provides step-by-step instructions for testing the service management functionality in the Zappy Dashboard after implementing the database schema changes and hook modifications.

## Prerequisites

- The database migration from `SUPABASE_SERVICE_MIGRATION.md` has been applied
- The Zappy Dashboard application is running
- You have admin access to the dashboard

## Testing Scenarios

### 1. Viewing Services

1. **Navigate to Service Management:**
   - Log in to the dashboard
   - Navigate to the Services section
   - Verify that the service list loads without errors
   - Confirm that any existing services display their associated products and plans correctly

2. **Test Search Functionality:**
   - Enter a search term in the search box
   - Verify that the list filters correctly based on service name and description

### 2. Creating a Service

1. **Open the Add Service Modal:**
   - Click the "Add Service" button
   - Verify that the modal opens with empty fields

2. **Fill Basic Service Details:**
   - Enter a service name (required)
   - Add a description
   - Check/uncheck the "Active" toggle
   - Check/uncheck the "Requires Consultation" toggle

3. **Associate Products:**
   - Select several products from the list
   - Verify that selected products are highlighted
   - Check that the count of selected products updates

4. **Configure Subscription Plans:**
   - Select several subscription plans
   - For each selected plan, customize:
     - Duration (e.g., "1 month", "90 days")
     - Whether a subscription is required
   - Verify that the count of selected plans updates

5. **Save the Service:**
   - Click "Add Service"
   - Verify that a success message appears
   - Check that the service appears in the service list with all details correct
   - Confirm that the modal closes automatically

### 3. Editing a Service

1. **Open the Edit Modal:**
   - Find an existing service
   - Click the edit (pencil) icon
   - Verify that the modal opens with pre-populated fields
   - Confirm that associated products and plans are correctly selected

2. **Modify Service Details:**
   - Change the service name
   - Update the description
   - Toggle the "Active" status
   - Toggle the "Requires Consultation" setting

3. **Modify Product Associations:**
   - Deselect a previously selected product
   - Select a new product
   - Verify that the selections update visually

4. **Modify Subscription Plans:**
   - Remove a previously selected plan
   - Add a new plan
   - Change the duration for an existing plan
   - Toggle the "Subscription Required" setting for a plan

5. **Save Changes:**
   - Click "Save Changes"
   - Verify that a success message appears
   - Confirm the service in the list reflects all your changes
   - Check that the modal closes automatically

### 4. Deleting a Service

1. **Delete a Service:**
   - Find a service you want to delete
   - Click the delete (trash) icon
   - Confirm the deletion in the confirmation dialog

2. **Verify Deletion:**
   - Check that a success message appears
   - Confirm the service is no longer in the list

### 5. Error Handling

1. **Invalid Submissions:**
   - Try to create a service without a name
   - Verify that the form prevents submission
   - Check that appropriate validation messages appear

2. **Server Errors:**
   - If possible, temporarily disable write permissions in Supabase
   - Try to create or update a service
   - Verify that an error message is displayed
   - Re-enable permissions when done

## Troubleshooting Common Issues

### Service Products or Plans Not Saving

1. Check the browser console for any JavaScript errors
2. Verify that the junction tables were created in the Supabase database
3. Confirm that the RLS policies allow the current user to write to these tables
4. Check that product and plan IDs being sent match those in the database

### Incorrect Data Display

1. Use the browser developer tools to inspect the network requests and responses
2. Verify that the hook implementations are correctly joining the relationship data
3. Check that the component is correctly mapping over the data arrays

### Performance Issues

1. Check if multiple unnecessary re-renders are occurring using the React DevTools
2. Verify that the hooks are using appropriate caching and query key strategies

## Next Steps

After successful testing, document any issues or improvements needed in the issue tracking system.