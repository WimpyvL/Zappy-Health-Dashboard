# Application Blueprint: Zappy-Dashboard

This document serves as the definitive blueprint for the Zappy-Dashboard application, meticulously detailing its complete architecture, user interface, core functionalities, and stylesheet.

## 1. Introduction

The Zappy-Dashboard is a comprehensive web application designed to manage various aspects of a healthcare or service-based platform. It provides functionalities for administrators, providers, and patients, streamlining operations related to consultations, patient management, forms, messaging, payments, and more.

## 2. Application Architecture

The application follows a modern web architecture, likely a client-server model with a clear separation of concerns.

### 2.1. Frontend (Client-Side)

*   **Technology Stack**: Likely React.js (given the `.jsx` files in `src/pages` and `src/components`), with a focus on modular and reusable components.
*   **Structure**:
    *   `src/pages/`: Contains top-level page components (e.g., Dashboard, Patients, Settings).
    *   `src/components/`: Houses reusable UI components categorized by domain (e.g., `forms`, `common`, `ui`).
    *   `src/contexts/`: Manages global state and provides data to components (e.g., `auth`, `cart`, `messaging`).
    *   `src/hooks/`: Custom React hooks for encapsulating logic.
    *   `src/layouts/`: Defines common page layouts.
    *   `src/styles/`: Contains global and component-specific stylesheets.
*   **Routing**: Handled client-side, likely using a library like React Router.
*   **State Management**: Potentially a combination of React Context API and local component state.

### 2.2. Backend (Server-Side)

*   **Technology Stack**: (Placeholder - e.g., Node.js with Express, Python with Django/Flask, Ruby on Rails, etc.)
*   **Database**: Likely uses Prisma as an ORM, suggesting a relational database (e.g., PostgreSQL, MySQL). The `supabase/` directory indicates potential integration with Supabase for backend services (Auth, Database, Storage, Realtime).
*   **API Endpoints**: Exposed via `src/apis/` (e.g., `auth`, `patients`, `forms`, `invoices`, `messages`, `providers`, `services`).
*   **Services**: `src/services/` contains business logic and data manipulation (e.g., `consultationService`, `invoiceService`, `formValidationService`).
*   **Middleware**: `src/server/middleware/` for request processing (e.g., authentication, logging).
*   **Webhooks**: `src/server/webhooks/` for external integrations.

### 2.3. Database

*   **ORM**: Prisma (`prisma/` directory).
*   **Migrations**: `supabase/migrations/` for managing database schema changes.
*   **Key Entities (Inferred from `src/apis/` and `prisma/`):**
    *   Users, Patients, Providers
    *   Forms, Form Submissions
    *   Consultations, Appointments, Sessions
    *   Products, Services, Subscriptions, Orders, Payments
    *   Messages, Notifications
    *   Invoices, Discounts
    *   Pharmacies, Lab Results
    *   Audit Logs, API Keys

## 3. User Interface (UI) Pages

This section outlines the key user interface pages, their general layout, content, and interactive elements.

### 3.1. Authentication Pages

*   **Landing Page (`src/pages/LandingPage.jsx`)**:
    *   **Layout**: Hero section, feature highlights, call-to-action for sign-up/login.
    *   **Content**: Marketing text, images, links to other sections.
    *   **Interactive Elements**: Login button, Sign-up button.
*   **Unauthorized Page (`src/pages/Unauthorized.jsx`)**:
    *   **Layout**: Simple, centered message.
    *   **Content**: Error message indicating lack of access.
    *   **Interactive Elements**: Link to home or login.

### 3.2. Dashboard Pages

*   **Admin Dashboard (`src/pages/dashboard/AdminDashboard.jsx`)**:
    *   **Layout**: Sidebar navigation, main content area with widgets/cards.
    *   **Content**: Overview of system health, pending tasks, recent activities, key metrics (e.g., new patients, consultations).
    *   **Interactive Elements**: Navigation links, filter options, quick action buttons.
*   **Patient Dashboard (`src/pages/dashboard/PatientDashboard.jsx`)**:
    *   **Layout**: Personalized overview.
    *   **Content**: Upcoming appointments, recent activities, quick access to health records, messaging.
    *   **Interactive Elements**: Links to schedule appointments, view messages, access resources.
*   **Provider Dashboard (`src/pages/dashboard/ProviderDashboard.jsx`)**:
    *   **Layout**: Similar to Admin, tailored for providers.
    *   **Content**: Patient queue, upcoming consultations, pending tasks, quick access to patient notes.
    *   **Interactive Elements**: Links to patient profiles, consultation notes, scheduling.

### 3.3. Patient Management

*   **Patients List (`src/pages/patients/Patients.jsx`)**:
    *   **Layout**: Table/list view with search and filter options.
    *   **Content**: Patient names, IDs, status, last activity.
    *   **Interactive Elements**: Search bar, filters, pagination, "Add New Patient" button, clickable rows to view patient details.
