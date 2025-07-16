export const exampleFormJson = {
  title: "Comprehensive Patient Intake Form",
  description: "Please fill out this form to the best of your ability before your first consultation.",
  pages: [
    {
      id: "personal_info",
      title: "Personal Information",
      elements: [
        {
          id: "full_name",
          type: "text",
          label: "Full Name",
          required: true,
          placeholder: "Enter your full name",
        },
        {
          id: "email",
          type: "email",
          label: "Email Address",
          required: true,
          placeholder: "you@example.com",
        },
        {
            id: "dob",
            type: "date",
            label: "Date of Birth",
            required: true,
        }
      ],
    },
    {
      id: "medical_history",
      title: "Medical History",
      elements: [
        {
          id: "conditions",
          type: "checkbox",
          label: "Do you have any of the following conditions?",
          options: [
            { id: "cond_htn", value: "hypertension", label: "Hypertension" },
            { id: "cond_diab", value: "diabetes", label: "Diabetes" },
            { id: "cond_asth", value: "asthma", label: "Asthma" },
          ],
        },
        {
          id: "allergies",
          type: "textarea",
          label: "Please list any known allergies.",
          placeholder: "e.g., Penicillin, Peanuts",
        },
      ],
    },
    {
      id: "consent",
      title: "Consent",
      elements: [
        {
          id: "consent_ack",
          type: "radio",
          label: "Do you consent to treatment?",
          required: true,
          options: [
            { id: "consent_yes", value: "yes", label: "Yes, I consent" },
            { id: "consent_no", value: "no", label: "No, I do not consent" },
          ],
        },
      ],
    },
  ],
  conditionals: [],
};
