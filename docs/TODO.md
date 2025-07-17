# Project TODO List

This list tracks the next steps for implementing and integrating features in the Zappy Health dashboard.

- [x] **Integrate Shop Page with Telehealth Flow Orchestrator:**
  - Update `ShopPage.jsx` to use the `useTelehealthFlow` hook.
  - Initialize a new flow when a user selects a product or category.
  - Navigate to the intake form with the correct flow context.

- [ ] **Integrate Intake Forms with Telehealth Flow:**
  - Connect form submissions to the `telehealthFlowOrchestrator` service.
  - Update form state based on the active flow.

- [ ] **Enhance Consultation Workflow:**
  - Connect the consultation notes and approval process to the telehealth flow status.

- [ ] **Build out patient-facing UI and logic**: Implement the full patient experience, including the patient dashboard, service management, and shopping features, as a separate application.

