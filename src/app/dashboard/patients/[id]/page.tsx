
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
  ChevronDown,
  ArrowRight,
  Briefcase,
  Sparkles,
  Package,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { PatientInfoTab } from "./components/patient-info-tab";

const patient = {
    id: "patient1",
    name: "John Doe",
    initials: "JD",
    age: "Unknown years",
    email: "john.doe@example.com",
    phone: "123-456-7890",
    status: "Active",
    registrationDate: "Dec 15, 2024",
    lastLogin: "Today, 12:45 PM",
    currentPlan: "No active subscription",
    billingCycle: "No billing info",
    nextBilling: "Feb 1, 2025",
    outstandingBalance: 127.50,
};

const timelineEvents = [
    { date: "7/15/2025", title: "Patient profile accessed", description: "Provider reviewed patient information" },
    { date: "7/14/2025", title: "Account created", description: "Patient registered in system" },
    { date: "7/8/2025", title: "Initial consultation scheduled", description: "Upcoming appointment scheduled" },
];

const activityLog = [
    { date: "Dec 15, 2024", description: "Account created", user: "System" },
    { date: "Dec 16, 2024", description: "Subscription activated", user: "System" },
    { date: "Dec 20, 2024", description: "Payment method updated", user: "Patient" },
    { date: "Jan 25, 2025", description: "Billing reminder sent", user: "System" },
]

const activeOrders = [
    { title: "No active medications", description: "Auto-refill • 2 refills remaining • Next: Jan 15", status: "Active", statusColor: "green" },
    { title: "No additional medications", description: "Sent to CVS Main Street • Today 3:45 PM", status: "Sent", statusColor: "blue" },
]

const upcomingSessions = [
    { title: "Weight Management Check-in", time: "Tomorrow • 2:00 PM • Virtual Visit" },
    { title: "Follow-up Consultation", time: "Feb 15, 2025 • 10:30 AM • Virtual Session" },
]

const tabs = [
    { name: "Overview", icon: User },
    { name: "Messages", icon: MessageSquare },
    { name: "Notes", icon: FileText },
    { name: "Lab Results", icon: FlaskConical },
    { name: "Patient Info", icon: HeartPulse },
    { name: "Orders", icon: Briefcase },
    { name: "Billing", icon: CreditCard },
];

function AdminToolsSidebar({ isOpen, onClose, patient }: { isOpen: boolean, onClose: () => void, patient: any }) {
    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[380px] sm:w-[450px] p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle>Admin Tools</SheetTitle>
                    <SheetDescription>Quick administrative actions and information for {patient.name}.</SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Patient Information */}
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Patient Information</h3>
                        <Card>
                            <CardContent className="pt-4 space-y-2 text-sm">
                                <div className="flex justify-between"><span>Patient ID</span><span className="font-mono text-muted-foreground">{patient.id}</span></div>
                                <div className="flex justify-between"><span>Registration</span><span>{patient.registrationDate}</span></div>
                                <div className="flex justify-between"><span>Last Login</span><span>{patient.lastLogin}</span></div>
                                <div className="flex justify-between items-center">
                                    <span>Status</span>
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active - Premium</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Billing & Subscription */}
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Billing & Subscription</h3>
                        <Card>
                            <CardContent className="pt-4 space-y-2 text-sm">
                                <div className="flex justify-between"><span>Current Plan</span><span className="text-muted-foreground">{patient.currentPlan}</span></div>
                                <div className="flex justify-between"><span>Billing Cycle</span><span className="text-muted-foreground">{patient.billingCycle}</span></div>
                                <div className="flex justify-between"><span>Next Billing</span><span>{patient.nextBilling}</span></div>
                                <div className="flex justify-between items-center">
                                    <span>Outstanding Balance</span>
                                    <span className="font-semibold text-destructive">${patient.outstandingBalance.toFixed(2)}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex flex-col gap-2 pt-2">
                                     <Button variant="outline" size="sm">Manage Billing</Button>
                                     <Button variant="outline" size="sm">Change Subscription</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* System Notes */}
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">System Notes</h3>
                        <Card>
                            <CardContent className="pt-4 space-y-2">
                                <Textarea placeholder="Add administrative notes here..." rows={4} />
                                <Button size="sm" className="w-full">Save Notes</Button>
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Activity Log */}
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Activity Log</h3>
                         <Card>
                            <CardContent className="pt-4 space-y-3">
                                {activityLog.map((log, index) => (
                                    <div key={index} className="flex items-start text-xs">
                                        <div className="w-20 text-muted-foreground">{log.date}</div>
                                        <div>
                                            <p className="font-medium">{log.description}</p>
                                            <p className="text-muted-foreground">{log.user}</p>
                                        </div>
                                    </div>
                                ))}
                                <Button variant="link" size="sm" className="p-0 h-auto">View Full Activity Log</Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}


export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState("Patient Info");
  const [isAdminPanelOpen, setIsAdminPanelOpen] = React.useState(false);

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
              <span>ID: {patient.id}</span>
              <span>{patient.age}</span>
              <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {patient.email}</span>
              <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {patient.phone}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>
            <Button variant="outline" size="sm">New Patient</Button>
            <Button variant="outline" size="sm">+ Tag</Button>
            <div className="ml-4 flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setIsAdminPanelOpen(true)}>Admin</Button>
                <Button size="sm">Message</Button>
            </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors
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
        {activeTab === 'Patient Info' && <PatientInfoTab />}
        {activeTab !== 'Patient Info' && (
             <Card>
                <CardContent className="h-96 flex items-center justify-center">
                    <p className="text-muted-foreground">{activeTab} content goes here.</p>
                </CardContent>
            </Card>
        )}
      </div>

    </div>
    <AdminToolsSidebar isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} patient={patient} />
    </>
  );
}
