
"use client";

import * as React from "react";
import { User, Mail, Phone, FileText, MessageSquare, FlaskConical, HeartPulse, CreditCard, Briefcase, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { PatientInfoTab } from "./components/patient-info-tab";
import { PatientOrdersTab } from "./components/patient-orders-tab";
import { PatientBillingTab } from "./components/patient-billing-tab";
import { PatientNotesTab } from "./components/patient-notes-tab";
import { PatientOverviewTab } from "./components/patient-overview-tab";
import { ViewMessageModal } from "../../messages/components/view-message-modal";
import Loading from "./loading";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from '@tanstack/react-query';
import { dbService } from '@/services/database/index';

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
    const response = await dbService.getById<any>('patients', patientId);
    if (response.error || !response.data) throw new Error(response.error || 'Patient not found');
    
    const data = response.data;
    const dob = data.dob?.toDate ? data.dob.toDate() : new Date();
    const age = new Date().getFullYear() - dob.getFullYear();

    return {
        id: data.id,
        name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        initials: `${data.firstName?.[0] || ''}${data.lastName?.[0] || ''}`,
        age: `${age} years`,
        email: data.email || 'N/A',
        phone: data.phone || 'N/A',
        status: data.status || 'Active',
        registrationDate: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : 'N/A',
        lastLogin: 'Today', // This would come from auth or a separate field
        ...data
    } as Patient;
};

const tabs = [
    { name: "Overview", icon: User }, { name: "Messages", icon: MessageSquare },
    { name: "Notes", icon: FileText }, { name: "Lab Results", icon: FlaskConical },
    { name: "Patient Info", icon: HeartPulse }, { name: "Orders", icon: Briefcase },
    { name: "Billing", icon: CreditCard },
];

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState("Patient Info");
  const { toast } = useToast();

  const { data: patient, isLoading: loading, error } = useQuery<Patient | null, Error>({
    queryKey: ['patient', params.id],
    queryFn: () => fetchPatientData(params.id),
    enabled: !!params.id,
    onError: (err) => toast({ variant: 'destructive', title: 'Error fetching patient data', description: err.message }),
  });

  if (loading) return <Loading />;
  if (error || !patient) return <div className="text-center p-8">Patient not found.</div>;

  const renderTabContent = () => {
    switch(activeTab) {
        case 'Patient Info': return <PatientInfoTab patient={patient} isLoading={loading} />;
        case 'Orders': return <PatientOrdersTab patientId={params.id} />;
        case 'Billing': return <PatientBillingTab patientId={params.id} />;
        case 'Notes': return <PatientNotesTab patientId={params.id} />;
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
