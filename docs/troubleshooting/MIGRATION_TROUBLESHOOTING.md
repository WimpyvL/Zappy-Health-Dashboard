# Firestore Schema Troubleshooting Guide

This guide provides solutions for common issues when setting up the service management feature with Firebase Firestore.

## "Failed to Fetch" or Permission Errors

If you encounter "Failed to fetch" or permission denied errors, try the following steps:

### 1. Check Firestore Security Rules

First, ensure your Firestore security rules are correctly deployed and allow access.

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to the "Firestore Database" section and click the "Rules" tab.
4. Verify your rules look something like this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read on services, products, plans for the app to function
    match /services/{serviceId} {
      allow read: if true;
      allow write: if request.auth.token.isAdmin == true;
    }
    match /service_products/{docId} {
      allow read: if true;
      allow write: if request.auth.token.isAdmin == true;
    }
     match /service_plans/{docId} {
      allow read: if true;
      allow write: if request.auth.token.isAdmin == true;
    }

    // Secure other collections
    match /patients/{patientId} {
      allow read, write: if request.auth.uid == patientId || request.auth.token.isAdmin == true;
    }
  }
}
```
**Note:** The `request.auth.token.isAdmin == true` check requires you to set custom claims for your admin users.

### 2. Verify Data Dependencies

The application code expects `services`, `products`, and `subscription_plans` collections to exist. If they are empty, the UI might not display correctly. Ensure you have some seed data.

### 3. Check for Custom Claims (`isAdmin`)

The security rules for write access depend on an `isAdmin` custom claim.

**To set a custom claim for a user:**
You'll need to use the Firebase Admin SDK, typically in a Cloud Function.

```javascript
// Example Cloud Function to set an admin claim
const admin = require('firebase-admin');
admin.initializeApp();

exports.setAdminRole = functions.https.onCall(async (data, context) => {
  // Check if request is made by an admin
  if (context.auth.token.admin !== true) {
    return { error: 'Only admins can set other admins.' };
  }
  
  // Set custom user claims on this user.
  await admin.auth().setCustomUserClaims(data.uid, { admin: true });

  return { result: `User ${data.email} is now an admin.` };
});
```

### 4. Check for UUID Extension (Not Applicable for Firestore)
Firestore automatically generates unique document IDs, so no special extensions are needed.

## Alternative Approach

If you continue to experience issues:

1.  **Use the Firebase Console**: Instead of relying solely on application code to create data, use the Firebase Console to manually add documents to the `services`, `products`, and `subscription_plans` collections to test read operations.
2.  **Temporarily Relax Rules for Debugging**: For local development *only*, you can make rules more permissive to isolate the issue. **Never do this in production.**
    ```
    // TEMPORARY RULE FOR DEBUGGING ONLY
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    ```

## Contact Support

If all troubleshooting steps fail:

1.  Check the official Firebase status page.
2.  Contact Firebase support with your error details.
3.  Consult the development team lead with logs and screenshots.
