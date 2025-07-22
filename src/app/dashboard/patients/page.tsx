
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
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from '@/dataconnect-generated/js/default-connector'

// Import the new centralized service hooks
import { useCreatePatient, useUpdatePatient, Patient } from "@/services/database/hooks";
import { useListUsers } from "@firebasegen/default-connector/react";


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
  const { toast } = useToast();

  // Use the new centralized hooks
  const { data: queryData, isLoading: loading, error } = useListUsers();
  const patients = queryData?.users;
  const createPatientMutation = useCreatePatient();
  const updatePatientMutation = useUpdatePatient();

  const handleOpenAddModal = () => {
    setEditingPatient(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (createPatientMutation.isPending || updatePatientMutation.isPending) return;
    setIsModalOpen(false);
    setEditingPatient(null);
  };

  const handleFormSubmit = async (values: any) => {
    const patientData = { ...values };
      
    if (editingPatient) {
      updatePatientMutation.mutate({ id: editingPatient.id, ...patientData }, {
        onSuccess: () => {
          toast({
            title: "Patient Updated",
            description: `${values.firstName} ${values.lastName}'s information has been saved.`,
          });
          handleCloseModal();
        },
        onError: (e: Error) => {
           toast({
            variant: "destructive",
            title: "Error Saving Patient",
            description: e.message || "An error occurred while saving the patient information. Please try again.",
          });
        }
      });
    } else {
      createPatientMutation.mutate(patientData, {
        onSuccess: () => {
          toast({
            title: "Patient Added",
            description: `${values.firstName} ${values.lastName} has been added to the system.`,
          });
          handleCloseModal();
        },
        onError: (e: Error) => {
          toast({
            variant: "destructive",
            title: "Error Saving Patient",
            description: e.message || "An error occurred while saving the patient information. Please try again.",
          });
        }
      });
    }
  };

  const handleOpenMessageModal = (patient: Patient) => {
    const messageData: Message = {
      id: patient.id,
      name: `${patient.firstName} ${patient.lastName}`,
      subject: `Conversation with ${patient.firstName} ${patient.lastName}`,
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

  const isSubmitting = createPatientMutation.isPending || updatePatientMutation.isPending;
  
  if (error) {
    toast({
        variant: "destructive",
        title: "Error loading patients",
        description: error.message
    });
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Patients</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-semibold">{patients?.length || 0}</span>{" "}
              Showing:{" "}
              <span className="font-semibold">{patients?.length || 0}</span>
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
          <CardContent className="p-0">
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
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Checkbox disabled /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-12 rounded-md" /></TableCell>
                      <TableCell><div className="flex gap-2"><Skeleton className="h-8 w-8 rounded-md" /><Skeleton className="h-8 w-8 rounded-md" /></div></TableCell>
                    </TableRow>
                  ))
                ) : (
                  patients?.map((patient: User) => (
                  <TableRow key={patient.authId}>
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/patients/${patient.authId}`} className="font-medium text-primary hover:underline">{`${patient.firstName} ${patient.lastName}`}</Link>
                      <div className="text-sm text-muted-foreground">
                        {patient.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={"default"}
                        className={"bg-green-100 text-green-800 hover:bg-green-200"}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        {"Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      N/A
                    </TableCell>
                    <TableCell>N/A</TableCell>
                    <TableCell>N/A</TableCell>
                    <TableCell>
                      <div>{0}</div>
                      <div className="text-xs text-muted-foreground">N/A</div>
                      <div className="text-xs text-muted-foreground">N/A</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenEditModal(patient as any)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenMessageModal(patient as any)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing 1 to {patients?.length || 0} of {patients?.length || 0} results
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
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
       <ViewMessageModal 
        isOpen={isMessageModalOpen}
        onClose={handleCloseMessageModal}
        conversation={selectedMessage}
      />
    </>
  );
}

