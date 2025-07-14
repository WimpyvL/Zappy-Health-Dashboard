# Telehealth Application Component Hierarchy

This document outlines the detailed component hierarchy for the rewritten React-based telehealth application. It categorizes components by their function and provides a high-level view of their relationships.

## 1. Core Application Structure

The application follows a typical React application structure, with a main `App` component, routing, and various layouts that wrap page-level components.

```mermaid
graph TD
    App --> Providers[Context Providers];
    Providers --> Router[React Router DOM];
    Router --> Layouts[Layout Components];
    Layouts --> Pages[Page Components];
    Pages --> Features[Feature Components];
    Features --> UI[UI Components];

    subgraph Providers
        P1[AuthContext.jsx]
        P2[AppContext.jsx]
        P3[CartContext.jsx]
        P4[NotificationsContext.jsx]
        P5[RouteTrackerContext.jsx]
        P6[RealTimeMessagingContext.jsx]
        P7[QueryClientProvider]
        P8[DatabaseProvider]
        P9[AIInformantProvider]
    end

    subgraph Layouts
        L1[MainLayout.jsx]
        L2[PublicFormLayout.jsx]
        L3[AuthLayout.jsx (Implicit)]
    end

    subgraph Pages
        PG1[Dashboard.jsx]
        PG2[PatientsPage.jsx]
        PG3[PatientDetail.jsx]
        PG4[HealthPage.jsx]
        PG5[OrdersPage.jsx]
        PG6[InvoicePage.jsx]
        PG7[ConsultationsPage.jsx]
        PG8[MessagingPage.jsx]
        PG9[IntakeFormPage.jsx]
        PG10[AdminEntryPoint.jsx]
        PG11[Signup.jsx]
        PG12[Unauthorized.jsx]
        PG13[Settings.jsx]
        PG14[ProductSubscriptionManagement.jsx]
        PG15[PharmacyManagement.jsx]
        PG16[InsuranceDocumentation.jsx]
        PG17[AuditLogPage.jsx]
        PG18[UIComponentsPage.jsx]
        PG19[PatientProfilePage.jsx]
        PG20[PatientBillingPage.jsx]
        PG21[PaymentMethodsPage.jsx]
        PG22[PatientFormsPage.jsx]
        PG23[FormViewer.jsx]
        PG24[ModernFormRenderer.jsx]
        PG25[LandingPage.jsx]
        PG26[TaskManagement.jsx]
        PG27[SubscriptionPlansPage.jsx]
        PG28[ResourceManagementPage.jsx]
        PG29[AdminFormSubmissionsList.jsx]
        PG30[IntakeFormEditor.jsx]
        PG31[DiscountManagement.jsx]
        PG32[TagManagementEnhanced.jsx]
        PG33[SimpleRealTimeMessaging.jsx]
        PG34[NotificationsPage.jsx]
        PG35[SystemMapPage.jsx]
        PG36[PatientNotesPage.jsx]
        PG37[EdenDownstreamTest.jsx]
    end
```

## 2. Component Categories and Examples

### 2.1. Layout Components (`src/layouts/`)

These components define the overall structure and common UI elements (headers, sidebars, footers) for different sections of the application.

*   `MainLayout.jsx`: Standard layout for authenticated users (dashboard, patient details, etc.).
    *   Includes `Sidebar`, `Header`, and a content area.
*   `PublicFormLayout.jsx`: Minimal layout for public-facing forms, without the main application navigation.
*   `AuthLayout.jsx` (Implicit): A simple layout for authentication pages (login, signup).

### 2.2. Page Components (`src/pages/`)

These are top-level components that represent distinct views or routes in the application. They often compose multiple feature components and interact with global contexts or data hooks.

*   `Dashboard.jsx`: Overview for authenticated users (admin/patient).
    *   Composes `DashboardWidgets`, `RecentActivityFeed`, etc.
*   `PatientsPage.jsx`: Displays a list of patients.
    *   Composes `PatientTable`, `PatientSearchFilter`.
*   `PatientDetail.jsx`: Displays detailed information for a single patient.
    *   Composes `PatientInfoCard`, `MedicalHistorySection`, `OrdersList`, `ConsultationHistory`.
*   `HealthPage.jsx`: Patient-specific health dashboard.
*   `OrdersPage.jsx`: List of all orders.
*   `InvoicePage.jsx`: List of all invoices.
*   `ConsultationsPage.jsx` (`UnifiedConsultationsAndCheckIns.jsx`): Manages consultations and check-ins.
*   `MessagingPage.jsx` (`SimpleMessagingPage.jsx`, `SimpleRealTimeMessaging.jsx`): Real-time chat interface.
*   `IntakeFormPage.jsx`: Renders dynamic intake forms.
*   `AdminEntryPoint.jsx`, `Signup.jsx`: Authentication related pages.
*   `Settings.jsx`: Application settings.
*   `ProductSubscriptionManagement.jsx`: Admin interface for products and subscriptions.
*   `PharmacyManagement.jsx`, `InsuranceDocumentation.jsx`, `DiscountManagement.jsx`, `TagManagementEnhanced.jsx`, `ResourceManagementPage.jsx`: Various admin management pages.
*   `AuditLogPage.jsx`: Displays system audit logs.
*   `UIComponentsPage.jsx`: A page for showcasing and testing UI components.
*   `PatientProfilePage.jsx`, `PatientBillingPage.jsx`, `PaymentMethodsPage.jsx`, `PatientFormsPage.jsx`: Patient-specific profile and billing pages.
*   `FormViewer.jsx`, `ModernFormRenderer.jsx`: Components for viewing and rendering forms.
*   `LandingPage.jsx`: The public landing page.
*   `TaskManagement.jsx`: Manages tasks.
*   `SystemMapPage.jsx`: Visual representation of the system.
*   `PatientNotesPage.jsx`: Displays patient notes.

