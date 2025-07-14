# Bug Tracking List

*Status Key: [ ]=Pending, [x]=Addressed/Fixed, [/]=Partially Addressed/Needs Verification, [-]=Blocked/Needs Info*

## April 12, 2025

### General UI/UX & Data Display
- [ ] Search bars not working *(Needs specific locations)*
- [ ] Tags not showing in add new patient popup screen *(Check `PatientModal.jsx` & `useTags`)*
- [ ] Pharmacies not showing in add new patient popup screen *(Check `PatientModal.jsx` & `usePharmacies`)*
- [ ] Edit screen not showing the address *(Needs specific screen, likely `PatientModal.jsx` edit mode)*
- [/] In the patient screen, name and DOB should appear on top left. It now says “unknown DOB” *(Partially addressed in `PatientHeader.jsx`, needs data verification)*
- [-] Subscription details : “Could not open subscription/payment settings. Please try again.” *(Needs specific location/button)*
- [ ] Medical notes are loading in a loop without showing the notes *(Check `PatientDetail.jsx` notes section)*
- [/] (Unknown years) in patient profile title should be name and DOB *(Linked to DOB display in `PatientHeader.jsx`, needs data verification)*
- [x] Upon opening the consultation screen , name and DOB of pt do not appear on top *(Fixed in `InitialConsultationNotes.jsx` header)*
- [ ] Orders screen not pulling info *(Check `useOrders` hook implementation)*
- [-] Pt info in view *(Needs clarification - which view?)*
- [-] Address and DOB on front end *(Needs clarification - which specific page/component?)*

### Patient Profile Actions
- [ ] Schedule new session is connected to the patient screen somehow. It should allow the ability to schedule a session independently. *(Check `PatientDetail.jsx`)*
- [ ] Same for “create order” when in the patient profile *(Check `PatientDetail.jsx`)*
- [ ] Same for “ send form “ when in the patient profile *(Check `PatientDetail.jsx`)*
- [ ] “Upload document” button not working in the patient profile *(Check `PatientDetail.jsx`)*

### Products & Discounts
- [x] Cannot add a new product in the “products” page *(Button visible, `is_active` schema fixed in hooks)*
- [ ] Discounts: “Error creating discount: Could not find the 'amount' column of 'discounts' in the schema cache” *(Schema mismatch likely, check `useCreateDiscount` & `discounts` table)*

### Consultations & Sessions
- [x] Consultation does not save or display the consultation *(Fixed `handleSubmit` in `InitialConsultationNotes.jsx`)*
- [/] Schedule new session: popup : allow for search . wimpie not showing regardless *(Dynamic search added to *consultation* patient select (`PatientSelectionModal.jsx`), need to check/update *session* scheduling modal (`Sessions.js`?))*
- [ ] The new session screen not pulling info adequately *(Check `Sessions.js` modal)*
- [-] Error: Consultation ID is missing. Cannot submit. *(Need context - where does this happen?)*
- [x] Michel :review the flow of “new consultation “ button *(Refactored flow in `InitialConsultations.js` seems logical)*

### Subscriptions & Billing
- [-] Subscription Details *(Needs clarification - what about them?)*
- [-] Forms for the patient not connected *(Needs clarification - which forms, connected where?)*
- [-] Connect to stripe *(Needs specific requirements)*
- [-] Add subscription button not connected (or error) *(Need location of button)*
- [ ] Add the preferred pharmacy to the edit screen *(Check `PatientModal.jsx` edit mode)*
- [-] Did not save the subscription after editing *(Need context - where is subscription edited?)*

### Other / Unclear
- [-] Edit button *(Needs clarification - which edit button?)*
- [-] Schedule new session connecting to pt. Review link *(Needs clarification)*
- [-] Uploading document button *(Needs clarification - which button?)*
- [x] Check if can connect meds to services *(Association possible via `ProductManagement.jsx` modal)*
- [-] Screens that are not switching from admin to patients *(Needs clarification)*
- [-] Need to ask VS code to review everything to ensure total separation *(AI cannot perform this)*
- [-] Revert styling of admin view *(Needs specific styling changes)*

*(Note: Items marked [x] are believed to be addressed but may require user verification. Items marked [/] are partially addressed. Items marked [-] require more information.)*
