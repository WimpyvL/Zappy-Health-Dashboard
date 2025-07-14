# Telehealth Application API Structure and Endpoints

This document defines the RESTful API structure and key endpoints for the rewritten telehealth application. The API will primarily leverage Supabase's auto-generated API for direct table interactions, complemented by custom API endpoints (via Supabase Edge Functions or a dedicated Node.js backend) for complex business logic and integrations.

## 1. API Design Principles

*   **RESTful**: Use standard HTTP methods (GET, POST, PUT, DELETE) for resource manipulation.
*   **Resource-Oriented**: APIs are organized around resources (e.g., `/patients`, `/orders`).
*   **Predictable URLs**: Consistent and hierarchical URL structure.
*   **Stateless**: Each request from client to server must contain all the information needed to understand the request.
*   **JSON for Data Exchange**: Request and response bodies will be JSON.
*   **Versioning**: Implement API versioning (e.g., `/v1/patients`) for future compatibility.
*   **Authentication & Authorization**: JWT-based authentication with role-based access control (RBAC) enforced via Supabase RLS and backend middleware.
*   **Error Handling**: Consistent error response format with clear error codes and messages.
*   **Pagination, Filtering, Sorting**: Support for common query parameters to manage data retrieval.

## 2. Base URL

`https://api.yourdomain.com/v1` (or `http://localhost:3001/api/v1` for local development if a custom backend is used)

## 3. Authentication Endpoints (Handled by Supabase Auth)

These endpoints are typically managed directly by the Supabase client library.

*   `POST /auth/v1/signup`: Register a new user.
*   `POST /auth/v1/signin`: Log in a user.
*   `POST /auth/v1/signout`: Log out a user.
*   `POST /auth/v1/recover`: Initiate password reset.
*   `PUT /auth/v1/password`: Update password.
*   `GET /auth/v1/user`: Get current authenticated user details.

## 4. Core Application Endpoints

These endpoints will primarily interact with the Supabase PostgreSQL database, leveraging RLS for security. Custom logic might be implemented in Edge Functions or a dedicated backend for complex operations.

### 4.1. Patients

*   `GET /patients`: Get a list of all patients (admin/provider only).
    *   **Query Params**: `page`, `pageSize`, `search`, `status`, `tagIds`
*   `GET /patients/{id}`: Get details of a specific patient.
*   `POST /patients`: Create a new patient (admin/provider only).
*   `PUT /patients/{id}`: Update patient details.
*   `DELETE /patients/{id}`: Delete a patient (admin only).
*   `GET /patients/{id}/profile`: Get patient's profile details.
*   `PUT /patients/{id}/profile`: Update patient's profile details.
*   `GET /patients/{id}/health-data`: Get patient's health data (e.g., vitals, lab results).
*   `POST /patients/{id}/tags`: Add tags to a patient.
*   `DELETE /patients/{id}/tags/{tagId}`: Remove a tag from a patient.

### 4.2. Providers

*   `GET /providers`: Get a list of all providers.
    *   **Query Params**: `page`, `pageSize`, `search`, `specialization`, `status`
*   `GET /providers/{id}`: Get details of a specific provider.
*   `POST /providers`: Create a new provider (admin only).
*   `PUT /providers/{id}`: Update provider details.
*   `DELETE /providers/{id}`: Delete a provider (admin only).

### 4.3. Products & Services

*   `GET /products`: Get a list of all products/services.
    *   **Query Params**: `category`, `type`, `requiresPrescription`, `isActive`
*   `GET /products/{id}`: Get details of a specific product/service.
*   `POST /products`: Create a new product/service (admin only).
*   `PUT /products/{id}`: Update product/service details.
*   `DELETE /products/{id}`: Delete a product/service (admin only).
*   `GET /categories`: Get a list of all product/service categories.

### 4.4. Orders & Invoices

*   `GET /orders`: Get a list of all orders.
    *   **Query Params**: `patientId`, `status`, `dateRange`
*   `GET /orders/{id}`: Get details of a specific order.
*   `POST /orders`: Create a new order.
*   `PUT /orders/{id}`: Update order status/details.
*   `GET /invoices`: Get a list of all invoices.
    *   **Query Params**: `patientId`, `status`, `dateRange`, `billingType`
*   `GET /invoices/{id}`: Get details of a specific invoice.
*   `POST /invoices/{id}/pay`: Process payment for an invoice (triggers Stripe integration).

### 4.5. Consultations & Sessions