### 2.3. Feature Components (`src/components/`)

These are reusable components that encapsulate specific features or logical blocks of UI. They often manage their own local state and interact with data hooks.

*   **Common**: `HealthcareErrorBoundary.jsx`, `LoadingSpinner.jsx`, `Modal.jsx`, `Table.jsx`, `Pagination.jsx`, `SearchInput.jsx`, `Button.jsx`, `Card.jsx`, `Badge.jsx`.
*   **Admin**: `AdminSidebar.jsx`, `AdminHeader.jsx`, `UserManagementTable.jsx`.
*   **AI**: `AIInformantProvider.jsx`, `AISummaryDisplay.jsx`, `RecommendationCard.jsx`.
*   **Cart**: `CartSummary.jsx`, `CartItem.jsx`.
*   **Forms**: `DynamicFormBuilder.jsx`, `FormField.jsx`, `FormValidationMessage.jsx`, `IntakeFormStepper.jsx`.
*   **Messaging**: `ConversationList.jsx`, `MessageThread.jsx`, `MessageInput.jsx`.
*   **Notes**: `NoteEditor.jsx`, `NoteSection.jsx`, `MedicationsCard.jsx`, `ConsultationSummary.jsx`.
*   **Patient**: `PatientInfoCard.jsx`, `PatientDashboardWidgets.jsx`, `PatientServiceCard.jsx`, `PatientOrderCard.jsx`, `PatientNotificationList.jsx`.
*   **Providers**: `ProviderProfileCard.jsx`, `ProviderSearchFilter.jsx`.
*   **UI**: `GlassCard.jsx`, `MobileMenu.jsx`, `RedesignButton.jsx`.

### 2.4. UI Components (`src/components/ui/`)

These are the most granular, presentational components. They are typically stateless and receive all necessary data and callbacks via props. They focus solely on rendering UI elements.

*   `Button.jsx`
*   `Input.jsx`
*   `Checkbox.jsx`
*   `Radio.jsx`
*   `Dropdown.jsx`
*   `Tooltip.jsx`
*   `Avatar.jsx`
*   `Icon.jsx` (using Lucide React)
*   `Spinner.jsx`
*   `ModalBase.jsx`
*   `Tab.jsx`
*   `Accordion.jsx`

## 3. Component Relationships and Data Flow

*   **Top-Down Data Flow**: Data generally flows from parent components to child components via props.
*   **Context API**: Used for global data and functions (e.g., `AuthContext` for user authentication status, `AppContext` for view mode).
*   **React Query Hooks**: Feature components and pages use custom React Query hooks (e.g., `usePatients`, `useOrders`) to fetch, cache, and update server-side data. This abstracts away the data fetching logic.
*   **Zustand Stores**: Used for local or feature-specific client-side state that needs to be shared across a few related components without prop drilling or global context overhead.
*   **Event Handling**: Child components communicate with parent components via callbacks passed as props.
*   **API Services (`src/apis/`)**: Components do not directly interact with `supabase` client. Instead, they use a dedicated `DatabaseService` (`src/services/database/index.js`) or specific API hooks (`src/apis/`). This provides a clean separation between UI and data access logic.

## 4. Directory Structure (`src/`)

The `src` directory is organized to reflect the component hierarchy and functional areas:

*   `src/App.jsx`: Main application entry point.
*   `src/index.js`: Root rendering and global providers.
*   `src/assets/`: Static assets (images, fonts).
*   `src/apis/`: API service modules (e.g., `patientsApi.js`, `ordersApi.js`).
*   `src/appGuards/`: Route protection components.
*   `src/components/`: Reusable UI and feature components, further categorized by domain (e.g., `admin`, `patient`, `forms`, `ui`).
*   `src/constants/`: Application-wide constants (routes, enums).
*   `src/contexts/`: React Context API providers.
*   `src/hooks/`: Custom React hooks.
*   `src/layouts/`: Layout components.
*   `src/lib/`: Utility functions, Supabase client initialization, React Query client.
*   `src/pages/`: Top-level page components, often corresponding to routes.
*   `src/services/`: Business logic services (e.g., `database`, `healthMonitor`, `iconService`).
*   `src/styles/`: Global CSS or Tailwind base styles.
*   `src/utils/`: General utility functions.

This structured approach ensures that components are modular, reusable, and easy to locate and maintain, contributing to a more robust and scalable application.