*   **Patient Detail Page (`src/pages/patients/PatientDetail.jsx`, `src/pages/patients/PatientDetailOptimized.jsx`)**:
    *   **Layout**: Tabbed interface (e.g., Overview, Health, Billing, Notes, Messages, Orders, Documents, Forms, Sessions).
    *   **Content**: Comprehensive patient information, medical history, consultation notes, billing details, messaging history, lab results, treatment plans.
    *   **Interactive Elements**: Edit profile, add notes, send message, view/upload documents, manage subscriptions, initiate consultations.

### 3.4. Forms Management

*   **Forms Management (`src/pages/settings/pages/forms/FormsManagement.jsx`)**:
    *   **Layout**: Table of existing forms, form builder interface.
    *   **Content**: Form names, status, creation date, associated services.
    *   **Interactive Elements**: Create New Form, Edit Form, Delete Form, Preview Form, Import Form.
*   **Form Builder (`src/pages/settings/pages/forms/FormBuilderElements.jsx`, `src/pages/settings/pages/forms/FormPages.jsx`, `src/components/forms/unified/`)**:
    *   **Layout**: Drag-and-drop interface for form elements, properties panel, page management.
    *   **Content**: Various input types (text, textarea, select, radio, checkbox), conditional logic settings.
    *   **Interactive Elements**: Add element, reorder elements, configure element properties, add/remove pages, save form.
*   **Unified Form Demo (`src/pages/demo/UnifiedFormDemo.jsx`)**:
    *   **Layout**: Demonstrates the unified form rendering capabilities.
    *   **Content**: Example forms with various field types.
    *   **Interactive Elements**: Form submission, validation feedback.

### 3.5. Consultations & Check-ins

*   **Unified Consultations and Check-ins (`src/pages/consultations/UnifiedConsultationsAndCheckIns.jsx`)**:
    *   **Layout**: List/table of consultations, detailed view for individual consultations.
    *   **Content**: Patient name, provider, date, status, consultation type.
    *   **Interactive Elements**: Filter consultations, search, open consultation notes, approve/reject.
*   **Initial Consultation Notes (`src/pages/consultations/InitialConsultationNotes.jsx`)**:
    *   **Layout**: Structured form for capturing consultation details.
    *   **Content**: Patient history, assessment, plan, medications, services.
    *   **Interactive Elements**: Text inputs, dropdowns, checkboxes, save/submit buttons, AI composition tools.

### 3.6. Messaging

*   **Messaging Page (`src/pages/messaging/MessagingPage.jsx`, `src/pages/messaging/SimpleMessagingPage.jsx`)**:
    *   **Layout**: Conversation list sidebar, message view panel.
    *   **Content**: List of conversations, message history, message input.
    *   **Interactive Elements**: Start new conversation, send message, attach files, use templates.

### 3.7. Settings

*   **Settings Page (`src/pages/settings/Settings.jsx`)**:
    *   **Layout**: Sidebar navigation for different settings categories (e.g., Account, LLM, Forms, Prompts, Referrals).
    *   **Content**: Configuration options for various application features.
    *   **Interactive Elements**: Input fields, toggles, save buttons.

### 3.8. Other Key Pages (Inferred)

*   **Cart Page (`src/pages/cart/CartPage.jsx`)**: For managing items before checkout.
*   **Orders Page (`src/pages/orders/Orders.jsx`)**: Viewing and managing orders.
*   **Marketplace Page (`src/pages/marketplace/MarketplacePage.jsx`)**: Browsing and purchasing services/products.
*   **Notifications Page (`src/pages/notifications/NotificationsPage.jsx`)**: Viewing system notifications.
*   **Product Management (`src/pages/products/ProductManagement.jsx`)**: Admin interface for products.
*   **Provider Management (`src/pages/providers/ProviderManagement.jsx`)**: Admin interface for providers.
*   **Pharmacy Management (`src/pages/pharmacy/PharmacyManagement.jsx`)**: Admin interface for pharmacies.
*   **System Map Page (`src/pages/system-map/SystemMapPage.jsx`)**: Visual representation of system components and flows.

## 4. Core Functionalities

### 4.1. User Stories (High-Level Examples)

*   **As an Admin, I want to manage user accounts** so I can control access and roles within the system.
*   **As a Provider, I want to conduct patient consultations** so I can assess patient needs and prescribe treatments.
*   **As a Patient, I want to view my health records** so I can stay informed about my medical history.
*   **As a User, I want to fill out forms** so I can provide necessary information for services.
*   **As a User, I want to send and receive messages** so I can communicate with providers or support.
*   **As an Admin, I want to define custom forms** so I can collect specific data from users.

### 4.2. Backend Logic (Key Services & Operations)

