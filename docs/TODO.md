# Project TODO List

This list tracks the next steps for implementing and integrating features in the Zappy Health dashboard.

## High Priority

- [ ] **Integrate Shop Page with Telehealth Flow Orchestrator:**
  - Update `ShopPage.jsx` to use the `useTelehealthFlow` hook.
  - Initialize a new flow when a user selects a product or category.
  - Navigate to the intake form with the correct flow context.

- [ ] **Integrate Intake Forms with Telehealth Flow:**
  - Connect form submissions to the `telehealthFlowOrchestrator` service.
  - Update form state based on the active flow.

- [ ] **Enhance Consultation Workflow:**
  - Connect the consultation notes and approval process to the telehealth flow status.

- [ ] **Patient App Integration (Future Project):**
  - Design and build the separate patient-facing application.
  - Create secure API endpoints for the patient app to consume data from this admin/provider system.
  - The patient app will handle features like:
    - Patient-specific dashboard (`/my-services`).
    - Browsing and purchasing services (`/shop`).
    - Viewing health programs and progress.