*   `GET /consultations`: Get a list of all consultations.
    *   **Query Params**: `patientId`, `providerId`, `status`, `dateRange`
*   `GET /consultations/{id}`: Get details of a specific consultation.
*   `POST /consultations`: Create a new consultation.
*   `PUT /consultations/{id}`: Update consultation details (e.g., notes, status).
*   `GET /sessions`: Get a list of all sessions.
*   `GET /sessions/{id}`: Get details of a specific session.
*   `POST /sessions/{id}/tags`: Add tags to a session.
*   `DELETE /sessions/{id}/tags/{tagId}`: Remove a tag from a session.

### 4.6. Forms & Questionnaires

*   `GET /questionnaires`: Get a list of all questionnaire templates.
    *   **Query Params**: `categoryId`, `isActive`, `serviceType`
*   `GET /questionnaires/{id}`: Get details of a specific questionnaire template.
*   `POST /questionnaires`: Create a new questionnaire template (admin only).
*   `PUT /questionnaires/{id}`: Update a questionnaire template (admin only).
*   `GET /form-submissions`: Get a list of all form submissions.
    *   **Query Params**: `patientId`, `questionnaireId`, `status`
*   `GET /form-submissions/{id}`: Get details of a specific form submission.
*   `POST /form-submissions`: Submit a new form.
*   `PUT /form-submissions/{id}`: Update a form submission (e.g., status, validation summary).

### 4.7. Messaging

*   `GET /conversations`: Get a list of user's conversations.
*   `GET /conversations/{id}`: Get details of a specific conversation.
*   `POST /conversations`: Create a new conversation.
*   `GET /conversations/{id}/messages`: Get messages within a conversation.
*   `POST /conversations/{id}/messages`: Send a new message to a conversation.
*   `POST /conversations/{id}/participants`: Add participants to a conversation.
*   `DELETE /conversations/{id}/participants/{userId}`: Remove a participant from a conversation.

### 4.8. AI & Recommendations

*   `POST /ai/summarize-consultation`: Generate an AI summary for a consultation (custom Edge Function/Backend).
*   `POST /ai/recommend-products`: Get AI-driven product recommendations based on patient data (custom Edge Function/Backend).
*   `GET /product-recommendation-rules`: Get all product recommendation rules (admin only).
*   `POST /product-recommendation-rules`: Create a new product recommendation rule (admin only).

### 4.9. Documents

*   `GET /patients/{id}/documents`: List documents for a patient.
*   `POST /patients/{id}/documents`: Upload a new document for a patient (uses Supabase Storage).
*   `GET /patients/{id}/documents/{documentId}`: Get a specific document.
*   `DELETE /patients/{id}/documents/{documentId}`: Delete a document.

### 4.10. Audit Logs

*   `GET /audit-logs`: Get a list of audit logs (admin only).
    *   **Query Params**: `userId`, `actionType`, `dateRange`

## 5. Custom API Endpoints (Examples for Node.js Backend / Edge Functions)

These are examples of more complex operations that might require a dedicated backend service or Edge Function beyond direct Supabase table interactions.

*   `POST /v1/onboarding/initiate`: Initiates the patient onboarding flow, potentially creating multiple related records (`enhanced_telehealth_flows`, initial `form_submissions`).
*   `POST /v1/integrations/pharmacy/send-prescription`: Sends a prescription to an external pharmacy system.
*   `POST /v1/integrations/lab/order-test`: Orders a lab test from an external lab system.
*   `POST /v1/notifications/send-custom`: Sends a custom email/SMS notification.
*   `GET /v1/reports/patient-engagement`: Generates a complex report on patient engagement.

## 6. API Security and Authorization

*   **JWT (JSON Web Tokens)**: All authenticated API requests will include a JWT in the `Authorization: Bearer <token>` header.
*   **Supabase RLS**: The primary layer of authorization for direct database access. Policies will be defined for each table to restrict read/write/update/delete operations based on user roles and ownership.
*   **Backend Middleware**: For custom API endpoints, middleware will verify JWTs and enforce additional authorization rules (e.g., checking specific permissions beyond basic roles).
*   **Input Validation**: All incoming API requests will be validated to prevent malicious data and ensure data integrity.
*   **Rate Limiting**: Implement rate limiting to protect against abuse and denial-of-service attacks.

This API structure provides a clear and organized way to interact with the telehealth application's data and functionality, supporting both direct database interactions and complex business logic.