# System Map Feature TODO List

This document outlines the high-level tasks required to build the System Map feature, intended for visualizing the application's architecture, data flows, and user interactions.

## Phase 1: Core Structure & UI

1.  **UI/UX Design:**
    *   [ ] Design the visual mapping interface (nodes, connections, panels).
    *   [ ] Define standard node types (e.g., Page/View, Component, API Endpoint, Data Model, User Action, Event, External System).
    *   [ ] Design UI for creating, saving, loading, and managing different maps/diagrams.
    *   [ ] Consider layout options (auto-layout vs. manual).

2.  **Frontend Implementation (Visual Mapper):**
    *   [x] Integrate a graph library (React Flow) into the main page component.
    *   [ ] Develop reusable React components for different system element node types (Page, Component, API, etc.). *(Partially done with Trigger/Action nodes)*
    *   [x] Register custom node types with React Flow. *(Basic registration done)*
    *   [x] Implement drag-and-drop functionality for adding nodes from a sidebar.
    *   [x] Implement a sidebar for adding map elements.
    *   [x] Implement a panel for viewing/editing selected node details (e.g., description, links). *(Basic panel exists)*
    *   [x] Implement node selection logic.
    *   [x] Basic state management for nodes/edges (`useNodesState`, `useEdgesState`).
    *   [ ] Implement functionality to save/load map layouts (nodes and edges positions/data). *(Placeholder exists)*
    *   [ ] Implement functionality to create/manage multiple maps. *(Placeholder exists)*

3.  **Node Configuration/Documentation:**
    *   [ ] Enhance the configuration panel (`NodeConfigPanel`) to allow adding descriptions, links (e.g., to code files, API docs), and other relevant metadata to nodes. *(Basic panel exists)*
    *   [ ] Update node components to display relevant configured information (e.g., show description on hover). *(Basic display exists)*

4.  **Refinement & Usability:**
    *   [ ] Refine custom node appearance for clarity (icons, colors based on type).
    *   [ ] Improve edge/connection styling and labeling.
    *   [ ] Add zooming/panning controls. *(Done via React Flow Controls)*
    *   [ ] Add minimap. *(Done via React Flow MiniMap)*
    *   [ ] Consider implementing auto-layout algorithms (optional).

## Future Considerations

*   Ability to group nodes.
*   Different map views (e.g., data flow, user flow, component hierarchy).
*   Integration with code analysis tools (optional).
*   Collaboration features (optional).
