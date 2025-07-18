# Firebase Service Management Migration Guide

This document provides step-by-step instructions for applying the service management database schema to your Firebase project.

## Background

The ServiceManagement.jsx component expects services to have relationships with products and subscription plans. The current database schema doesn't include these relationships, so we've created a script to add the necessary collections and fields.

## Prerequisites

- Access to your Firebase project console
- Admin privileges to modify Firestore

## Steps to Apply the Schema Changes

Since Firestore is schema-less, there isn't a traditional "migration" to run. Instead, you need to ensure your application code writes data in the correct structure. The API hooks have been updated to handle this.

1. **Deploy Updated `firestore.rules`**
   - The security of your data relies on Firestore Security Rules.
   - Deploy the updated `firestore.rules` file which contains rules for `services`, `service_products`, and `service_plans`.
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Verify `firestore.indexes.json`**
   - Ensure you have indexes that support the queries in your updated hooks.
   - Deploy the `firestore.indexes.json` file.
   ```bash
   firebase deploy --only firestore:indexes
   ```

3. **Deploy Application Code**
   - The updated React hooks in `src/apis/services/hooks.js` will create and manage documents in the `service_products` and `service_plans` collections as needed when you create or update a service.

## Data Model

The new relations between services, products, and subscription plans can be visualized as follows:

```
/services/{serviceId}
  - name
  - requires_consultation
  
/service_products/{docId}
  - service_id
  - product_id
  
/service_plans/{docId}
  - service_id
  - plan_id
  - duration
  - requires_subscription
```

## Testing the Changes

After deploying the updated code and security rules:

1. Open the Zappy Dashboard application
2. Navigate to the Service Management page
3. Attempt to create a new service with associated products and subscription plans
4. Verify that the relationships are correctly saved and displayed by checking the `service_products` and `service_plans` collections in your Firestore console.

## Troubleshooting

If you encounter any issues:

1. **Permission errors**: Ensure your Firestore security rules are correctly deployed and allow write access for admins. Check the "Rules" tab in your Firebase console.
2. **Data not saving**: Check the browser's developer console for any errors from the Firebase SDK. Ensure the frontend code is passing valid data to the API hooks.

## Support

If you encounter any issues with this process, please contact the development team for assistance.
