# Telehealth Application Flow Diagrams

This document details the key application flows within the rewritten telehealth platform, focusing on the patient journey and core administrative processes.

## 1. Patient Onboarding & Product/Service Enrollment Flow

This flow describes how a new or existing patient selects a health category, completes intake forms, and enrolls in a product or service.

```mermaid
graph TD
    A[Patient Lands on Platform] --> B{Select Health Category/Product};
    B --> C{Is Patient Authenticated?};
    C -- No --> D[Signup/Login];
    D --> E[Patient Dashboard];
    C -- Yes --> E;
    E --> F[Browse Products/Services];
    F --> G{Select Product/Service};
    G --> H[View Product Details/Pricing];
    H --> I[Add to Cart / Initiate Enrollment];
    I --> J[Complete Intake Forms];
    J --> K{Form Submission Valid?};
    K -- No --> J;
    K -- Yes --> L[AI/Provider Review (Optional)];
    L --> M[Order Creation / Subscription Activation];
    M --> N[Payment Processing (Stripe)];
    N --> O{Payment Successful?};
    O -- No --> P[Payment Failure Notification];
    O -- Yes --> Q[Enrollment Confirmation / Access to Services];
    Q --> R[Schedule Initial Consultation (If Required)];
    R --> S[Patient Dashboard / Service Access];

    subgraph Intake Forms
        J -- Dynamic Forms --> J1[Render Form based on Category/Product];
        J1 --> J2[Patient Fills Form];
        J2 --> J3[Form Data Validation];
        J3 -- Invalid --> J2;
        J3 -- Valid --> J4[Submit Form Data];
        J4 --> J;
    end

    subgraph Backend Processes
        L --> L1[AI Analysis of Form Data];
        L1 --> L2[Provider Review & Approval];
        L2 --> M;
        M --> M1[Create Order/Subscription Record];
        M1 --> N;
        N --> N1[Stripe API Call];
        N1 --> N2[Handle Webhook Events];
        N2 --> O;
        Q --> Q1[Send Welcome/Onboarding Notifications];
        Q1 --> R;
    end
```

## 2. Consultation Flow (Provider Perspective)

This flow outlines how a provider manages and conducts patient consultations.

```mermaid
graph TD
    A[Provider Logs In] --> B[Provider Dashboard];
    B --> C[View Upcoming Consultations];
    C --> D{Select Consultation};
    D --> E[Access Patient Chart];
    E --> F[Review Patient History & Forms];
    F --> G[Conduct Consultation (Video/Chat)];
    G --> H[Document Consultation Notes];
    H --> H1[Use Note Templates];
    H1 --> H2[AI-Assisted Summarization/Drafting];
    H2 --> H3[Add Prescriptions/Orders];
    H3 --> I[Finalize Consultation Notes];
    I --> J[Generate Patient Summary/Instructions];
    J --> K[Send Patient Communication];
    K --> L[Update Patient Status/Follow-up];
    L --> M[Consultation Completed];

    subgraph Documentation
        H --> H1;
        H --> H2;
        H --> H3;
    end

    subgraph Integrations
        H3 -- Prescriptions --> H3a[Pharmacy Integration];
        H3 -- Lab Orders --> H3b[Lab Integration];
        K -- Email/SMS --> K1[Notification Service];
    end
```

## 3. Messaging Flow (Real-time Chat)

This flow describes the real-time messaging capabilities between patients and providers/staff.

```mermaid
graph TD
    A[User (Patient/Provider) Logs In] --> B[Access Messaging Interface];
    B --> C[View Conversation List];
    C --> D{Select Existing Conversation / Start New};
    D --> E[Load Message History];
    E --> F[Compose Message];
    F --> G[Send Message];
    G --> H[Supabase Realtime Broadcast];
    H --> I[Recipient Receives Message];
    I --> J[Display New Message];
    J --> K[Mark as Read];
    K --> L[Update Conversation Status (e.g., unread count)];

    subgraph Real-time Communication
        G --> H;
        H --> I;
    end
```

## 4. Admin Management Flow (Example: Product Management)

This flow illustrates how an administrator manages products and services.

```mermaid
graph TD
    A[Admin Logs In] --> B[Admin Dashboard];
    B --> C[Navigate to Product Management];
    C --> D[View Product List];
    D --> E{Select Product / Create New};
    E -- Select --> F[Edit Product Details];
    E -- Create --> G[Define New Product];
    F --> H[Update Product Information];
    G --> H;
    H --> I[Save Product];
    I --> J{Validation Successful?};
    J -- No --> F;
    J -- Yes --> K[Product Updated/Created];
    K --> L[Update Product Catalog (Frontend)];
    L --> M[Notify Relevant Systems (e.g., AI for recommendations)];
```

## 5. Data Synchronization & Background Processes

This flow highlights the asynchronous and scheduled tasks that support the application.

```mermaid
graph TD
    A[Scheduled Task Trigger] --> B[Background Worker/Edge Function];
    B --> C{Process Type};
    C -- Invoice Generation --> C1[Identify Recurring Subscriptions];
    C1 --> C2[Generate Invoices];
    C2 --> C3[Initiate Auto-Payments (Stripe)];
    C -- Notification Sending --> C4[Identify Pending Notifications];
    C4 --> C5[Send Email/SMS (Twilio/SendGrid)];
    C -- Data Sync --> C6[Fetch Data from External API (Lab/Pharmacy)];
    C6 --> C7[Transform Data];
    C7 --> C8[Update Database];
    C -- AI Processing --> C9[Identify New Consultation Notes];
    C9 --> C10[Send to LLM for Summarization];
    C10 --> C11[Store AI Summary in Database];