
"use client";

import * as React from "react";
import { MoreHorizontal, Plus, Search, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UploadInsuranceDocumentModal } from "./components/upload-insurance-document-modal";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '@/services/database';
import { Skeleton } from "@/components/ui/skeleton";

type Document = {
  id: string;
  documentTitle: string;
  documentType: string;
  patientName: string;
  policyNumber?: string;
  uploadDate: string;
  status: "Active" | "Pending" | "Expired";
};

const fetchDocuments = async () => {
    const response = await dbService.getAll<any>('insurance_documents', { sortBy: 'uploadDate', sortDirection: 'desc' });
    if (response.error || !response.data) throw new Error(response.error || 'Failed to fetch documents');
    return response.data.map((doc: any) => ({
        ...doc,
        uploadDate: doc.uploadDate ? format(doc.uploadDate.toDate(), "MMM dd, yyyy") : "N/A",
    }));
};

const uploadDocument = async (values: any) => {
    const newDoc = { ...values, status: "Pending" };
    const response = await dbService.create('insurance_documents', newDoc);
    if (response.error) throw new Error(response.error);
    return response.data;
};

const StatusBadge = ({ status }: { status: string }) => {
  const statusMap: { [key: string]: { className: string; label: string } } = {
    "Active": { className: "bg-green-100 text-green-800", label: "Active" },
    "Pending": { className: "bg-yellow-100 text-yellow-800", label: "Pending" },
    "Expired": { className: "bg-red-100 text-red-800", label: "Expired" },
  };
  const currentStatus = statusMap[status] || { className: "bg-gray-100 text-gray-800", label: "Unknown" };
  return <Badge variant="secondary" className={`${currentStatus.className} hover:${currentStatus.className}`}>{currentStatus.label}</Badge>;
};

export default function InsurancePage() {
    const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: documents = [], isLoading: loading } = useQuery<Document[], Error>({
        queryKey: ['insuranceDocuments'],
        queryFn: fetchDocuments,
        onError: (error) => toast({ variant: "destructive", title: "Error fetching documents", description: error.message }),
    });

    const uploadMutation = useMutation({
        mutationFn: uploadDocument,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['insuranceDocuments'] });
            toast({ title: "Document Uploaded", description: `Document for ${data?.patientName} has been uploaded.` });
            setIsUploadModalOpen(false);
        },
        onError: (error: Error) => toast({ variant: "destructive", title: "Upload Failed", description: error.message }),
    });

  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Insurance Documentation</h1>
        <Button onClick={() => setIsUploadModalOpen(true)}><Plus className="mr-2 h-4 w-4" /> Upload Document</Button>
      </div>
      {/* Search and filter UI remains the same */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                ))
              ) : documents.length > 0 ? (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.documentTitle}</TableCell>
                    <TableCell>{doc.patientName}</TableCell>
                    <TableCell><StatusBadge status={doc.status} /></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Document</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="h-48 text-center">No documents found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    <UploadInsuranceDocumentModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUpload={uploadMutation.mutate} />
    </>
  );
}
