
# Firebase Backend Implementation Plan for HealthFlow

This document outlines a strategic plan for building a secure, scalable, and HIPAA-compliant backend for the HealthFlow application using Firebase services. It includes a comprehensive breakdown of the logic required for all frontend components.

## 1. Core Firebase Services

We will leverage the following Firebase services:

*   **Cloud Firestore:** As the primary NoSQL database for storing structured patient data, consultations, appointments, and other application data. Its robust security rules are essential for HIPAA compliance.
*   **Firebase Storage:** For securely storing patient-related files such as medical records, lab results, and insurance documents.
*   **Firebase Realtime Database / Firestore Listeners:** To provide real-time updates for features like live chat, appointment status changes, and notifications.
*   **Cloud Functions for Firebase:** To run backend code for complex business logic, data validation, and creating audit trails, without exposing sensitive operations to the client.

---

## 2. Firestore Database for Patient Data (HIPAA Focus)

The cornerstone of our HIPAA compliance strategy is the secure structuring and access control of patient data in Firestore.

### **Data Structure Strategy:**

We will use separate top-level collections to isolate different data types. This prevents deep nesting and simplifies security rules.

*   **`/patients/{patientId}`:** Stores non-medical patient demographic data.
    *   `patientId` should be the same as the Firebase Auth `uid`.
*   **`/medical_records/{recordId}`:** Stores Protected Health Information (PHI).
    *   `patientId`: A reference to the patient this record belongs to.
    *   This collection will have the strictest security rules.
*   **`/appointments/{appointmentId}`:** Stores appointment details.
    *   `patientId`, `providerId`: References to the patient and provider involved.
*   **`/messages/{conversationId}/chats/{messageId}`:** Stores chat messages.
    *   Each conversation document will have a subcollection for its messages.
*   **`/audit_logs/{logId}`:** Stores logs for security and compliance.

### **HIPAA Compliance Strategy for Firestore:**

1.  **Access Control with Security Rules:** This is the most critical part. We will implement granular rules to ensure data isolation.
    *   A patient can only read/write their own data.
    *   A provider can only access data for patients they are assigned to.
    *   Admins have broader, but still logged, access.

    **Example Firestore Security Rule:**
    ```
    match /medical_records/{recordId} {
      // A user can only access a medical record if their UID matches the patientId on the record.
      allow read, write: if request.auth.uid == resource.data.patientId;
    }
    ```

2.  **Data Minimization:** Only store the minimum necessary PHI. Avoid storing sensitive data like full credit card numbers.
3.  **Encryption:** Firebase automatically encrypts data at rest and in transit. No extra setup is needed for this baseline, but it's a key compliance feature.

---

## 3. Firebase Storage for Documents

### **Storage Strategy:**

*   **Structured Paths:** Files will be stored in paths that include the `patientId` to simplify access control rules. For example: `patient-documents/{patientId}/{documentId}.pdf`.
*   **Access Control with Storage Rules:** Similar to Firestore, we will use rules to control who can upload, download, or delete files.

    **Example Storage Security Rule:**
    ```
    match /b/{bucket}/o/patient-documents/{patientId}/{documentId} {
      // A user can only access files in their own folder.
      allow read, write: if request.auth.uid == patientId;
    }
    ```

---

## 4. Real-time Functionality

We will use Firestore's real-time listeners to update the UI instantly when database changes occur.

### **Implementation Strategy:**

*   **Client-Side Listeners:** The application will listen for changes to specific documents or collections.
    *   **Example Use Case:** A provider's dashboard could listen for new appointments being scheduled. When a new document appears in the `appointments` collection for that provider, their UI updates automatically.
*   **Secure Subscriptions:** Firestore security rules are automatically applied to real-time listeners, so users will only receive updates for data they are authorized to see.

---

## 5. Audit Trails with Cloud Functions

To ensure accountability and meet HIPAA requirements, we will create an audit trail for all significant events.

### **Implementation Strategy:**