*   **Authentication & Authorization**: User registration, login, session management, role-based access control.
*   **Patient Management**: CRUD operations for patient profiles, health records, and associated data.
*   **Form Processing**: Form definition, submission handling, data validation (`src/services/enhancedFormValidationService.js`), and storage.
*   **Consultation Workflow**: Scheduling, note-taking, medication/service ordering, follow-up management.
*   **Messaging**: Real-time messaging (`src/services/realtime/`), conversation management, notifications.
*   **Order & Payment Processing**: Cart management, order creation, payment gateway integration, invoice generation (`src/services/invoiceService.js`).
*   **API Key Management**: Secure handling and validation of API keys.
*   **Audit Logging**: Tracking significant system events and user actions.

### 4.3. API Specifications (General Structure)

The API endpoints are organized by resource, following RESTful principles.

*   **Base URL**: `[Your API Base URL]`
*   **Authentication**: Token-based authentication (e.g., JWT) for secure access.
*   **Common Request/Response Formats**: JSON.
*   **Error Handling**: Standard HTTP status codes (e.g., 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error).

**Example API Categories (from `src/apis/`):**

*   `/api/auth`: User authentication (login, register, logout).
*   `/api/patients`: Patient profiles, health data.
*   `/api/forms`: Form definitions, form submissions.
*   `/api/consultations`: Consultation details, notes.
*   `/api/messages`: Sending and retrieving messages.
*   `/api/products`: Product listings, details.
*   `/api/orders`: Order creation, status updates.
*   `/api/invoices`: Invoice generation, payment status.
*   `/api/providers`: Provider profiles, availability.
*   `/api/services`: Service definitions.
*   `/api/users`: User management.

## 5. Complete Stylesheet

The application's visual design is governed by a comprehensive stylesheet, ensuring a consistent and cohesive user experience.

### 5.1. Styling Approach

*   **Methodology**: (Placeholder - e.g., CSS Modules, Styled Components, Tailwind CSS, SASS/LESS, or a combination). The presence of `.css` files alongside `.jsx` components (e.g., `src/pages/consultations/InitialConsultationNotes.css`, `src/pages/patients/health/HealthPage.css`) suggests a component-scoped or global CSS approach.
*   **Global Styles**: Defined in `src/styles/` for base typography, colors, spacing, and common utilities.
*   **Component-Specific Styles**: Stylesheets co-located with components (e.g., `src/components/forms/styles/`).
*   **Theming**: Potential for theming capabilities, possibly indicated by `src/styles/glassmorphic/` for a specific design aesthetic.

### 5.2. Key Design Tokens & Principles

*   **Color Palette**: (Placeholder - e.g., Primary, Secondary, Accent, Success, Warning, Error colors).
*   **Typography**: Defined font families, sizes, weights for headings, body text, and UI elements.
*   **Spacing**: Consistent use of spacing units (e.g., `rem`, `px`) for margins, padding, and gaps.
*   **Breakpoints**: Responsive design breakpoints for various screen sizes (mobile, tablet, desktop).
*   **Component Styling**: Consistent styling for common UI elements like buttons, inputs, cards, modals, and tables.
*   **Glassmorphic Design**: The `src/styles/glassmorphic/` directory suggests the application might incorporate glassmorphic UI elements, characterized by frosted glass effects, transparency, and subtle shadows.

### 5.3. Example Structure (Conceptual)

```css
/* src/styles/variables.css (or similar) */
:root {
    --color-primary: #007bff;
    --color-secondary: #6c757d;
    --color-success: #28a745;
    --color-danger: #dc3545;

    --font-family-base: 'Arial', sans-serif;
    --font-size-base: 16px;

    --spacing-unit: 8px; /* Base unit for consistent spacing */

    --border-radius-base: 4px;
    --box-shadow-base: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* src/styles/base.css */
body {
    font-family: var(--font-family-base);
    font-size: var(--font-size-base);
    color: #333;
    line-height: 1.6;
}

h1, h2, h3, h4, h5, h6 {
    color: var(--color-primary);
    margin-bottom: calc(var(--spacing-unit) * 2);
}

/* src/components/forms/styles/Form.css */
.form-container {
    padding: calc(var(--spacing-unit) * 3);
    border: 1px solid #eee;
    border-radius: var(--border-radius-base);
    box-shadow: var(--box-shadow-base);
}

.form-input {
    width: 100%;
    padding: var(--spacing-unit);
    margin-bottom: var(--spacing-unit);
    border: 1px solid #ccc;
    border-radius: var(--border-radius-base);
}

/* src/styles/glassmorphic/GlassCard.css */
.glass-card {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: calc(var(--spacing-unit) * 4);
}
```

This document provides a high-level blueprint. For detailed implementation specifics, refer to the individual code files and more granular documentation within the respective directories (e.g., `docs/api/`, `docs/architecture/`).