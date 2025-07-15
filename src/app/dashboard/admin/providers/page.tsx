
"use client";

import * as React from "react";
import {
  MoreHorizontal,
  Plus,
  Search,
  ChevronDown,
  User,
  Mail,
  Phone,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight
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
import { ProviderFormModal } from "./components/provider-form-modal";

type Provider = {
  id: string;
  name: string;
  uuid: string;
  specialty: string;
  email: string;
  phone: string | null;
  status: "Active" | "Inactive";
  patientCount: number;
};

const mockProviders: Provider[] = [
  {
    id: "prov_1",
    name: "Dr. Sarah Johnson",
    uuid: "0e5ae29a-21c1-47d8-bd76-0dab3170367b",
    specialty: "Internal Medicine",
    email: "sarah.johnson@example.com",
    phone: null,
    status: "Active",
    patientCount: 0,
  },
  {
    id: "prov_2",
    name: "Dr. John Smith",
    uuid: "fce715cc-355a-4173-a173-6331fbbe5dc2",
    specialty: "Cardiology",
    email: "john.smith@example.com",
    phone: null,
    status: "Active",
    patientCount: 0,
  },
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

export default function ProvidersPage() {
    const [loading, setLoading] = React.useState(true);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingProvider, setEditingProvider] = React.useState<Provider | null>(null);

    React.useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleOpenAddModal = () => {
        setEditingProvider(null);
        setIsModalOpen(true);
    };
    
    const handleOpenEditModal = (provider: Provider) => {
        setEditingProvider(provider);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProvider(null);
    };


  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Provider Management</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground hidden md:block">
              Total: <span className="font-semibold">2</span> |
              Active: <span className="font-semibold">2</span> |
              Patients: <span className="font-semibold">0</span>
            </div>
            <Button onClick={handleOpenAddModal}>
              <Plus className="mr-2 h-4 w-4" /> Add Provider
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search providers by name, specialty, or location..." className="pl-9" />
          </div>
          <FilterDropdown
            label="All Specialties"
            options={["Internal Medicine", "Cardiology", "Dermatology"]}
          />
          <FilterDropdown
            label="All Statuses"
            options={["Active", "Inactive"]}
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"><Checkbox /></TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Patients</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                          Loading providers...
                      </TableCell>
                  </TableRow>
                ) : mockProviders.length > 0 ? (
                  mockProviders.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                          <div className="flex items-center gap-3">
                              <User className="h-5 w-5 text-muted-foreground" />
                              <div>
                                  <div className="font-medium">{provider.name}</div>
                                  <div className="text-xs text-muted-foreground">ID: {provider.uuid}</div>
                              </div>
                          </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{provider.specialty}</Badge>
                      </TableCell>
                      <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              {provider.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              No phone
                          </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{provider.status}</Badge>
                      </TableCell>
                      <TableCell>{provider.patientCount}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditModal(provider)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                      No providers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>Showing 1 to {mockProviders.length} of {mockProviders.length} results</div>
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
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <ProviderFormModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        provider={editingProvider} 
      />
    </>
  );
}