*   **Cloud Function Triggers:** We'll write Cloud Functions that trigger on specific database events (e.g., creating, updating, or deleting a document in `medical_records`).
*   **Logging:** The function will log key information to the `/audit_logs` collection in Firestore.

    **Example Audit Log Entry:**
    ```json
    {
      "timestamp": "2023-10-27T10:00:00Z",
      "userId": "provider_abc",
      "action": "READ_MEDICAL_RECORD",
      "targetPatientId": "patient_xyz",
      "details": "Provider accessed patient's lab results."
    }
    ```
---

## 6. Comprehensive Backend Logic by Page

This section details the required backend logic for each page and component in the application.

### **`/dashboard` (Main Dashboard)**
-   **Stat Cards (`Total Patients`, `Upcoming Sessions`, etc.)**
    -   **Logic**: Firestore queries to aggregate counts from `patients`, `sessions`, `orders`, and `consultations` collections. These queries should be efficient, using `.count()` where possible.
    -   **Functions**: `getPatientCount()`, `getUpcomingSessionsCount()`, `getPendingOrdersCount()`, `getNewConsultationsCount()`.
-   **Today's Sessions Card**
    -   **Logic**: Query the `sessions` collection for documents where the session date is today's date.
    -   **Functions**: `getTodaysSessions(providerId)`.
-   **Tasks Card**
    -   **Logic**: Query the `tasks` collection for tasks assigned to the current user with a status of 'Pending' or 'In Progress'.
    -   **Functions**: `getPendingTasks(userId)`.
-   **Recent Orders / Pending Consultations**
    -   **Logic**: Paginated queries to the `orders` and `consultations` collections, ordered by creation date descending.
    -   **Functions**: `getRecentOrders(limit)`, `getPendingConsultations(limit)`.

### **`/dashboard/patients` (Patient List)**
-   **Add Patient Button**: Opens `PatientFormModal`.
    -   **Logic**: A Cloud Function (`createPatient`) that:
        1.  Creates a new user in Firebase Authentication.
        2.  Creates a corresponding document in the `/patients` collection in Firestore.
        3.  Logs the creation event in `/audit_logs`.
        4.  Validates for duplicate emails.
-   **Patient Table**:
    -   **Logic**: A paginated and filterable Firestore query to the `patients` collection. Backend logic should support filtering by plan, status, tags and searching by name/email.
    -   **Functions**: `getPatients(options: {page, limit, filters, searchTerm})`.
-   **Edit Button**: Opens `PatientFormModal` with existing data.
    -   **Logic**: A Cloud Function (`updatePatient`) to update the patient document in Firestore and log the event.
-   **Message Button**: Opens `ViewMessageModal`.
    -   **Logic**: Initiates or retrieves a conversation thread between the provider and the patient. See `/dashboard/messages` for details.
    -   **Functions**: `getOrCreateConversation(patientId, providerId)`.

### **`/dashboard/patients/[id]` (Patient Detail)**
-   **Data Loading**: Fetches a single patient document and related data (orders, notes, etc.) from multiple collections.
-   **Tabs (Overview, Messages, Notes, etc.)**: Each tab will trigger different backend queries.
    -   **Patient Info Tab**: CRUD operations on the `/patients/{patientId}` document.
    -   **Orders Tab**: List and filter orders from `/orders` collection where `patientId` matches.
    -   **Billing Tab**: Fetch invoices and payment history related to the patient.
    -   **Notes Tab**: CRUD operations for clinical notes in a dedicated sub-collection like `/patients/{patientId}/notes`.
-   **Admin Tools Panel**:
    -   **Logic**: Fetches administrative data like `lastLogin`, `registrationDate`. Updates system notes.
    -   **Functions**: `getAdminPatientDetails(patientId)`, `updateSystemNotes(patientId, notes)`.

### **`/dashboard/sessions`**
-   **Schedule Session Modal**:
    -   **Logic**: A Cloud Function (`scheduleSession`) to create a new document in the `appointments` collection. It should validate provider availability and prevent double-booking.
    -   **Functions**: `scheduleSession(sessionDetails)`.
-   **Session Table**:
    -   **Logic**: Query `appointments` collection, with filters for type and status.
    -   **Functions**: `getSessions(options)`.
