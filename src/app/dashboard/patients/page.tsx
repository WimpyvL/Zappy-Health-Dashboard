
"use client";

import * as React from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  PlusCircle,
  Search,
  ChevronDown,
  Edit,
  MessageSquare,
  Check,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PatientFormModal } from "./components/patient-form-modal";
import { ViewMessageModal } from "../messages/components/view-message-modal";


type Patient = {
  id: string;
  name: string;
  email: string;
  status: "Active" | "Inactive" | "Pending";
  plan: string;
  lastActive: string;
  orders: number;
  tags: string[];
  phone?: string;
  dob?: Date;
  address?: string;
  pharmacy?: string;
  insuranceProvider?: string;
  policyNumber?: string;
  groupNumber?: string;
  insuranceHolder?: string;
};

// This type is used by ViewMessageModal, which expects a message object.
// We'll adapt the patient object to fit this structure for now.
type Message = {
  id: string;
  name: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
};

const mockPatients: Patient[] = [
  {
    id: "patient1",
    name: "John Doe",
    email: "john.doe@example.com",
    status: "Active",
    plan: "None",
    lastActive: "N/A",
    orders: 0,
    tags: [],
    phone: "1-555-123-4567",
    dob: new Date("1990-05-15"),
    address: "123 Main St, Anytown, USA",
  },
  // Add more mock patients here if needed
];

const FilterDropdown = ({
  label,
  options,
}: {
  label: string;
  options: string[];
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" className="flex items-center gap-2">
        {label}
        <ChevronDown className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {options.map((option) => (
        <DropdownMenuItem key={option}>{option}</DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

export default function PatientsPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingPatient, setEditingPatient] = React.useState<Patient | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = React.useState(false);
  const [selectedMessage, setSelectedMessage] = React.useState<Message | null>(null);

  const handleOpenAddModal = () => {
    setEditingPatient(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPatient(null);
  };

  const handleOpenMessageModal = (patient: Patient) => {
    // Adapt patient data to the Message type for the modal
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

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Patients</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-semibold">{mockPatients.length}</span>{" "}
              Showing:{" "}
              <span className="font-semibold">{mockPatients.length}</span>
            </div>
            <Button onClick={handleOpenAddModal}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search patients..." className="pl-9" />
          </div>
          <FilterDropdown
            label="All Plans"
            options={["Premium", "Basic", "None"]}
          />
          <FilterDropdown
            label="All Medications"
            options={["Medication A", "Medication B"]}
          />
          <FilterDropdown
            label="All Statuses"
            options={["Active", "Inactive", "Pending"]}
          />
          <FilterDropdown label="All Tags" options={["VIP", "Follow-up"]} />
        </div>

        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox />
                  </TableHead>
                  <TableHead>Patient Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Orders & Rx</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/patients/${patient.id}`} className="font-medium text-primary hover:underline">{patient.name}</Link>
                      <div className="text-sm text-muted-foreground">
                        {patient.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          patient.status === "Active" ? "default" : "secondary"
                        }
                        className="bg-green-100 text-green-800 hover:bg-green-200"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        {patient.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {patient.tags.length > 0
                        ? patient.tags.join(", ")
                        : "N/A"}
                    </TableCell>
                    <TableCell>{patient.plan}</TableCell>
                    <TableCell>{patient.lastActive}</TableCell>
                    <TableCell>
                      <div>{patient.orders}</div>
                      <div className="text-xs text-muted-foreground">N/A</div>
                      <div className="text-xs text-muted-foreground">N/A</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenEditModal(patient)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenMessageModal(patient)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing 1 to {mockPatients.length} of {mockPatients.length} results
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Show:</span>
              <Select defaultValue="10">
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>per page</span>
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                <ChevronDown className="h-4 w-4 rotate-90" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <PatientFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        patient={editingPatient}
      />
       <ViewMessageModal 
        isOpen={isMessageModalOpen}
        onClose={handleCloseMessageModal}
        message={selectedMessage}
      />
    </>
  );
}
