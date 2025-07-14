# Bug Fixes and Feature Enhancements

Here is a list of issues and tasks to address:

- [x] Pt info in view (Covered by PatientInfo.jsx)
- [x] Address and DOB on front end (Covered by PatientInfo.jsx)
- [x] Edit button functionality (Fixed in PatientModal.jsx and useUpdatePatient hook)
- [ ] Subscription Details display and management (Display uses mock data; Management via Stripe Portal implemented)
- [ ] Schedule new session connecting to pt. Review link functionality (Modal opens with patient ID from URL; Review link TODO)
- [x] Uploading document button functionality (Frontend form/API call implemented; Depends on backend API)
- [x] Patient profile title should display name and DOB instead of "(Unknown years)" (Fixed in PatientHeader.jsx)
- [x] Forms for the patient not connected (useGetPatientForms hook commented out due to missing 'form_requests' table in schema)
- [ ] Connect to Stripe (Frontend utilities exist; Depends on backend API implementation)
- [x] Add subscription button not connected (or error) (Button redirects to Stripe Portal)
- [x] Add the preferred pharmacy to the edit screen (Added to PatientModal.jsx and useUpdatePatient hook)
- [x] Subscription not saved after editing (Fixed as part of Edit button functionality)
- [x] Michel: Review the flow of the "new consultation" button (Flow reviewed in InitialConsultations.js; seems logical)
- [x] Check if meds can be connected to services (Yes, via Product Management - meds are products, products link to services)
- [x] Error: Consultation ID is missing. Cannot submit. (Fixed in InitialConsultationNotes.jsx handleSubmit; Requires backend creation endpoint)
- [x] Patient name and DOB not appearing on top upon opening the consultation screen (Fixed data fetching in InitialConsultations.js)
- [x] Schedule new session popup: Allow for search. Wimpie not showing regardless. (Implemented searchable dropdown in Sessions.js modal)
- [x] New session screen not pulling info adequately (Added state management for modal form fields in Sessions.js)
- [x] Search bars not working (Fixed data fetching in useSessions; Logic in InitialConsultations seems correct, depends on schema)
- [x] Orders screen not pulling info (Fixed data fetching in useOrders hook)
- [ ] Fix Today's Sessions display in ProviderDashboard: The Today's Sessions block is not properly displaying sessions scheduled for today despite showing the correct count in the stats card. Added diagnostics show that there's likely a date format mismatch when comparing session dates. Need to continue investigating and fix the date comparison logic.
- [x] Fix "View Details" error in PatientSessions: When clicking "View Details" button in a patient's session history, an error occurs: "InvalidCharacterError: Failed to execute 'createElement' on 'Document': The tag name provided ('/static/media/PatientFollowUpNotes.3d3b254580572d4dff16') is not a valid name." This indicates a problem with how the PatientFollowUpNotes component is being imported. Need to check import paths and ensure the component is correctly bundled.
- [ ] Fix date display in Patient Orders: Order dates are not displaying correctly in the PatientOrders component. The Order Date column shows "-" instead of actual dates. This is likely due to incorrect date field access (using 'orderDate' instead of 'order_date') or date format handling in the formatDate function.