-   **Edit/Cancel Actions**: Cloud Functions to update or delete appointment documents.

### **`/dashboard/orders`**
-   **Create Order Modal**:
    -   **Logic**: Cloud Function to create an `order` document. It should link to a patient, session (optional), and pharmacy.
    -   **Functions**: `createOrder(orderDetails)`.
-   **Orders Table**:
    -   **Logic**: Query `orders` collection with filtering.
    -   **Functions**: `getOrders(options)`.
-   **Update Status**: Cloud Function to update the `status` field of an order document.

### **`/dashboard/invoices`**
-   **Create Invoice Modal**:
    -   **Logic**: Cloud Function `createInvoice` to generate a new invoice document, potentially linking it to a subscription plan and applying discounts.
    -   **Functions**: `createInvoice(invoiceData)`.
-   **Invoice Table**:
    -   **Logic**: Query `invoices` collection with filtering.
    -   **Functions**: `getInvoices(options)`.

### **`/dashboard/tasks`**
-   **Add Task Modal**:
    -   **Logic**: Cloud Function `createTask` to create a new task document, assigning it to a user.
    -   **Functions**: `createTask(taskData)`.
-   **Task Table**:
    -   **Logic**: Query `tasks` collection, filtered by assignee and status.
    -   **Functions**: `getTasks(userId, filters)`.

### **`/dashboard/insurance`**
-   **Upload Document Modal**:
    -   **Logic**:
        1.  Client gets a secure upload URL from a Cloud Function.
        2.  Client uploads the file directly to Firebase Storage using the URL.
        3.  On successful upload, a Cloud Function trigger creates a metadata document in Firestore (e.g., in `/insurance_documents`).
    -   **Functions**: `getSecureUploadUrl(patientId, fileName)`, `onDocumentUpload(storageObject)`.

### **`/dashboard/messages`**
-   **New/View Message Modals**:
    -   **Logic**: Real-time communication using Firestore listeners. Messages are added to a subcollection like `/conversations/{convoId}/messages`.
    -   **Functions**: `sendMessage(conversationId, messageData)`, `getMessages(conversationId)`. Subscriptions will be set up on the client to listen for new messages.

### **`/dashboard/admin/...` (Admin Pages)**
-   **General Logic**: All admin pages (Providers, Pharmacies, Tags, Discounts, Products, Resources) will require backend logic for full CRUD operations on their respective Firestore collections. These should be protected by Cloud Functions that verify the caller has an 'admin' role.
-   **Audit Log**:
    -   **Logic**: This page reads from the `/audit_logs` collection. No write operations are performed from the client; logs are only created by other Cloud Functions.
    -   **Functions**: `getAuditLogs(options)`.
-   **Settings Page**:
    -   **Logic**: Read and write to a `/settings` collection or a specific settings document. Role changes should trigger a custom claim update in Firebase Auth.
    -   **Functions**: `getSettings()`, `updateSettings(newSettings)`, `updateUserRole(userId, newRole)`.

---
## 7. Implementation Plan & Timeline

### **Phase 1: Database Setup & Basic CRUD (1-2 Weeks)**
*   [ ] Finalize Firestore data models.
*   [ ] Set up initial Firestore security rules for patient data isolation.
*   [ ] Implement basic Create, Read, Update, Delete (CRUD) operations for patient profiles.
*   [ ] Set up Firebase Storage with basic rules.

### **Phase 2: Core Features & Logic (2-3 Weeks)**
*   [ ] Implement appointment scheduling logic.
*   [ ] Build out the secure document upload/download functionality.
*   [ ] Create Cloud Functions for audit logging on critical data access.

### **Phase 3: Real-time Features & Polish (1-2 Weeks)**
*   [ ] Integrate Firestore listeners for real-time dashboard updates.
*   [ ] Implement real-time messaging.
*   [ ] Refine security rules and conduct a security review.

### **Important Prerequisite:**
*   For HIPAA compliance, you must sign a **Business Associate Agreement (BAA)** with Google Cloud Platform, as Firebase is a GCP service. This is a legal requirement.
