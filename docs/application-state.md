# Zappy Health Dashboard - Application State Documentation

## 1. Overview

This document provides a comprehensive overview of the Zappy Health Dashboard application's current state, including its architecture, key components, and core functionalities.

The application is a modern, full-stack telehealth platform built with a focus on providing a seamless and efficient experience for healthcare providers. It leverages a robust technology stack to deliver a feature-rich dashboard for managing patients, appointments, billing, and more.

## 2. Technology Stack

- **Framework:** Next.js (v13+ with App Router)
- **Language:** TypeScript
- **Backend & Database:** Firebase (Authentication, Firestore, Storage)
- **Styling:** Tailwind CSS with a custom theme defined in `tailwind.config.ts`.
- **UI Components:** A custom component library built using Radix UI and styled-components, located in `src/components/ui`.
- **State Management:** A combination of React's native state management (`useState`, `useEffect`) and a custom `useToast` hook for application-wide notifications.
- **Linting & Formatting:** ESLint and Prettier (inferred from standard Next.js setup).

## 3. Project Structure

The project follows a standard Next.js App Router structure:

```
/
├── src/
│   ├── app/                # Main application routes
│   │   ├── (auth)/         # Authentication-related pages (login, etc.)
│   │   └── dashboard/      # Protected dashboard routes
│   │       ├── patients/
│   │       ├── sessions/
│   │       └── ... (other dashboard sections)
│   ├── components/         # Reusable components
│   │   └── ui/             # Core UI component library (Button, Card, etc.)
│   ├── hooks/              # Custom React hooks (e.g., useToast)
│   └── lib/                # Utility functions and library initializations
│       ├── firebase.js     # Firebase SDK initialization
│       └── utils.ts        # General utility functions
├── public/                 # Static assets
└── ... (config files)
```

## 4. Core Features & Implementation

### 4.1. Authentication & Session Management

- **Provider:** Firebase Authentication is the sole authentication provider.
- **Login:** The login flow is handled by the `src/app/page.tsx` route, which uses the `LoginForm` component. It uses Firebase's `signInWithEmailAndPassword` method for email/password authentication.
- **Session Management:** The application uses a Higher-Order Component (HOC), `withAuth` (`src/components/withAuth.tsx`), to protect all routes under `/dashboard`. This HOC wraps the main `DashboardLayout` and uses Firebase's `onAuthStateChanged` listener to ensure that only authenticated users can access protected content. Unauthenticated users are automatically redirected to the login page.

### 4.2. Database & Data Management

- **Database:** Firestore is the primary database for all application data.
- **Data Fetching:** Most pages and components that require data from Firestore implement their own data-fetching logic directly within the component using the Firebase SDK (`getDocs`, `getDoc`, etc.).
- **Data Writing:** Components with forms (e.g., `PatientFormModal`, `CreateInvoiceModal`) handle data creation and updates by directly calling Firestore functions (`addDoc`, `updateDoc`).
- **File Storage:** Firebase Storage is used for file uploads, such as patient documents.

### 4.3. Dashboard & UI

- **Main Dashboard (`/dashboard`):** This page provides a high-level overview of key metrics, such as total patients, upcoming sessions, and pending orders. It fetches this data directly from Firestore.
- **Navigation:** The `DashboardNav` component (`src/components/dashboard-nav.tsx`) provides a consistent sidebar navigation experience across all dashboard sections.
- **UI Components:** The application uses a rich, consistent set of UI components from `src/components/ui`, including `Card`, `Button`, `Table`, `Input`, and `Badge`. This ensures a cohesive and professional look and feel.

### 4.4. Key Sections

The dashboard is organized into the following sections, each with its own set of features:

- **Patients:** List, view, add, and edit patient information.
- **Sessions:** Schedule and manage patient sessions.
- **Orders:** Create and track patient orders.
- **Invoices:** Manage billing and invoices.
- **Tasks:** A simple task management system.
- **Messages:** A basic messaging system for internal communication.
- **Calendar:** A calendar view for appointments and sessions.
- **Settings:** Allows users to manage their account and security settings.

## 5. Current State Summary

The Zappy Health Dashboard is a well-structured and functional application with a solid foundation. The migration to Firebase is complete, and all core features are integrated with Firebase services.

The application is in a stable state and ready for further development and feature enhancements.
