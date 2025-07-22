
"use client";

import * as React from "react";
import {
  MoreHorizontal,
  Plus,
  Search,
  ChevronDown,
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
  DropdownMenuLabel,
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
import { UploadInsuranceDocumentModal } from "./components/upload-insurance-document-modal";
import { collection, getDocs, addDoc, query, orderBy, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { db } from "@/lib/firebase";

type Document = {
  id: string;
  documentTitle: string;
  documentType: string;
  patientName: string;
  policyNumber?: string;
  uploadDate: string;
  status: "Active" | "Pending" | "Expired";
};


const StatusBadge = ({ status }: { status: string }) => {
  const statusMap: { [key: string]: { className: string; label: string } } = {
    "Active": { className: "bg-green-100 text-green-800", label: "Active" },
    "Pending": { className: "bg-yellow-100 text-yellow-800", label: "Pending" },
    "Expired": { className: "bg-red-100 text-red-800", label: "Expired" },
  };

  const currentStatus = statusMap[status] || { className: "bg-gray-100 text-gray-800", label: "Unknown" };

  return (
    <Badge variant="secondary" className={`${currentStatus.className} hover:${currentStatus.className}`}>
      {currentStatus.label}
    </Badge>
  );
};

export default function InsurancePage() {
    const [documents, setDocuments] = React.useState<Document[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);
    const { toast } = useToast();

    const fetchDocuments = async () => {
        setLoading(true);
        try {
          const docsCollection = collection(db, "insurance_documents");
          const docsSnapshot = await getDocs(query(docsCollection, orderBy("uploadDate", "desc")));
          const docsList = docsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              uploadDate: data.uploadDate ? format(data.uploadDate.toDate(), "MMM dd, yyyy") : "N/A",
            } as Document;
          });
          setDocuments(docsList);
        } catch (error) {
          console.error("Error fetching insurance documents: ", error);
          toast({
            variant: "destructive",
            title: "Error fetching documents",
            description: "Could not retrieve insurance document data from the database.",
          });
        } finally {
          setLoading(false);
        }
      };
    
      React.useEffect(() => {
        fetchDocuments();
      }, []);

      const handleUpload = async (values: any) => {
        try {
          await addDoc(collection(db, "insurance_documents"), {
            ...values,
            status: "Pending", // Default status for new documents
            uploadDate: Timestamp.now(),
          });
          toast({
            title: "Document Uploaded",
            description: `Document for ${values.patientName} has been uploaded successfully.`,
          });
          fetchDocuments();
          setIsUploadModalOpen(false);
        } catch (error) {
          console.error("Error uploading document: ", error);
          toast({
            variant: "destructive",
            title: "Upload Failed",
            description: "An error occurred while uploading the document.",
          });
        }
      };


  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Insurance Documentation</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground hidden md:block">
            Total: <span className="font-semibold">{documents.length}</span> |
            Active: <span className="font-semibold">{documents.filter(d => d.status === "Active").length}</span> |
            Pending: <span className="font-semibold">{documents.filter(d => d.status === "Pending").length}</span>
          </div>
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Upload Document
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search insurance documents by patient or policy #..." className="pl-9" />
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
                All Types
                <ChevronDown className="h-4 w-4" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem>Insurance Card</DropdownMenuItem>
                <DropdownMenuItem>Prior Authorization</DropdownMenuItem>
                <DropdownMenuItem>Claim Form</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
                All Statuses
                <ChevronDown className="h-4 w-4" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem>Active</DropdownMenuItem>
                <DropdownMenuItem>Pending</DropdownMenuItem>
                <DropdownMenuItem>Expired</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Policy Number</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                    Loading documents...
                  </TableCell>
                </TableRow>
              ) : documents.length > 0 ? (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.documentTitle}</TableCell>
                    <TableCell>{doc.documentType}</TableCell>
                    <TableCell>{doc.patientName}</TableCell>
                    <TableCell>{doc.policyNumber || "N/A"}</TableCell>
                    <TableCell>{doc.uploadDate}</TableCell>
                    <TableCell>
                      <StatusBadge status={doc.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View Document</DropdownMenuItem>
                          <DropdownMenuItem>Verify</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                    No documents found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    <UploadInsuranceDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />
    </>
  );
}
