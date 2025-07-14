%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#F8F9FA', 'primaryTextColor': '#212529', 'lineColor': '#6C757D', 'textColor': '#343A40', 'fontSize': '14px'}}}%%
graph TD
subgraph User Interface (React Components)
UI_Pages["Pages (`src/pages/*`)"] -- Uses --> UI_Layouts["Layouts (`src/layouts/*`)"];
UI_Pages -- Uses --> UI_Components["Reusable Components"];
UI_Layouts -- Contains --> UI_Sidebar["Sidebar (`Sidebar.js`)"];
UI_Layouts -- Contains --> UI_Header["Header (`Headers.js`)"];
UI_Pages -- Uses --> RQ_Hooks["React Query Hooks (`src/apis/*/hooks.js`)"];
UI_Pages -- Uses --> Context_Hooks["Context Hooks (`useAuth`, `useCart`, etc.)"];a
end

    subgraph State Management
        RQ_Hooks -- Uses --> RQ_Core["TanStack Query (Core)"];
        Context_Hooks -- Access --> Context_Providers["Context Providers (`src/context/*`)"];
        Context_Providers -- Manages --> GlobalState["Global State (Auth, Cart, App)"];
        RQ_Core -- Manages --> ServerStateCache["Server State Cache"];
    end

    subgraph Routing
        Router["BrowserRouter (`App.js`)"] --> Routes["AppRoutes (`constants/AppRoutes.jsx`)"];
        Routes -- Defines --> Route["Route (`<Route path='/...' element={<Page />} />`)"];
        Route -- Renders --> UI_Pages;
        Route -- Wraps with --> UI_Layouts;
        Routes -- Uses --> Paths["Path Constants (`constants/paths.js`)"];
        %% Route -- Should use --> AuthGuard["ProtectedRoute (Currently Disabled!)"]; %%
    end

    subgraph Data Layer & API
        RQ_Hooks -- Calls --> API_Funcs["API Functions (`src/apis/*/api.js`)"];
        API_Funcs -- Calls --> API_Request["Request Util (`utils2/api.js`?)"];
        API_Request -- Uses --> AxiosClient["Axios Instance (`apiClient`)"];
        AxiosClient -- Has --> Interceptors["Interceptors (Auth, Refresh, Error)"];
        Interceptors -- Uses --> LocalStorage["localStorage (Tokens - Insecure!)"];
        Interceptors -- Calls --> API_Refresh["Backend API (/auth/refresh-token)"];
        AxiosClient -- Calls --> BackendAPI["Backend API (e.g., /api/v1/admin/*)"];
        Context_Providers -- Calls --> API_Service_Methods["API Service Methods (`apiService.js`)"];
        API_Service_Methods -- Uses --> AxiosClient;
    end

    subgraph Utilities
        Utils["`src/utils/*`"]
        Utils -- Contains --> ErrorHandling["Error Handling (`errorHandling.js`)"];
        Utils -- Contains --> APIService["API Service (`apiService.js` - Duplicates?)"];
        Utils -- Contains --> Stripe["Stripe Checkout (`stripeCheckout.js`)"];
    end

    %% Relationships %%
    UI_Pages --> StateManagement;
    UI_Pages --> Routing;
    StateManagement --> DataLayerAPI;
    Routing --> UI_Pages;
    DataLayerAPI --> BackendAPI;
    DataLayerAPI --> Utilities;

    style AuthGuard fill:#f9f,stroke:#333,stroke-width:2px;
    style LocalStorage fill:#f9f,stroke:#333,stroke-width:2px;

```

This Mermaid code provides a visual representation of the application's architecture, including:
*   UI Components (Pages, Layouts)
*   State Management (React Query, Context)
*   Routing
*   Data Layer (Hooks, API functions, Axios, Interceptors)
*   Key Utilities
*   Highlights insecure localStorage usage and disabled Auth Guard.
```
