
"use client";

import * as React from "react";
import {
  User,
  Mail,
  Phone,
  FileText,
  MessageSquare,
  FlaskConical,
  HeartPulse,
  CreditCard,
  Briefcase,
  Settings,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { PatientInfoTab } from "./components/patient-info-tab";
import { PatientOrdersTab } from "./components/patient-orders-tab";
import { PatientBillingTab } from "./components/patient-billing-tab";
import { PatientNotesTab } from "./components/patient-notes-tab";
import { PatientOverviewTab } from "./components/patient-overview-tab";
import { ViewMessageModal } from "../../messages/components/view-message-modal";
import { doc, getDoc } from "firebase/firestore";
import Loading from "./loading";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase/client";

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
    dob?: any; // Can be a Timestamp
    address?: string;
    allergies?: string[];
    medications?: string[];
    insuranceProvider?: string;
    policyNumber?: string;
};
  
type Message = {
    id: string;
    name: string;
    subject: string;
    preview: string;
    time: string;
    unread: boolean;
};

const activityLog = [
    { date: "Dec 15, 2024", description: "Account created", user: "System" },
    { date: "Dec 16, 2024", description: "Subscription activated", user: "System" },
    { date: "Dec 20, 2024", description: "Payment method updated", user: "Patient" },
    { date: "Jan 25, 2025", description: "Billing reminder sent", user: "System" },
];

const tabs = [
    { name: "Overview", icon: User },
    { name: "Messages", icon: MessageSquare },
    { name: "Notes", icon: FileText },
    { name: "Lab Results", icon: FlaskConical },
    { name: "Patient Info", icon: HeartPulse },
    { name: "Orders", icon: Briefcase },
    { name: "Billing", icon: CreditCard },
];

function AdminToolsSidebar({ isOpen, onClose, patient }: { isOpen: boolean, onClose: () => void, patient: Patient | null }) {
    if (!patient) return null;
    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[380px] sm:w-[450px] p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle>Admin Tools</SheetTitle>
                    <SheetDescription>Quick administrative actions and information for {patient.name}.</SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Patient Information</h3>
                        <Card><CardContent className="pt-4 space-y-2 text-sm">
                                <div className="flex justify-between"><span>Patient ID</span><span className="font-mono text-muted-foreground">{patient.id.substring(0,8)}...</span></div>
                                <div className="flex justify-between"><span>Registration</span><span>{patient.registrationDate}</span></div>
                                <div className="flex justify-between"><span>Last Login</span><span>{patient.lastLogin}</span></div>
                                <div className="flex justify-between items-center">
                                    <span>Status</span>
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{patient.status}</Badge>
                                </div>
                        </CardContent></Card>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">System Notes</h3>
                        <Card><CardContent className="pt-4 space-y-2">
                                <Textarea placeholder="Add administrative notes here..." rows={4} />
                                <Button size="sm" className="w-full">Save Notes</Button>
                        </CardContent></Card>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Activity Log</h3>
                         <Card><CardContent className="pt-4 space-y-3">
                            {activityLog.map((log, index) => (
                                <div key={index} className="flex items-start text-xs">
                                    <div className="w-20 text-muted-foreground">{log.date}</div>
                                    <div><p className="font-medium">{log.description}</p><p className="text-muted-foreground">{log.user}</p></div>
                                </div>
                            ))}
                            <Button variant="link" size="sm" className="p-0 h-auto">View Full Activity Log</Button>
                        </CardContent></Card>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}


export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState("Patient Info");
  const [isAdminPanelOpen, setIsAdminPanelOpen] = React.useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = React.useState(false);
  const [selectedMessage, setSelectedMessage] = React.useState<Message | null>(null);
  const [patient, setPatient] = React.useState<Patient | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchPatientData = async () => {
        if (!params.id) {
            setLoading(false);
            return;
        };
        setLoading(true);
        try {
            const patientDocRef = doc(db, "patients", params.id);
            const patientDocSnap = await getDoc(patientDocRef);

            if (patientDocSnap.exists()) {
                const data = patientDocSnap.data();
                const dob = data.dob?.toDate ? data.dob.toDate() : new Date();
                const age = new Date().getFullYear() - dob.getFullYear();

                setPatient({
                    id: patientDocSnap.id,
                    name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                    initials: `${data.firstName?.[0] || ''}${data.lastName?.[0] || ''}`,
                    age: `${age} years`,
                    email: data.email || 'N/A',
                    phone: data.phone || 'N/A',
                    status: data.status || 'Active',
                    registrationDate: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : 'N/A',
                    lastLogin: 'Today',
                    ...data
                } as Patient);
            } else {
                toast({ variant: 'destructive', title: 'Patient not found' });
            }
        } catch (error) {
            console.error("Error fetching patient data:", error);
            toast({ variant: 'destructive', title: 'Error fetching patient data' });
        } finally {
            setLoading(false);
        }
    };
    fetchPatientData();
  }, [params.id, toast]);


  const handleOpenMessageModal = (patient: Patient) => {
    const messageData: Message = {
      id: patient.id,
      name: patient.name,
      subject: `Conversation with ${patient.name}`,
      preview: 'Click to view conversation history...',
      time: new Date().toLocaleTimeString(),
      unread: false,
    };
    setSelectedMessage(messageData);
    setIsMessageModalOpen(true);
  };

  const handleCloseMessageModal = () => {
    setIsMessageModalOpen(false);
    setSelectedMessage(null);
  }

  const renderTabContent = () => {
    switch(activeTab) {
        case 'Overview': return <PatientOverviewTab />;
        case 'Patient Info': return <PatientInfoTab patient={patient} isLoading={loading} />;
        case 'Orders': return <PatientOrdersTab patientId={params.id} />;
        case 'Billing': return <PatientBillingTab patientId={params.id} />;
        case 'Notes': return <PatientNotesTab patientId={params.id} />;
        default:
            return (
                <Card>
                    <CardContent className="h-96 flex items-center justify-center">
                        <p className="text-muted-foreground">{activeTab} content goes here.</p>
                    </CardContent>
                </Card>
            );
    }
  }

  if (loading) {
    return <Loading />;
  }

  if (!patient) {
    return <div className="text-center p-8">Patient not found.</div>;
  }

  return (
    <>
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-2xl">{patient.initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{patient.name}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span>ID: {patient.id.substring(0, 8)}...</span>
              <span>{patient.age}</span>
              <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {patient.email}</span>
              <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {patient.phone}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{patient.status}</Badge>
            <Button variant="outline" size="sm">New Patient</Button>
            <Button variant="outline" size="sm">+ Tag</Button>
            <div className="ml-4 flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setIsAdminPanelOpen(true)}><Settings className="h-4 w-4 mr-2" />Admin</Button>
                <Button size="sm" onClick={() => handleOpenMessageModal(patient)}>Message</Button>
            </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap
                ${activeTab === tab.name
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Content based on active tab */}
      <div>
        {renderTabContent()}
      </div>

    </div>
    <AdminToolsSidebar isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} patient={patient} />
    <ViewMessageModal 
        isOpen={isMessageModalOpen}
        onClose={handleCloseMessageModal}
        conversation={selectedMessage as any}
      />
    </>
  );
}
