# Telehealth Application State Management Architecture

This document outlines the state management strategy for the rewritten React-based telehealth application. It defines how different types of application state are managed, ensuring performance, predictability, and maintainability.

## 1. Core Principles

*   **Clear Separation of Concerns**: Distinguish between server state, client UI state, and global application state.
*   **Performance**: Minimize unnecessary re-renders and optimize data fetching.
*   **Predictability**: State changes should be easy to understand and debug.
*   **Maintainability**: Promote reusable patterns and reduce boilerplate.
*   **Scalability**: Architecture should support growth in features and complexity.

## 2. State Classification

We classify application state into the following categories:

*   **Server State**: Data fetched from the backend (e.g., patient lists, consultation details, product catalogs). This data is often asynchronous, cached, and can become "stale."
*   **Global Client UI State**: Application-wide UI state that affects many parts of the application (e.g., authentication status, current user, view mode, global loading indicators, notifications).
*   **Feature-Specific Client UI State**: UI state relevant to a particular feature or module, often shared by a few related components within that feature (e.g., form input values, modal visibility, tab selection within a complex component).
*   **Local Component State**: State managed within a single component, typically using `useState` or `useReducer`, that does not need to be shared with other components.

## 3. State Management Tools and Patterns

### 3.1. Server State: React Query

*   **Purpose**: Manages all asynchronous data fetching, caching, synchronization, and updates from the backend.
*   **Implementation**:
    *   **`QueryClientProvider`**: Wraps the entire application (or relevant parts) to provide the `QueryClient` instance.
    *   **`useQuery` Hook**: Used for fetching data. Automatically handles loading, error, and success states.
    *   **`useMutation` Hook**: Used for sending data to the server (POST, PUT, DELETE). Provides optimistic updates, retries, and error handling.
    *   **Query Keys**: Structured query keys (`createHealthcareQueryKeys` in `src/lib/queryClient.js`) ensure proper caching and invalidation.
    *   **Stale-While-Revalidate**: Data is served from cache immediately while a fresh fetch happens in the background.
    *   **Error Handling**: Centralized error handling via `QueryClient`'s `onError` callbacks (`handleQueryError`, `handleMutationError` in `src/lib/queryClient.js`) to display toasts and log errors.
*   **Benefits**:
    *   Eliminates manual data fetching boilerplate.
    *   Automatic caching, background refetching, and stale data management.
    *   Optimistic updates for a snappier UI.
    *   Centralized error handling and retry logic.
    *   Improved performance and user experience.
*   **Example Usage**:
    ```javascript
    // src/hooks/usePatients.js
    import { useQuery } from '@tanstack/react-query';
    import { db } from '../services/database';
    import { createHealthcareQueryKeys } from '../lib/queryClient';

    export const usePatients = (options) => {
      return useQuery({
        queryKey: createHealthcareQueryKeys.patients(options),
        queryFn: () => db.patients.getAll(options),
        // ... other React Query options (staleTime, cacheTime, etc.)
      });
    };

    // src/pages/PatientsPage.jsx
    import { usePatients } from '../hooks/usePatients';

    function PatientsPage() {
      const { data, isLoading, isError, error } = usePatients({ page: 1, pageSize: 10 });

      if (isLoading) return <p>Loading patients...</p>;
      if (isError) return <p>Error: {error.message}</p>;

      return (
        // Render patient list
      );
    }
    ```

### 3.2. Global Client UI State: React Context API

*   **Purpose**: Manages application-wide UI state that needs to be accessible by many components across the component tree.
*   **Implementation**:
    *   **`createContext`**: Defines the context.
    *   **`Provider` Component**: Wraps the part of the component tree where the state needs to be accessible.
    *   **`useContext` Hook**: Consumes the context value in child components.
    *   **Memoization (`useMemo`, `useCallback`)**: Crucial for optimizing context providers to prevent unnecessary re-renders of consumers.
