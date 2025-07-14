# Telehealth Dashboard Codebase Overview

This document provides a simplified explanation of the Telehealth Dashboard frontend codebase.

## 1. What is it?

This is a web application (specifically, a Single Page Application or SPA) built using **React**. It serves as an administrative dashboard for managing telehealth operations, including patients, orders, tasks, settings, and more.

## 2. Core Technologies

- **React:** The main library for building the user interface.
- **Ant Design (Antd):** A pre-built component library used for UI elements like buttons, forms, tables, etc.
- **Tailwind CSS:** Used for styling and layout, providing utility classes.
- **React Router:** Handles navigation between different pages within the app (e.g., going from Dashboard to Patients).
- **TanStack Query (React Query):** Manages fetching data from the backend API, caching it, and handling updates (like saving changes).
- **Axios:** The tool used to make the actual API calls to the backend server.
- **React Context:** Used for managing some global application states, like user login status (`AuthContext`) and shopping cart items (`CartContext`).

## 3. Project Structure (Key Folders in `src/`)

- **`pages/`:** Contains the main components for each page or major feature (e.g., `Patients.jsx`, `Orders.js`). This is where most of the UI logic for specific views resides.
- **`apis/`:** Holds the code related to fetching and updating data for specific features.
  - `api.js` (inside each feature folder): Functions that define _how_ to call the backend API for that feature.
  - `hooks.js` (inside each feature folder): Custom React Query hooks (like `usePatients`, `useCreateTask`) that components use to easily get or modify data.
- **`layouts/`:** Defines the overall structure of the pages, like the main layout with the sidebar and header (`MainLayout.jsx`).
- **`components/`:** (Often found inside `layouts/` or `pages/`) Contains smaller, reusable UI pieces.
- **`context/`:** Manages global application state (e.g., `AuthContext.jsx` knows if the user is logged in).
- **`constants/`:** Stores fixed values used across the app, like navigation paths (`paths.js`) and route definitions (`AppRoutes.jsx`).
- **`utils/`:** Contains helper functions and configurations, like the main API setup (`apiService.js`) and error handling logic (`errorHandling.js`).

## 4. How Data Flows (Simplified)

1.  **UI Needs Data:** A page component (e.g., `Patients.jsx`) needs to display a list of patients.
2.  **Hook Called:** It uses a custom hook (e.g., `usePatients()` from `src/apis/patients/hooks.js`).
3.  **React Query Fetches:** The hook tells React Query to fetch the data using a function defined in `src/apis/patients/api.js`.
4.  **API Call:** That function uses Axios (configured in `utils/apiService.js` or `utils2/api.js`) to send a request to the backend API (e.g., GET `/api/v1/admin/patients`).
5.  **Backend Responds:** The backend sends back the patient data.
6.  **Axios Receives:** Axios gets the response. Interceptors might handle errors or token refreshes.
7.  **React Query Caches:** React Query receives the data, stores (caches) it, and provides it to the hook.
8.  **UI Updates:** The hook returns the data to the `Patients.jsx` component, which then displays it.

_Updates (Saving/Deleting) follow a similar flow but use mutation hooks (`useCreatePatient`, `useDeletePatient`) which trigger POST/PUT/DELETE API calls and then often tell React Query to refetch related data._

## 5. Authentication (Login/Logout)

- Managed by `AuthContext.jsx`.
- When you log in, details (like a token) are stored (currently insecurely in `localStorage`).
- API calls automatically include this token to prove you're logged in.
- If the token expires, the system tries to refresh it using a `refreshToken` (also stored insecurely).
- If refresh fails or you log out, stored details are cleared, and you're redirected to the login page.
- **IMPORTANT:** The current way authentication status is checked and routes are protected has significant security flaws and needs fixing.

## 6. Key Areas for New Developers

- Understand the component structure in `pages/` and `layouts/`.
- Learn how data is fetched/updated using the React Query hooks in `apis/`.
- Familiarize yourself with `AuthContext` for login/user state.
- Know where routes are defined (`constants/AppRoutes.jsx`).

## 7. Major Concerns

- **Security:** Authentication and route protection need immediate fixes.
- **Code Duplication:** The API client setup (`apiService.js` vs `utils2/api.js`) needs consolidation.
