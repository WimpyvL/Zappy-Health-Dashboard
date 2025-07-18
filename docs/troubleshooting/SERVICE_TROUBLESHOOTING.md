# Service Management Troubleshooting Guide

This guide provides detailed troubleshooting steps for common issues that may arise after implementing the service management functionality in the Zappy Dashboard with Firebase.

## Firebase Firestore Issues

### Data Not Appearing or Missing Relationships

**Symptoms:**
- Error messages about missing collections or documents.
- Services display without associated products or plans.

**Steps to Resolve:**
1. **Check Firestore Console:**
   - Go to your Firebase Console and navigate to the Firestore Database section.
   - Verify that the `services`, `products`, `subscription_plans`, `service_products`, and `service_plans` collections exist.
   - Check that documents within these collections have the correct fields and data types.

2. **Verify Security Rules:**
   - Go to the "Rules" tab in the Firestore section of your Firebase Console.
   - Ensure your rules allow the currently authenticated user to read the required collections.
   - For example, a basic rule to allow any authenticated user to read services:
     ```
     match /services/{serviceId} {
       allow read: if request.auth != null;
     }
     ```
   - Test your rules using the "Rules Playground".

## API Integration Issues

### Data Not Showing in UI

**Symptoms:**
- Empty lists in the service management component.
- Missing product or plan associations.

**Steps to Resolve:**
1. **Check Browser Console:** Look for any errors logged by the Firebase SDK or your application code.
2. **Verify API Responses:** Use the Network tab in browser developer tools to inspect the responses from Firestore. Firestore requests will appear as requests to `firestore.googleapis.com`.
3. **Check Environment Variables:** Ensure your `.env` file has the correct Firebase project configuration and it's being loaded correctly by the app.

### Service Creation Fails

**Symptoms:**
- Error notifications when trying to create or update services.
- Failed network requests in the console.

**Steps toResolve:**
1. **Check Form Validation:** Ensure all required fields are being filled out correctly in the UI.
2. **Verify Security Rules:** Your Firestore rules must allow write access. For example, to allow an admin to create a service:
   ```
   match /services/{serviceId} {
     allow create: if request.auth.token.isAdmin == true;
   }
   ```
   *Note: This requires setting an `isAdmin` custom claim on your admin users.*
3. **Log the Data:** In your `useCreateService` mutation, `console.log` the exact data object being sent to Firestore to ensure it's correctly formatted.

## Performance Issues

### Slow Loading of Service List

**Symptoms:**
- Long loading times for the service management page.
- Browser lag when many services exist.

**Steps to Resolve:**
1. **Optimize Queries:**
   - Ensure you are fetching only the data you need. Avoid fetching entire collections if you only need a few fields.
   - Use `limit()` to paginate large collections.
2. **Check Indexes:**
   - Go to the "Indexes" tab in the Firestore section of your Firebase Console.
   - Firestore automatically suggests and creates indexes, but you can create composite indexes for complex queries to improve performance. For example, if you often query services by `category` and `is_active`:
     ```json
     {
       "collectionGroup": "services",
       "queryScope": "COLLECTION",
       "fields": [
         { "fieldPath": "category", "order": "ASCENDING" },
         { "fieldPath": "is_active", "order": "ASCENDING" }
       ]
     }
     ```

### React Component Re-render Issues

**Symptoms:**
- UI freezing when interacting with modals or forms.
- Excessive re-renders shown in React DevTools.

**Steps to Resolve:**
1. Use React DevTools Profiler to identify which components are re-rendering unnecessarily.
2. Use `React.memo` to memoize components that render with the same props.
3. Use `useCallback` and `useMemo` to prevent re-creation of functions and objects in your components.

## Common Error Messages and Resolutions

### "Missing or insufficient permissions."

This is a Firestore security rule error.
**Resolution:**
- Check your Firestore rules to ensure the user has permission to perform the action.
- Verify the user is authenticated and has the correct role or custom claims if your rules require them.
- Use the "Rules Playground" in the Firebase Console to simulate the request and debug the rule.

### "Function 'XYZ' called with invalid data."

This typically happens when the data sent to a Cloud Function or a `useMutation` hook doesn't match the expected schema.
**Resolution:**
- Check the data object being passed in your component.
- Ensure all required fields are present and have the correct data types.

## Next Steps for Performance Optimization

If you're still experiencing issues:

1.  **Firebase Cloud Functions:** For complex queries or joins, create a Cloud Function that performs the data aggregation on the backend and returns a single, clean response to the client. This avoids multiple round trips.
2.  **Data Denormalization:** For frequently read data, consider denormalizing your Firestore schema to store related data together in one document, reducing the need for multiple reads. This is a common pattern in NoSQL databases.
3.  **Implement Monitoring:** Use Firebase Performance Monitoring to get insights into your app's performance in production.