*   **Existing Contexts**:
    *   **`AuthContext` (`src/contexts/auth/AuthContext.jsx`)**: Manages user authentication status (`currentUser`, `isAuthenticated`, `authLoading`, `userRole`), login/logout functions.
    *   **`AppContext` (`src/contexts/app/AppContext.jsx`)**: Manages application-wide settings like `viewMode` ('admin' or 'patient').
    *   **`CartContext` (`src/contexts/cart/CartContext.jsx`)**: Manages the shopping cart state.
    *   **`NotificationsContext` (`src/contexts/NotificationsContext.jsx`)**: Manages global application notifications (e.g., toast messages).
    *   **`RouteTrackerContext` (`src/contexts/route/RouteTrackerContext.jsx`)**: Tracks navigation history.
    *   **`RealTimeMessagingContext` (`src/contexts/messaging/RealTimeMessagingContext.jsx`)**: Manages real-time messaging connections and state.
*   **Benefits**:
    *   Avoids prop drilling for widely used state.
    *   Centralizes global concerns.
*   **Considerations**: Overuse can lead to performance issues if not properly optimized with memoization.

### 3.3. Feature-Specific Client UI State: Zustand

*   **Purpose**: Manages local or feature-specific UI state that needs to be shared across a few related components without the overhead of a full global context or prop drilling. Ideal for complex forms, modals, or interactive components.
*   **Implementation**:
    *   **`create` function**: Defines a Zustand store.
    *   **`useStore` Hook**: Components subscribe to parts of the store.
*   **Benefits**:
    *   Lightweight and performant.
    *   Simple API, less boilerplate than Redux.
    *   Direct state updates without dispatching actions.
    *   Can be used for both global and local state, offering flexibility.
*   **Example Usage**:
    ```javascript
    // src/stores/patientFormStore.js (example)
    import { create } from 'zustand';

    export const usePatientFormStore = create((set) => ({
      formData: {},
      setFormData: (newValues) => set((state) => ({ formData: { ...state.formData, ...newValues } })),
      resetForm: () => set({ formData: {} }),
      isModalOpen: false,
      openModal: () => set({ isModalOpen: true }),
      closeModal: () => set({ isModalOpen: false }),
    }));

    // src/components/patient/PatientEditModal.jsx
    import { usePatientFormStore } from '../../stores/patientFormStore';

    function PatientEditModal() {
      const { formData, setFormData, isModalOpen, closeModal } = usePatientFormStore();

      // ... form logic
      return (
        <Modal isOpen={isModalOpen} onClose={closeModal}>
          {/* Form fields */}
        </Modal>
      );
    }
    ```

### 3.4. Local Component State: `useState` and `useReducer`

*   **Purpose**: Manages state that is entirely local to a single component and does not need to be shared with other components.
*   **Implementation**:
    *   **`useState`**: For simple state variables (e.g., toggle, counter, input value).
    *   **`useReducer`**: For more complex state logic within a single component, especially when state transitions depend on previous state or involve multiple related values.
*   **Benefits**:
    *   Simple and direct.
    *   Encapsulates component-specific logic.

## 4. Data Flow and Interaction

*   **UI Components**: Render data received via props or consume local state.
*   **Feature Components**: Orchestrate data from React Query hooks, global contexts, and Zustand stores. They often contain the logic for user interactions that trigger state updates.
*   **React Query Hooks**: Abstract data fetching and mutation logic, providing `data`, `isLoading`, `isError`, `mutate` functions to components.
*   **Context Providers**: Provide global state and functions to their consumers.
*   **Zustand Stores**: Provide slices of state and actions to components that subscribe to them.
*   **API Services (`src/apis/`) / Database Service (`src/services/database/`)**: The lowest layer of data interaction, responsible for communicating with the backend (Supabase or custom API). Components should generally not directly call these services; instead, they should use React Query hooks or actions defined in Zustand stores/contexts that wrap these services.

## 5. State Management for Forms

*   **React Hook Form**: Manages form input state, validation, and submission.
*   **React Query**: Used for submitting form data (mutations) and pre-populating forms with existing data (queries).
*   **Zustand/Context**: Can be used for multi-step forms or forms where data needs to persist across different views before final submission.

## 6. Conclusion

By strategically combining React Query for server state, React Context for global UI state, Zustand for feature-specific UI state, and `useState`/`useReducer` for local component state, the telehealth application will achieve a robust, performant, and maintainable state management architecture. This approach ensures that each piece of state is managed by the most appropriate tool, leading to a more predictable and scalable application.