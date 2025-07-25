
"use client";

import * as React from "react";
import { User, Mail, Phone, FileText, MessageSquare, FlaskConical, HeartPulse, CreditCard, Briefcase, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { PatientInfoTab } from "./[id]/components/patient-info-tab";
import { PatientOrdersTab } from "./[id]/components/patient-orders-tab";
import { PatientBillingTab } from "./[id]/components/patient-billing-tab";
import { PatientNotesTab } from "./[id]/components/patient-notes-tab";
import { PatientOverviewTab } from "./[id]/components/patient-overview-tab";
import { ViewMessageModal } from "../messages/components/view-message-modal";
import Loading from "./[id]/loading";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from '@tanstack/react-query';
import { databaseService } from '@/services/database/index';

// Types
type Patient = {
    id: string;
    firstName?: string;
    lastName?: string;
    name: string;
    initials: string;
    age: string;
    email: string;
    phone: string;
    status: "Active" | "Inactive" | "Pending";
    registrationDate: string;
    lastLogin: string;
};

const fetchPatientData = async (patientId: string) => {
    if (!patientId) return null;
    const response = await databaseService.patients.getById(patientId);
    if (response.error || !response.data) throw new Error(response.error?.message || 'Patient not found');

    const data = response.data;
    const dob = data.dateOfBirth ? new Date(data.dateOfBirth) : new Date();
    const age = new Date().getFullYear() - dob.getFullYear();

    return {
        ...data,
        id: data.id,
        name: data.name || 'N/A',
        initials: data.name ? data.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'NA',
        age: `${age} years`,
        email: data.email || 'N/A',
        phone: data.phone || 'N/A',
        status: 'Active' as const,
        registrationDate: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A',
        lastLogin: 'Today', // This would come from auth or a separate field
    } as Patient;
};

const tabs = [
    { name: "Overview", icon: User }, { name: "Messages", icon: MessageSquare },
    { name: "Notes", icon: FileText }, { name: "Lab Results", icon: FlaskConical },
    { name: "Patient Info", icon: HeartPulse }, { name: "Orders", icon: Briefcase },
    { name: "Billing", icon: CreditCard },
];

export default function PatientDetailPage({ params }: { params?: Promise<{ id: string }> }) {
  const [activeTab, setActiveTab] = React.useState("Patient Info");
  const { toast } = useToast();
  const resolvedParams = params ? React.use(params) : null;

  const { data: patient, isLoading: loading, error } = useQuery<Patient | null, Error>({
    queryKey: ['patient', resolvedParams?.id],
    queryFn: () => fetchPatientData(resolvedParams?.id ?? ''),
    enabled: !!resolvedParams?.id,
  });

  React.useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching patient data', description: error.message });
    }
  }, [error, toast]);

  if (loading) return <Loading />;
  if (error || !patient) return <div className="text-center p-8">Patient not found.</div>;

  const renderTabContent = () => {
    if (!patient) {
      return <Card><CardContent className="h-96 flex items-center justify-center"><p>Please select a patient to view details.</p></CardContent></Card>;
    }
    switch(activeTab) {
        case 'Patient Info': return <PatientInfoTab patient={patient} isLoading={loading} />;
        case 'Orders': return <PatientOrdersTab patientId={resolvedParams?.id ?? ''} />;
        case 'Billing': return <PatientBillingTab patientId={resolvedParams?.id ?? ''} />;
        case 'Notes': return <PatientNotesTab patientId={resolvedParams?.id ?? ''} />;
        default: return <Card><CardContent className="h-96 flex items-center justify-center"><p>{activeTab} content goes here.</p></CardContent></Card>;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16"><AvatarFallback className="text-2xl">{patient.initials}</AvatarFallback></Avatar>
        <div>
          <h1 className="text-3xl font-bold">{patient.name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{patient.age}</span>
            <span><Mail className="h-3 w-3 inline mr-1" />{patient.email}</span>
            <span><Phone className="h-3 w-3 inline mr-1" />{patient.phone}</span>
          </div>
        </div>
      </div>
      <div className="border-b">
        <nav className="-mb-px flex space-x-6">
          {tabs.map((tab) => (
            <button key={tab.name} onClick={() => setActiveTab(tab.name)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium ${activeTab === tab.name ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              <tab.icon className="h-4 w-4" />{tab.name}
            </button>
          ))}
        </nav>
      </div>
      <div>{renderTabContent()}</div>
    </div>
  );
}
