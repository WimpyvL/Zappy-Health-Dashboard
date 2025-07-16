
import { User, HeartPulse, Shield, CreditCard } from "lucide-react";
import type { FormElement } from "@/lib/form-validator";

interface TemplateBlock {
    title: string;
    elements: FormElement[];
}

export const templateBlocks: Record<string, TemplateBlock> = {
    personalInfo: {
        title: "Personal Information",
        elements: [
            { id: "firstName", type: "text", label: "First Name", required: true, placeholder: "Enter first name" },
            { id: "lastName", type: "text", label: "Last Name", required: true, placeholder: "Enter last name" },
            { id: "email", type: "email", label: "Email Address", required: true, placeholder: "you@example.com" },
            { id: "phone", type: "tel", label: "Phone Number", required: true, placeholder: "(555) 123-4567" },
            { id: "dob", type: "date", label: "Date of Birth", required: true },
        ],
    },
    medicalHistory: {
        title: "Medical History",
        elements: [
            { id: "conditions", type: "textarea", label: "Pre-existing medical conditions", placeholder: "List any relevant medical conditions" },
            { id: "medications", type: "textarea", label: "Current medications", placeholder: "List all current medications and dosages" },
            { id: "allergies", type: "textarea", label: "Allergies", placeholder: "List any known allergies" },
        ]
    },
    insuranceInfo: {
        title: "Insurance Information",
        elements: [
            { id: "provider", type: "text", label: "Insurance Provider", placeholder: "e.g., Blue Cross" },
            { id: "policyNumber", type: "text", label: "Policy Number", placeholder: "Enter policy number" },
            { id: "groupNumber", type: "text", label: "Group Number", placeholder: "Enter group number" },
        ]
    },
    paymentInfo: {
        title: "Payment Information",
        elements: [
            { id: "cardName", type: "text", label: "Name on Card", required: true },
            { id: "cardNumber", type: "text", label: "Card Number", required: true },
            { id: "cardExpiry", type: "text", label: "Expiration Date (MM/YY)", required: true },
            { id: "cardCVC", type: "text", label: "CVC", required: true },
        ]
    }
};

export const templateSections = [
    {
        icon: User,
        title: "Personal Information",
        description: "Basic contact and personal details.",
        fields: ["First Name", "Last Name", "Email", "Phone", "Date of Birth"],
        action: "Add Personal Information Block",
        blockName: "personalInfo" as keyof typeof templateBlocks,
    },
    {
        icon: HeartPulse,
        title: "Medical History",
        description: "Patient medical background information.",
        fields: ["Medical Conditions", "Current Medications", "Allergies"],
        action: "Add Medical History Block",
        blockName: "medicalHistory" as keyof typeof templateBlocks,
    },
    {
        icon: Shield,
        title: "Insurance Information",
        description: "Health insurance details.",
        fields: ["Provider", "Policy Number", "Group Number"],
        action: "Add Insurance Information Block",
        blockName: "insuranceInfo" as keyof typeof templateBlocks,
    },
    {
        icon: CreditCard,
        title: "Payment Information",
        description: "Subscription and payment details.",
        fields: ["Name on Card", "Card Number", "Expiration", "CVC"],
        action: "Add Payment Information Block",
        blockName: "paymentInfo" as keyof typeof templateBlocks,
    }
];
