# Automation Feature TODO List

This document outlines the high-level tasks required to build the automation workflow feature, focusing on pulling in and sorting information within the system.

## Phase 1: Core Structure & UI

1.  **UI/UX Design:**
    *   [ ] Design the visual workflow builder interface (nodes, connections, panels).
    *   [ ] Define standard node types (Trigger, Action, Logic/Filter).
    *   [ ] Design UI for listing, creating, editing, and deleting workflows.
    *   [ ] Design UI for viewing workflow execution history/logs.

2.  **Frontend Implementation (Visual Builder):**
    *   [x] Integrate a graph library (React Flow) into `AutomationsPage.jsx`.
    *   [x] Develop basic reusable React components for node types (`TriggerNode`, `ActionNode`).
    *   [x] Register custom node types with React Flow.
    *   [x] Implement drag-and-drop functionality for adding nodes from sidebar.
    *   [x] Implement a sidebar (`AutomationSidebar`) for adding nodes.
    *   [x] Implement a panel (`NodeConfigPanel`) for viewing selected node info (placeholder for config).
    *   [x] Implement node selection logic.
    *   [x] Basic state management for nodes/edges (`useNodesState`, `useEdgesState`).

3.  **Backend - Workflow Storage:**
    *   Design database schema to store workflow definitions (nodes, connections, configurations).
    *   Create API endpoints (`/api/v1/admin/automations`) for CRUD operations on workflows.

4.  **Frontend - Workflow Management:**
    *   Implement API calls to fetch, save, update, and delete workflows using the endpoints from step 3.
    *   Build the UI components for listing/managing workflows.

## Phase 2: Triggers (Data Input)

1.  **Identify Triggers:**
    *   Define potential events within the system that can trigger workflows (e.g., New Patient Created, Order Status Updated, Form Submitted, Session Completed, Tag Added/Removed).
    *   Consider external triggers if needed (e.g., Webhook).

2.  **Backend - Trigger Handling:**
    *   Implement mechanisms in the backend to detect trigger events.
    *   When a trigger event occurs, identify matching active workflows based on their trigger node configuration.
    *   Initiate workflow execution for matched workflows, passing relevant trigger data.

3.  **Frontend - Trigger Node Configuration:**
    *   Allow users to select and configure the specific trigger event in the workflow builder UI (e.g., choose "Order Status Updated" and specify the target status).

## Phase 3: Actions (Data Sorting/Manipulation)

1.  **Identify Core Actions:**
    *   Define initial actions focused on sorting and organizing data:
        *   Add/Remove Tag (Patient, Order, Session, etc.)
        *   Update Patient Field (e.g., Status, Custom Field)
        *   Create Task (Assign to user/team)
        *   Send Internal Notification/Message
        *   Update Order Status
        *   Add Note to Patient/Session/Order
    *   Consider logic nodes (e.g., If/Else, Filter by data attribute).

2.  **Backend - Action Execution:**
    *   Implement the logic for each defined action within the workflow execution engine.
    *   Ensure actions have access to data from the trigger and previous steps.
    *   Handle potential errors during action execution.

3.  **Frontend - Action Node Configuration:**
    *   Allow users to select and configure actions in the workflow builder (e.g., choose "Add Tag" and select the tag).

## Phase 4: Execution & Logging

1.  **Backend - Workflow Execution Engine:**
    *   Develop the core engine that takes a triggered workflow definition and executes its steps sequentially.
    *   Manage the flow of data between nodes.
    *   Handle branching/conditional logic.

2.  **Backend - Logging:**
    *   Design database schema for logging workflow executions (start time, end time, status, trigger data, errors, output of each step).
    *   Implement logging within the execution engine.
    *   Create API endpoints to fetch execution history/logs.

3.  **Frontend - Execution History:**
    *   Implement UI to display workflow execution history and logs, allowing users to troubleshoot issues.

## Future Considerations

*   More complex logic nodes (Loops, Switches).
*   Integration with external services (Email, SMS, other APIs).
*   User permissions for creating/managing automations.
*   Workflow versioning.
*   Testing and validation framework.
